define(['app', 'lodash', 'text!./conference-schedule.html','moment', 'css!./conference-schedule.css',
  '../../services/mongo-storage',

 './time-unit-row',
 './time-unit-row-header',
  './room-column',
  './scroll-grid'
], function(app, _, template,moment) {

  app.directive("conferenceSchedule", ['$timeout','$document','mongoStorage',
    function($timeout,$document,mongoStorage) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'day': '=',
          'startTime': '=',
          'endTime': '=',
          'search': '='

        },
        controller: function($scope) {

            init();


            //============================================================
            //
            //============================================================
          this.resetSchedule = function() {

              initRowHeight();
              generateDays();
            } //init
            //============================================================
            //
            //============================================================
            function init() {
              $scope.conferenceId = '';
              $scope.conference = '';
              $scope.conferences = [];
              $scope.changeConference = changeConference;
              $scope.rooms=[];
              getConferences().then(function() {

                $scope.getRooms();
                // .then(function(){
                //
                //   initRowHeight();
                //   generateDays();
                // });
              });

            } //init


            //============================================================
            //
            //============================================================
            function generateDays() {
              $scope.conferenceDays = [];
              var numDays = Math.floor((Number($scope.conference.end) - Number($scope.conference.start)) / (24 * 60 * 60));
              $scope.conference.endObj = moment.utc(Number($scope.conference.end)*1000).startOf('day');
              $scope.conference.startObj = moment.utc(Number($scope.conference.start)*1000).startOf('day');


              $scope.startDay = moment($scope.conference.startObj);
              $scope.endDay = moment($scope.conference.endObj);
              var date = moment($scope.conference.startObj);
              for (var i = 0; i <= numDays ; i++) {
                $scope.conferenceDays.push(moment(date));

                date.add(1,'day');
              }

            }//

            //============================================================
            //
            //============================================================
            function getConferences() {
              return mongoStorage.getConferences().then(function(confs) {
                $scope.conferences = confs.data;
                var lowestEnd = Math.round(new Date().getTime() / 1000);
                var chosenEnd = 0;
                var selectedKey = 0;
                //select the next confrence by default
                _.each($scope.conferences, function(meet, key) {
                  if (!chosenEnd) chosenEnd = meet.end;
                  if (meet.end > lowestEnd && meet.end <= chosenEnd) {
                    chosenEnd = meet.end;
                    selectedKey = key;
                  }
                });
                $scope.conference = $scope.conferences[selectedKey];
                $scope.conferences[selectedKey].selected = true;
                $scope.conferenceId=$scope.conference._id;
              });
            } //initMeeting




            //============================================================
            //
            //============================================================
            function initRowHeight() {
                    $document.ready(function(){
                      $timeout(function(){
                        var roomColumnEl;
                        roomColumnEl=$document.find('#room-col');
                        $scope.rowHeight=Math.floor(Number(roomColumnEl.height())/$scope.rooms.length);
                        if($scope.rowHeight<60)$scope.rowHeight=60;
                        _.each($scope.rooms,function(room){
                            room.rowHeight=$scope.rowHeight;
                        });
                      });
                    });
            }//initRooms
            //============================================================
            //
            //============================================================
            $scope.getRooms =function() {
                  return mongoStorage.getConferenceRooms($scope.conferenceId).then(function(res) {
                    $scope.rooms = res.data;
                  }).then(function(){
                            initRowHeight();
                            generateDays();
                  });
            }//initRooms
            //============================================================
            //
            //============================================================
            function changeConference() {
              console.log($scope.conferenceId);
              $scope.conference = _.find($scope.conferences, {
                '_id': $scope.conferenceId
              });
              $scope.getRooms();

            } //changeVenue

          } //controller
      }; //return
    }
  ]);
});