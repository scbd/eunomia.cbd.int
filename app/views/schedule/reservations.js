define(['app','lodash','moment',
'services/mongo-storage',
    'directives/date-picker',
  'directives/sorter',
  'filters/moment',
'ngDialog',

], function(app, _,moment,deleteDialog,roomDialog) {

return  ['$scope','$document','mongoStorage','ngDialog','$rootScope','$timeout','eventGroup','$location','$q',function($scope,$document,mongoStorage,ngDialog,$rootScope,$timeout,conference,$location,$q) {


      var _ctrl = this;
      _ctrl.conference=conference;

      _ctrl.count = 0;
      _ctrl.options = {};
      _ctrl.sort = {'title':1};
      _ctrl.venueId = conference.venueId;
      _ctrl.itemsPerPage=10;
      _ctrl.currentPage=0;
      _ctrl.pages=[];
      _ctrl.onPage = getReservations;
      _ctrl.changeDate=changeDate;
      _ctrl.getRoom = getRoom;
      _ctrl.getType = getType;
      _ctrl.searchText='';
      init();

      return this;


      //============================================================
      //
      //============================================================
      function init() {

        moment.tz.setDefault(conference.timezone);



            _ctrl.conference.startObj  = moment(conference.schedule.start);

            _ctrl.conference.endObj    = moment(conference.schedule.end);

          if($location.search().start && $location.search().end){
              _ctrl.startFilter = moment($location.search().start).format('YYYY-MM-DD HH:mm');
              _ctrl.endFilter   = moment($location.search().end).format('YYYY-MM-DD HH:mm');
          }else {
              _ctrl.startFilter = _ctrl.conference.startObj.format('YYYY-MM-DD HH:mm');
              _ctrl.endFilter   = _ctrl.conference.endObj.format('YYYY-MM-DD HH:mm');
              changeDate();
          }



        $q.all([loadRooms(),loadTypes()]).then(getReservations);

      } //init

      //============================================================
      //
      //============================================================
    function getReservations(pageIndex) {

          _ctrl.loading = true;
          if(!pageIndex || !Number(pageIndex)) pageIndex=0;

          _ctrl.itemsPerPage=Number(_ctrl.itemsPerPage);
        var q=buildQuery ();//{'location.conference':conference._id};



              return mongoStorage.loadDocs('reservations',q, pageIndex,_ctrl.itemsPerPage,true,_ctrl.sort).then(
                  function(responce) {
                        _ctrl.count=responce.count;
                        _ctrl.docs=responce.data;
                        refreshPager(pageIndex);
                        return responce.data;
                  }
              ); // mongoStorage.getReservations

      } // getReservations

      //=======================================================================
      //
      //=======================================================================
      function buildQuery () {
          var q = {};

          q.start={'$exists':1};
          q.start={'$ne':null};
  //        if(_ctrl.conference) q['location.conference']=_ctrl.conference._id;



          if($location.search().searchText ){
              _ctrl.searchText = $location.search().searchText;
              q['$text'] = {'$search':'"'+_ctrl.searchText+'"'};  // jshint ignore:line
          }

          if($location.search().start)
              _ctrl.start = $location.search().start;

          if($location.search().start)
              _ctrl.end = $location.search().end;


          if(_ctrl.start && _ctrl.end)
              q['$and']= [{
                  'start': {
                      '$gte': {
                          '$date': _ctrl.start
                      }
                  }
              }, {
                  'end': {
                      '$lt': {
                          '$date': _ctrl.end
                      }
                  }
              }];


          q['meta.status']={'$nin':[ 'deleted', 'archived']};
  //        q.type={'$in':_ctrl.seTypes};
          return q;
      }

      //======================================================
      //
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
      function changeDate() {

        _ctrl.startFilterObj = moment(_ctrl.startFilter,'YYYY-MM-DD HH:mm');
        _ctrl.endFilterObj   = moment(_ctrl.endFilter,'YYYY-MM-DD HH:mm');
        var search = {
          'end'  :moment(_ctrl.endFilter,'YYYY-MM-DD HH:mm').format(),
          'start': moment(_ctrl.startFilter,'YYYY-MM-DD HH:mm').format(),
        };

        if(_ctrl.searchText)search.searchText=_ctrl.searchText;

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

        if(_ctrl.conference.types &&_ctrl.conference.types.reservation && !_.isEmpty(_ctrl.conference.types.reservation)){
          return $q(function(resolve){resolve(true)});
        }
        var q = {schema:'reservations'};
        return mongoStorage.loadDocs('types',q,0,100000,false).then(function(result) {
                 _ctrl.conference.types={};
                 _ctrl.conference.types.reservation =result.data;

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