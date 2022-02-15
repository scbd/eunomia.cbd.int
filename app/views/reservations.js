define(['app','lodash','moment',
    'services/mongo-storage' ,
    'directives/date-picker' ,
    'directives/sorter'      ,
    'filters/moment'         ,
    'filters/propsFilter'    ,
    'filters/htmlToPlaintext',
    'ngDialog'               ,
    'ui.select'              ,
    'services/when-element'  ,

], function(app, _,moment) {

return  ['$document','mongoStorage','eventGroup','$location','$q', 'whenElement', '$timeout', function($document,mongoStorage,conference,$location,$q, whenElement, $timeout) {
      var docDefinition = { content: '' };
      var _ctrl = this;
      const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm'

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
      _ctrl.onPage = getReservations;
      _ctrl.changeDate=changeDate;
      _ctrl.getRoom = getRoom;
      _ctrl.getType = getType;
      _ctrl.toggleFields=toggleFields;
      _ctrl.isFieldSelect=isFieldSelect;
      _ctrl.getPrefix=getPrefix;
      _ctrl.hasDayChange = hasDayChange;
      _ctrl.updateFields=updateFields;
      _ctrl.searchText='';
      _ctrl.searchType=[];
      _ctrl.searchRoom=[];
      _ctrl.getReservations = getReservations;
      _ctrl.showFields=true;
      _ctrl.sort = {'start':1};
      _ctrl.selectFields=['Date','Room','Title','Type','Options','Agenda Items','Modified'];
      _ctrl.fields=[{title:'Title'},{title:'Description'},{title:'Room'},{title:'Date'},{title:'Type'},{title:'Options'},{title:'Agenda Items'},{title:'CCTV Message'},{title:'Modified'}];

      init(true);

      return this;


        //============================================================
        //
        //============================================================
        function init() {
            const { schedule, timezone } = conference
            const { start, end }         = schedule
          
            moment.tz.setDefault(timezone);

            _ctrl.conference.startObj = moment(start);
            _ctrl.conference.endObj   = moment(end);

            if(localStorage.getItem('reservations-colums'))
              _ctrl.selectFields=JSON.parse(localStorage.getItem('reservations-colums'));
            else
                localStorage.setItem('reservations-colums', JSON.stringify(_ctrl.selectFields));

            const { start: urlStart, end: urlEnd, itemsPerPage } = $location.search()

            _ctrl.startFilter = urlStart? moment(urlStart).format(DATE_TIME_FORMAT) : moment(start).format(DATE_TIME_FORMAT);
            _ctrl.endFilter   = urlEnd?   moment(urlEnd)  .format(DATE_TIME_FORMAT) : moment(end)  .format(DATE_TIME_FORMAT);

            if(!(urlStart && urlEnd)) changeDate();
            
            initStartDatePicker().then(initEndDatePicker)
            
            if ($location.search().itemsPerPage)
                _ctrl.itemsPerPage = $location.search().itemsPerPage;

            $q.all([loadRooms(), loadTypes()]).then(getReservations);

        } //init

        async function initStartDatePicker(){
          const   $el                    = await whenElement('start-filter', $document)
          const { start: urlStart }      = $location.search()
          const { timezone, start, end } = getConferenceTiming()

          const dateTimeObject = moment.tz(urlStart || start, timezone)

          $el.bootstrapMaterialDatePicker({ switchOnClick: true, date: true, year: true, time: true,  format: DATE_TIME_FORMAT, clearButton: false, weekStart: 0 });
          $el.bootstrapMaterialDatePicker('setDate'   , dateTimeObject);
          $el.bootstrapMaterialDatePicker('setMinDate', moment(_ctrl.startFilter));
          $el.bootstrapMaterialDatePicker('setMaxDate', end);

          $el.on('change', (e, date) =>  $timeout(()=> $location.search('start',date.format()), 100))
        }

        async function initEndDatePicker(){
          const   $el                    = await whenElement('end-filter', $document)
          const { start: urlStart, end: endUrl }      = $location.search()
          const { timezone, start, end } = getConferenceTiming()

          const dateTimeObject = moment.tz(endUrl || end, timezone)

          $el.bootstrapMaterialDatePicker({ switchOnClick: true, date: true, year: true, time: true,  format: 'dddd YYYY-MM-DD', clearButton: false, weekStart: 0 });
          $el.bootstrapMaterialDatePicker('setDate'   , dateTimeObject);
          $el.bootstrapMaterialDatePicker('setMinDate', start);
          $el.bootstrapMaterialDatePicker('setMaxDate', end);

          $el.on('change', (e, date) =>  $timeout(()=> $location.search('end',date.format()), 100))
        }

        function getConferenceTiming(){
          const { timezone, schedule } = conference
          const   start                = moment(schedule.start).startOf('day')
          const   end                  = moment(schedule.end)  .startOf('day').add(1,'day')

          return { timezone, start, end }
        }

        //============================================================
        //
        //============================================================
        function generatePdf(){
            docDefinition.content=[{
                        						style: 'tableExample',
                        						table: {
                                        headerRows: 1,
                                        widths: ['14%','25%', '*','10%', '15%'],
                        								body: [
                        										[{ text: 'Date', style: 'tableHeader' },{ text: 'Room', style: 'tableHeader' },{ text: 'Title', style: 'tableHeader' },{ text: 'Type', style: 'tableHeader' },{ text: 'Options', style: 'tableHeader' }],

                        								]
                        						}
                        				}];

            docDefinition.styles={
                                  header: {
                                    fontSize: 9,
                                    margin: [5, 5, 5, 5]
                                  },
                                  footer: {
                                    fontSize: 9,
                                    margin: [5, 5, 5, 5]
                                  },
                                  subheader: {
                                    fontSize: 16,
                                    bold: true,
                                    margin: [0, 10, 0, 5]
                                  },
                                  tableHeader: {
                                    bold: true,
                                     fillColor:'#eeeeee',
                                    fontSize: 13,
                                    color: 'black'
                                  }
                                };
pdfRows();

docDefinition.footer=pdfFooter;
docDefinition.header=pdfHeader;
        }//itemSelected

        //============================================================
        //
        //============================================================
        function pdfRows(){
              var row= [];
              _.each(_ctrl.pdfDocs,function(doc){

                    row= [];
                    row.push(formatDatePdf(doc));
                    row.push( formatRoomPdf(doc) || ' ');
                    row.push(doc.title || ' ');
                    row.push(getType(doc.type,'reservation','title') || ' ');
                    row.push(formatOptionsPdf(doc) || ' ');

                    docDefinition.content[0].table.body.push(row);
              });

        }//pdfRows

        //============================================================
        //
        //============================================================
        function formatOptionsPdf(doc){
          var options='';
            if(doc.open)
              options='Open\n';
            else
              options='Closed\n';

            if(doc.confirmed)
              options+='Confirmed\n';
            else
              options+='Unconfirmed\n';

            if(doc.security)
              options+='Security';

            return options;
        }//formatOptionsPdf

        //============================================================
        //
        //============================================================
        function formatRoomPdf(doc){
            return getRoom(doc.location.room,'title')+'\n\n '+getRoom(doc.location.room,'location');
        }//formatRoomPdf

        //============================================================
        //
        //============================================================
        function formatDatePdf(doc){
            return moment(doc.start).format('YYYY-MM-DD')+'\n\nStart: '+moment(doc.start).format('HH:mm')+'\n\t\t\t\t\t\t\t\t\tto\nEnd:   '+moment(doc.end).format('HH:mm');
        }//formatDatePdf

        //============================================================
        //
        //============================================================
        function pdfHeader(){

          return {text:'Showing '+_ctrl.itemsPerPage+' of '+_ctrl.pdfCount + ' Reservations\n From:   '+moment(_ctrl.start).format('YYYY-MM-DD HH:mm')+'   to  '+moment(_ctrl.end).format('YYYY-MM-DD HH:mm'),
                  style:'header'};
        }//itemSelected

        //============================================================
        //
        //============================================================
        function pdfFooter(page, pages){


          return {text:'printed on '+moment().format('YYYY-MM-DD HH:mm')+'  ('+page + ' of ' + pages+')',style:'footer'};
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

      //============================================================
      //
      //============================================================
    function getPDFReservations(pageIndex) {

          _ctrl.loading = true;
          var q=buildQuery ();//{'location.conference':conference._id};

          return mongoStorage.loadDocs('reservations',q, pageIndex,_ctrl.itemsPerPage,true,_ctrl.sort).then(
              function(responce) {
                    _ctrl.pdfCount=responce.count;
                    _ctrl.pdfDocs=responce.data;
                    generatePdf();

                    //pdfMake.createPdf(docDefinition).download();


                    return responce.data;
              }
          ).then(function(){pdfMake.createPdf(docDefinition).download();_ctrl.loading = false;}); //

      } 

      //============================================================
      //
      //============================================================
    function getReservations(pageIndex) {

          _ctrl.loading = true;
          if(!pageIndex || !Number(pageIndex)) pageIndex=0;

          _ctrl.itemsPerPage=Number(_ctrl.itemsPerPage);
        var q = buildQuery();//{'location.conference':conference._id};
        var f = {title:1,start:1,end:1,location:1,'sideEvent.title':1,'sideEvent.id':1,type:1,agenda:1,seriesId:1,'meta.modifiedOn':1};



              return mongoStorage.loadDocs('reservations',q, pageIndex,_ctrl.itemsPerPage,true,_ctrl.sort,f).then(
                  function({ count, data }) {
                        _ctrl.count = count;
                        _ctrl.docs  = data;
                        refreshPager(pageIndex);
                        _ctrl.loading = false;
                        return data;
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


          if($location.search().searchType) {

              if(!_.isArray($location.search().searchType))
                  _ctrl.searchType=[$location.search().searchType];
              else
                  _ctrl.searchType=$location.search().searchType;

              q['type']={'$in':_ctrl.searchType};
          }

          if($location.search().searchRoom) {

              if(!_.isArray($location.search().searchRoom))
                  _ctrl.searchRoom=[$location.search().searchRoom];
              else
                  _ctrl.searchRoom=$location.search().searchRoom;

              q['location.room']={'$in':_ctrl.searchRoom};
          }

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