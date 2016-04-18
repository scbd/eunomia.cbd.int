define(['app', 'lodash','moment',
  '../../../services/mongo-storage',
], function(app, _,moment) {

  app.factory("scheduleService", ['mongoStorage','$q','$document','$timeout',function(mongoStorage,$q,$document,$timeout) {
        //todovenues will be location or confrences
        var startDay,endDay,day,venue,venues,conference,conferences,conferenceDays,rooms,headersHeight,rowHeight,outerGridWidth,roomColumnEl,scrollGridEl,
        startTime,endTime,timeUnit,intervals,intervalKeys;

        init();
        //============================================================
        //
        //============================================================
        function init() {
          headersHeight='40';
          rowHeight='40';
          timeUnit=900.025;//15 minutes in seconds
          intervals = [];
          intervalKeys = [];
          initConferences().then(function(){
              initRooms().then(function(){
                initRowHeight();
                initHeaderHeight();
                initOuterGridWidth();
              });
          });
        }
        //============================================================
        //
        //============================================================
        function getTimeIntervals(start,end) {
              if(!startTime)startTime=start;
              if(!endTime)endTime=end;
              var seconds = endTime.diff(startTime)/1000;
              var hours = Math.ceil(seconds/3600);
              intervals = [];
              intervalKeys = [];
              var t = moment(startTime);
              var subIntervals = 3600/timeUnit;
              for(var  i=0; i< hours ; i++)
              {   var intervalObj={};
                  intervalObj.subIntervals=[];
                  intervalObj.interval=moment(t);
                  for(var  j=0; j< subIntervals ; j++)
                  {
                     intervalObj.subIntervals.push(moment(t));
                     t=t.add(timeUnit,'seconds');
                  }
                  intervalKeys.push(intervalObj);

              }
              // for(var  i=0; i< seconds; i=Math.floor(timeUnit)+i)
              // {
              //   intervalKeys.push(moment(t));
              //   t=t.add(timeUnit,'seconds');
              // }

              return intervalKeys;

        }//igetTimeIntervals

        //============================================================
        //
        //============================================================
        function getTimeIntervalsHeader(start,end) {
              if(!start && !end) return;
              
              if(!startTime)startTime=start;
              if(!endTime)endTime=end;
              var seconds = endTime.diff(startTime)/1000;
              var hours = Math.ceil(seconds/3600);
              intervals = [];
              intervalKeys = [];
              var t = moment(startTime);
              for(var  i=0; i< hours ; i++)
              {
                intervalKeys.push(moment(t));
                t=t.add(1,'hours');
              }

              return intervalKeys;

        }//igetTimeIntervals
        //============================================================
        //
        //============================================================
        function initRooms() {
          //todo check if id is conference or venue then load right rooms from right collection
              return mongoStorage.getConferenceRooms(conference._id).then(function(res) {
                rooms = res.data;
              });
        }//initRooms
        //============================================================
        //
        //============================================================
        function initHeaderHeight() {
                  headersHeight='40';
        }//initRooms
        //============================================================
        //
        //============================================================
        function initRowHeight() {
                $document.ready(function(){
                  $timeout(function(){
                    roomColumnEl=$document.find('#room-col');
                    rowHeight=Math.floor(Number(roomColumnEl.height())/rooms.length);
                  });
                });
        }//initRooms
        //============================================================
        //
        //============================================================
        function initOuterGridWidth() {
                $document.ready(function(){
                  $timeout(function(){
                    scrollGridEl=$document.find('#scroll-grid');
                    outerGridWidth=Number(scrollGridEl.width());
                  });
                });
        }//initRooms
        //============================================================
        //
        //============================================================
        function getOuterGridWidth() {

            return outerGridWidth;
        }// getOuterGridWidth

        //============================================================
        //
        //============================================================
        function getHeadersHeight() {

            return headersHeight;
        }// getHeadersHeight
        //============================================================
        //
        //============================================================
        function getRowHeight() {

            return rowHeight;
        }// getrowHeight
        //============================================================
        //
        //============================================================
        function getRooms() {

            var cancelInterval,count=0;
            return $q(function(resolve, reject) {
                      cancelInterval = setInterval(function(){
                          count++;
                          if(rooms && !_.isEmpty(rooms)){
                              clearInterval(cancelInterval);
                              resolve(rooms);
                          }else if(count===20){
                              reject('Failed to get rooms, timed out 2 seconds');
                          }
                      },100);
                   });
        }// getRooms

        //============================================================
        //
        //============================================================
        function getRoom(id) {
            var cancelInterval,count=0;
            return $q(function(resolve, reject) {
                      cancelInterval = setInterval(function(){
                          count++;
                          if(rooms && !_.isEmpty(rooms)){
                              clearInterval(cancelInterval);
                              resolve(_.find(rooms,{'_id':id}));
                          }else if(count===20){
                              reject('Failed to get room, timed out 2 seconds');
                          }
                      },100);
                   });
        }// getRooms

        //============================================================
        //
        //============================================================
        function getVenues() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(venues && !_.isEmpty(venues)){
                            clearInterval(cancelInterval);
                            resolve(venues);
                        }else if(count===20){
                            reject('Failed to get venues, timed out 2 seconds');
                        }
                    },100);
                 });
        }//getVenues()
        //============================================================
        //
        //============================================================
        function getVenue() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(venue && !_.isEmpty(venue)){
                            clearInterval(cancelInterval);
                            resolve(venue);
                        }else if(count===20){
                            reject('Failed to get venue, timed out 2 seconds');
                        }
                    },100);
                 });
        }//getVenue()
        //============================================================
        //
        //============================================================
        function getConferences() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(conferences && !_.isEmpty(conferences)){
                            clearInterval(cancelInterval);
                            resolve(conferences);
                        }else if(count===20){
                            reject('Failed to get venues, timed out 2 seconds');
                        }
                    },100);
                 });
        }//getVenues()
        //============================================================
        //
        //============================================================
        function getConference() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(conference && !_.isEmpty(conference)){
                            clearInterval(cancelInterval);
                            resolve(conference);
                        }else if(count===20){
                            reject('Failed to get venue, timed out 2 seconds');
                        }
                    },100);
                 });
        }//getVenue()
        //============================================================
        //
        //============================================================
        function getConferenceId() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(conference && !_.isEmpty(conference)){
                            clearInterval(cancelInterval);
                            resolve(conference._id);
                        }else if(count===20){
                            reject('Failed to get venueId, , timed out 2 seconds');
                        }
                    },100);
                 });
        }//getVenues()
        //============================================================
        //
        //============================================================
        function getVenueId() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(venue && !_.isEmpty(venue)){
                            clearInterval(cancelInterval);
                            resolve(venue._id);
                        }else if(count===20){
                            reject('Failed to get venueId, , timed out 2 seconds');
                        }
                    },100);
                 });
        }//getVenues()
        //============================================================
        //
        //============================================================
        function initVenues() {
          return mongoStorage.getVenues().then(function(confs) {
            venues = confs.data;
            var lowestEnd = Math.round(new Date().getTime() / 1000);
            var chosenEnd = 0;
            var selectedKey = 0;
            //select the next confrence by default
            _.each(venues, function(meet, key) {
              if (!chosenEnd) chosenEnd = meet.end;
              if (meet.end > lowestEnd && meet.end <= chosenEnd) {
                chosenEnd = meet.end;
                selectedKey = key;
              }
            });
            venues[selectedKey].selected = true;
            venue = venues[selectedKey];
          });
        } //initMeeting
        //============================================================
        //
        //============================================================
        function initConferences() {
          return mongoStorage.getConferences().then(function(confs) {
            conferences = confs.data;
            var lowestEnd = Math.round(new Date().getTime() / 1000);
            var chosenEnd = 0;
            var selectedKey = 0;
            //select the next confrence by default
            _.each(conferences, function(meet, key) {
              if (!chosenEnd) chosenEnd = meet.end;
              if (meet.end > lowestEnd && meet.end <= chosenEnd) {
                chosenEnd = meet.end;
                selectedKey = key;
              }
            });
            conferences[selectedKey].selected = true;
            conference = conferences[selectedKey];
            generateDays();
          });
        } //initMeeting

        //============================================================
        //
        //============================================================
        function generateDays() {
          conferenceDays = [];

          var numDays = Math.floor((Number(conference.end) - Number(conference.start)) / (24 * 60 * 60));
          var seconds = Number(conference.start);
          var date = moment.utc(seconds*1000).startOf('day');

          day = date.format('YYYY-MM-DD');
          startDay = date;

          for (var i = 1; i <= numDays +1; i++) {
            conferenceDays.push(date);
            if (i === numDays +1) {
              endDay = date;
            }
            date=date.add(1,'day');
          }
        }//
        //============================================================
        //
        //============================================================
        function getDay() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(day){
                            clearInterval(cancelInterval);
                            resolve(day);
                        }else if(count===20){
                            reject('Failed to get day, , timed out 2 seconds');
                        }
                    },100);
                 });
        }//
        //============================================================
        //
        //============================================================
        function getConferenceDays() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(conferenceDays && !_.isEmpty(conferenceDays)){
                            clearInterval(cancelInterval);
                            resolve(conferenceDays);
                        }else if(count===20){
                            reject('Failed to get conference Days, timed out 2 seconds');
                        }
                    },100);
                 });
        }//
        //============================================================
        //
        //============================================================
        function getStartDay() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(startDay && !_.isEmpty(startDay)){
                            clearInterval(cancelInterval);
                            resolve(startDay);
                        }else if(count===20){
                            reject('Failed to get conference start day, timed out 2 seconds');
                        }
                    },100);
                 });
        }//
        //============================================================
        //
        //============================================================
        function getEndDay() {
          var cancelInterval,count=0;
          return $q(function(resolve, reject) {
                    cancelInterval = setInterval(function(){
                        count++;
                        if(endDay && !_.isEmpty(endDay)){
                            clearInterval(cancelInterval);
                            resolve(endDay);
                        }else if(count===20){
                            reject('Failed to get conference end day, timed out 2 seconds');
                        }
                    },100);
                 });
        }//
        //============================================================
        //
        //============================================================
        function setVenue(venObj) {
              if(_.find(venues,{'_id':venObj._id})){
                  venue=venObj;
                  initRooms();
              }
              else
                throw 'error: setting venue without valid venue obj' ;
        } //setVenue


        return {
          getDay:getDay,
          getStartDay:getStartDay,
          getEndDay:getEndDay,
          getConferenceDays:getConferenceDays,
          getConferenceId:getConferenceId,
          getConference:getConference,
          getConferences:getConferences,
          getTimeIntervalsHeader:getTimeIntervalsHeader,
          getTimeIntervals:getTimeIntervals,
          getOuterGridWidth:getOuterGridWidth,
          getRowHeight:getRowHeight,
          getHeadersHeight:getHeadersHeight,
          getRoom: getRoom,
          getRooms: getRooms,
          getVenues:getVenues,
          getVenue:getVenue,
          getVenueId:getVenueId,
          setVenue:setVenue
        };
  }]);

});