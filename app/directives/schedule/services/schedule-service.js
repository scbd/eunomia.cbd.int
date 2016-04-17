define(['app', 'lodash',
  '../../../services/mongo-storage',
], function(app, _) {

  app.factory("scheduleService", ['mongoStorage','$q','$document','$timeout',function(mongoStorage,$q,$document,$timeout) {
        //todovenues will be location or confrences
        var venue,venues,rooms,headersHeight,rowHeight,headerEl,roomColumnEl;

        init();
        //============================================================
        //
        //============================================================
        function init() {
          headersHeight='50';
          rowHeight='50';

          initVenues().then(function(){
              initRooms().then(function(){
                initRowHeight();
              });
          });
        }

        //============================================================
        //
        //============================================================
        function initRooms() {
          //todo check if id is conference or venue then load right rooms from right collection
              return mongoStorage.loadConferenceRooms(venue._id).then(function(res) {
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
                    rowHeight=Number(roomColumnEl.height())/rooms.length;
                  });
                });
        }//initRooms
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
          return mongoStorage.loadconferences().then(function(confs) {
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
        function setVenue(venObj) {
              if(_.find(venues,{'_id':venObj._id})){
                  venue=venObj;
                  initRooms();
              }
              else
                throw 'error: setting venue without valid venue obj' ;
        } //setVenue


        return {
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