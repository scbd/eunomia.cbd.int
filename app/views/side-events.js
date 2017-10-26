define(['app','lodash','moment',
'services/mongo-storage',
    'directives/date-picker',
  'directives/sorter',
  'filters/moment',
    'filters/propsFilter',
    'filters/htmlToPlaintext',  'filters/truncate',
'ngDialog',
'ui.select',


], function(app, _,moment) {

return  ['$scope','$document','mongoStorage','ngDialog','$rootScope','$timeout','eventGroup','$location','$q','user','$http',function($scope,$document,mongoStorage,ngDialog,$rootScope,$timeout,conference,$location,$q,user,$http) {
      var docDefinition = { content: '' };
      var _ctrl = this;

      _ctrl.pdf = function(){

        //generatePdf();
        getPDFReservations();

      };

      _ctrl.conference=conference;

      _ctrl.count = 0;
      _ctrl.options = {};
      _ctrl.sort = {'title':1};
      _ctrl.venueId = conference.venueId;
      _ctrl.itemsPerPage=50;
      _ctrl.currentPage=0;
      _ctrl.pages=[];
      _ctrl.onPage = query;
      _ctrl.changeDate=changeDate;
      _ctrl.getRoom = getRoom;
      _ctrl.getType = getType;
      _ctrl.toggleFields=toggleFields;
      _ctrl.isFieldSelect=isFieldSelect;
      _ctrl.getPrefix=getPrefix;
      _ctrl.hasDayChange = hasDayChange;
      _ctrl.updateFields=updateFields;
      _ctrl.setStausFilter=setStausFilter
      _ctrl.searchText='';
      _ctrl.searchType=[];
      _ctrl.searchRoom=[];
      _ctrl.showFields=false;
      _ctrl.sort = {'start':1};
      _ctrl.selectFields=['Date','Title','Contact','Modified'];
      _ctrl.fields=[{title:'Title'},{title:'Date'},{title:'Contact'},{title:'Modified'}];
      $timeout(init);
      // $scope.$watch('reservationsCtrl.sort',function(){
      //   query();
      // });
      return this;


        //============================================================
        //
        //============================================================
        function init() {
          _ctrl.statusFilter={all:true,request:false,public:false,scheduled:false,archived:false,deleted:false,draft:false}


            $q.all([loadRooms(), loadTypes()]).then(querySideEvents);

        } //init

        //============================================================
        //
        //============================================================
        function querySideEvents(){

                      moment.tz.setDefault(conference.timezone);
                      _ctrl.conference.startObj = moment(conference.schedule.start);
                      _ctrl.conference.endObj = moment(conference.schedule.end);

                      if(localStorage.getItem('reservations-colums'))
                        _ctrl.selectFields=JSON.parse(localStorage.getItem('reservations-colums'));
                      else
                          localStorage.setItem('reservations-colums', JSON.stringify(_ctrl.selectFields));

                      if ($location.search().start) {
                          _ctrl.startFilter = moment(new Date($location.search().start)).format('YYYY-MM-DD HH:mm');
                          if($location.search().end)
                          _ctrl.endFilter = moment(new Date($location.search().end)).format('YYYY-MM-DD HH:mm');
                      }


                      var statProm = _ctrl.setStausFilter($location.search().status,true)
                      if ($location.search().searchText)
                          _ctrl.searchText = $location.search().searchText

                      if ($location.search().searchType)
                          _ctrl.searchType = $location.search().searchType

                      if ($location.search().searchRoom)
                          _ctrl.searchRoom = $location.search().searchRoom

                      if ($location.search().itemsPerPage)
                          _ctrl.itemsPerPage = Number($location.search().itemsPerPage);

                      $q.all([statProm]).then(function(){query(0,true).then(query)})
        }//itemSelected

      //============================================================
      //
      //============================================================
      function getPrefix(item){

        var meeting = _.find(conference.meetings,{EVT_CD:item.meeting});
        if(!meeting) return '';
        return meeting.agenda.prefix;
      }//itemSelected

      //============================================================
      //
      //============================================================
      function updateFields(){
        localStorage.setItem('reservations-colums', JSON.stringify(_ctrl.selectFields));
      }//itemSelected

      //============================================================
      //
      //============================================================
      function hasDayChange(dayOne, dayTwo){
        if(!dayTwo || !dayOne) return false;

        if(!moment(dayOne).startOf('day').isSame(moment(dayTwo).startOf('day')))
          return true;
      }//itemSelected


      //=======================================================================
      //
      //=======================================================================
      function query(pageIndex, facitsOnly) {
        if (!pageIndex || pageIndex < 0 || Array.isArray(pageIndex)) pageIndex = 0;

        _ctrl.loading = true;
        //readQueryString ();
        var queryParameters = {
          'q': buildQuery(facitsOnly), //buildQuery(),//buildQuery(),
          'sort': 'createdDate_dt desc',
          //  'fl':'key_s,identifier_s',
          //            'fl': 'thematicArea*,googleMapsUrl_s,country*,relevantInformation*,logo*,treaty*,id,title_*,hostGovernments*,description_t,url_ss,schema_EN_t,date_dt,government_EN_t,schema_s,number_d,aichiTarget_ss,reference_s,sender_s,meeting_ss,recipient_ss,symbol_s,city_EN_t,eventCity_EN_t,eventCountry_EN_t,country_EN_t,startDate_s,endDate_s,body_s,code_s,meeting_s,group_s,function_t,department_t,organization_t,summary_EN_t,reportType_EN_t,completion_EN_t,jurisdiction_EN_t,development_EN_t',
          'wt': 'json',
          'start': (_ctrl.currentPage * _ctrl.itemsPerPage) || 0, //$scope.currentPage * $scope.$scope.itemsPerPage,
          'rows': _ctrl.itemsPerPage,
          'facet': facitsOnly,
          'facet.field': ['_state_s'],
          'facet.limit': 999999,
          'facet.mincount': 1
        };
        if (facitsOnly) queryParameters.rows = 0;

        return $http.get('/api/v2013/index/select', {
          params: queryParameters
        }).success(function(data) {

          canceler = null;

          if (!_ctrl.count || _ctrl.count < data.response.numFound)
            _ctrl.count = data.response.numFound;

          _ctrl.start = data.response.start;
          _ctrl.stop = data.response.start + data.response.docs.length - 1;
          _ctrl.rows = data.response.docs.length;

          if (facitsOnly) {
            _ctrl.facits = {}
            _ctrl.facits.states = readFacets(data.facet_counts.facet_fields._state_s);
          }
          refreshPager(pageIndex)
          _ctrl.docs = data.response.docs;

          changeDate()
          _ctrl.loading = false;

        });
      } // query
      //=======================================================================
       //
       //=======================================================================
       function readFacets(solrArray) {
            var facets = {};
              if(solrArray)
                  for (var i = 0; i < solrArray.length; i += 2) {
                      var facet = solrArray[i];
                      facets[facet] = { symbol: facet, title: facet, count: solrArray[i + 1] }
                  }
              return facets;
        };//$scope.readFacets2
      //=======================================================================
      //
      //=======================================================================
      function buildQuery (facitsOnly) {
          var q = [];

          q.push('private_s:EunoAdministrator,Administrator')
          q.push('schema_s:sideEvent')
          q.push(`conference_s:${_ctrl.conference._id}`)

          if(facitsOnly)
            return q.join(' AND ')

          if(getStatusFilter()) q.push(`_state_s:${getStatusFilter()}`)


          if($location.search().searchType) {
              if(!_.isArray($location.search().searchType))
                  _ctrl.searchType=[$location.search().searchType];
              else
                  _ctrl.searchType=$location.search().searchType;

              q.push('(subType_s:'+_ctrl.searchType.join(' OR subType_s:')+')')
          }
          //
          if($location.search().searchRoom) {

              if(!_.isArray($location.search().searchRoom))
                  _ctrl.searchRoom=[$location.search().searchRoom];
              else
                  _ctrl.searchRoom=$location.search().searchRoom;

              q.push('(reservationRoom_s:'+_ctrl.searchType.join(' OR reservationRoom_s:')+')')
          }
          // //
          if($location.search().searchText ){
              _ctrl.searchText = $location.search().searchText;
              q.push(`text_EN_txt:${_ctrl.searchText}`)
          }
          //
          if($location.search().start)
              _ctrl.start = $location.search().start;
          //
          if($location.search().start)
              _ctrl.end = $location.search().end;

          if(_ctrl.start && !_ctrl.end)
            q.push(`reservationStart_dt:[${moment.utc(new Date(_ctrl.start)).format()} TO *]`)

          if(_ctrl.start && _ctrl.end )
            q.push(`reservationStart_dt:[ ${moment.utc(new Date(_ctrl.start)).format()} TO ${moment.utc(new Date(_ctrl.end)).format()}]`)

          if(Array.isArray(q))
            return q.join(' AND ');
          else
            return ' '
      }

      //======================================================
      //
      //======================================================
      function refreshPager(currentPage)
      {
        currentPage = currentPage || 0;

        var pageCount = Math.ceil(Math.max(_ctrl.count||0, 0) / Number(_ctrl.itemsPerPage))-1;

        var pages     = [];
        var start = 0;
        var end = (pageCount<5)? pageCount:5;

        if(currentPage > 0 && currentPage <=pageCount && (pageCount>=5)){
          start = currentPage-2;
          end = currentPage+2;
          if(end>pageCount)
            end = pageCount;



          for (var i = start; i <= end; i++) {
              pages.push({ index : i, text : i+1 });
          }
        }else{
          if(pageCount<5) end++;
          for (var i = start; i < end; i++) {  //jshint ignore:line
              pages.push({ index : i, text : i+1 });
          }
        }

          _ctrl.currentPage = currentPage;
          _ctrl.pages       = pages;
          _ctrl.pageCount   = pageCount ;
      }

            //============================================================
            //
            //============================================================
            function setStausFilter(status, noQuery) {
              return new Promise(function(resolve, reject) {
                $timeout(function() {
                  if(!status) return resolve(false)
                  for (var s in _ctrl.statusFilter)
                    _ctrl.statusFilter[s] = false

                  _ctrl.statusFilter[status] = true

                  if (!noQuery)
                    changeDate()

                  return resolve(resolve)
                })
              })


            }
            //============================================================
            //
            //============================================================
            function getStatusFilter() {

              for(var s in _ctrl.statusFilter){
                if(s!=='all' && _ctrl.statusFilter[s]) return s
              }
              return false

            }
      //============================================================
      //
      //============================================================
      function changeDate() {
        if(_ctrl.startFilter)
          _ctrl.startFilterObj = moment(_ctrl.startFilter,'YYYY-MM-DD HH:mm');
        if(_ctrl.endFilter)
          _ctrl.endFilterObj   = moment(_ctrl.endFilter,'YYYY-MM-DD HH:mm');


        var search = {};
        if(_ctrl.endFilterObj)
        search.end = moment(_ctrl.endFilter,'YYYY-MM-DD HH:mm').format()

        if(_ctrl.startFilter)
        search.start = moment(_ctrl.startFilter,'YYYY-MM-DD HH:mm').format()

        if(getStatusFilter()) search.status = getStatusFilter()

        if(_ctrl.searchText)search.searchText=_ctrl.searchText;

        if(!_.isEmpty(_ctrl.searchType))
          search.searchType=_ctrl.searchType;

        if(!_.isEmpty(_ctrl.searchRoom))
            search.searchRoom=_ctrl.searchRoom;

        if(_ctrl.itemsPerPage)
            search.itemsPerPage=_ctrl.itemsPerPage;

        $location.search(search);
      }
      //=====

      //============================================================
      //q, pageNumber,pageLength,count,sort
      //============================================================
      function loadRooms() {

        if(_ctrl.conference.rooms && !_.isEmpty(_ctrl.conference.rooms)){
          return $q(function(resolve){resolve(true)});
        }
        var q = {'venue':_ctrl.venueId,'meta.status':{'$nin':['deleted','archived']}};
        return mongoStorage.loadDocs('venue-rooms',q,0,100000,false,_ctrl.sort).then(function(result) {

                 _ctrl.conference.rooms =result.data;
        }).catch(onError);
      }
      //============================================================
      //
      //============================================================
      function isFieldSelect(field) {
          return (_ctrl.selectFields.indexOf(field)>-1);
      }

      //============================================================
      //
      //============================================================
      function toggleFields() {

          _ctrl.showFields=!_ctrl.showFields;
      }
      //============================================================
      //q, pageNumber,pageLength,count,sort
      //============================================================
      function getRoom(id,property) {

          var room = _.find(_ctrl.conference.rooms ,{_id:id});

          if(!room) return'';
          if(!property) return room;
          return room[property];
      }
      //============================================================
      //q, pageNumber,pageLength,count,sort
      //============================================================
      function getType(id,schema,property) {
          if(!_ctrl.conference.types) return '';
          var type = _.find(_ctrl.conference.types[schema] ,{_id:id});

          if(!type) return'';
          if(!property) return type;
          return type[property];
      }
      //============================================================
      //
      //============================================================
      function loadTypes() {

        if(_ctrl.conference.types &&_ctrl.conference.types.sideEvents && !_.isEmpty(_ctrl.conference.types.sideEvents)){
          return $q(function(resolve){resolve(true)});
        }
        var q = {schema:'reservations', parent:'570fd0a52e3fa5cfa61d90ee'};
        return mongoStorage.loadDocs('types',q,0,100000,false).then(function(result) {
                 _ctrl.conference.types={};
                 _ctrl.conference.types.sideEvents =result.data;

        }).catch(onError);
      } //triggerChanges





      //============================================================
      //
      //============================================================
      function onError (res) {
          var status,error;
         status = "error";
        if (res.status === -1) {
           error = "The URI " + res.config.url + " could not be resolved.  This could be caused form a number of reasons.  The URI does not exist or is erroneous.  The server located at that URI is down.  Or lastly your internet connection stopped or stopped momentarily. ";
          if (res.data && res.data.message)
             error += " Message Detail: " + res.data.message;
        }
        if (res.status == "notAuthorized") {
           error = "You are not authorized to perform this action: [Method:" + res.config.method + " URI:" + res.config.url + "]";
          if (res.data.message)
             error += " Message Detail: " + res.data.message;
        } else if (res.status == 404) {
           error = "The server at URI: " + res.config.url + " has responded that the record was not found.";
          if (res.data.message)
             error += " Message Detail: " + res.data.message;
        } else if (res.status == 500) {
           error = "The server at URI: " + res.config.url + " has responded with an internal server error message.";
          if (res.data.message)
             error += " Message Detail: " + res.data.message;
        } else if (res.status == "badSchema") {
           error = "Record type is invalid meaning that the data being sent to the server is not in a  supported format.";
        } else if (res.data && res.data.Message)
           error = res.data.Message;
        else
           error = res.data;
      }

      //============================================================
      //
      //============================================================
      $document.ready(function() {
        $.material.init();
        $.material.input();
        $.material.ripples();
      });
    }
  ];

});
