define(['app', 'lodash', 'text!./conference-schedule.html', 'css!./conference-schedule.css',
  '../../services/mongo-storage',
  './services/schedule-service',
  './time-unit-row',
  './time-unit-row-header',
  './room-column',
  './scroll-grid'
], function(app, _, template) {

  app.directive("conferenceSchedule", ['$timeout', 'scheduleService',
    function($timeout, scheduleService) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'day': '=',
          'startTime': '=',
          'endTime': '=',
          'search': '=',
        },
        controller: function($scope) {

            init();
            //============================================================
            //
            //============================================================
            function init() {
              $scope.conferenceId = '';
              $scope.conference = '';
              $scope.conferences = [];
              $scope.changeConference = changeConference;
              initConferences().then(function() {
                initRooms().then(function(){
                      initConferenceDays();
                });
              });

            } //init

            //============================================================
            //
            //============================================================
            function initConferences() {

              $scope.conferenceId  = '';
              return scheduleService.getConferences()
                .then(function(res) {
                  $scope.conferences = res;
                  scheduleService.getConference().then(function(con) {
                    $scope.conference = con;
                    $scope.conferenceId = con._id;
                  });
                });
            } //initConferences
            //============================================================
            //
            //============================================================
            function initConferenceDays() {

              $scope.conferenceDays  = '';
              return scheduleService.getConferenceDays()
                .then(function(res) {
                  $scope.conferenceDays = res;
console.log('$scope.conferenceDays',$scope.conferenceDays);
                });
            } //initConferences
            //============================================================
            //
            //============================================================
            function initRooms() {
              return scheduleService.getRooms()
                .then(function(res) {
                  $scope.rooms = res;
                });
            } //initRooms

            //============================================================
            //
            //============================================================
            function changeConference() {
              console.log($scope.conferenceId);
              $scope.conference = _.find($scope.conferences, {
                '_id': $scope.conferenceId
              });
              scheduleService.setConference($scope.conference);
              initConferenceDays();
              initRooms();
            } //changeVenue

          } //controller
      }; //return
    }
  ]);
});