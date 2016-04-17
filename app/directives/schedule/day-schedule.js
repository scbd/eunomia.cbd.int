define(['app', 'lodash', 'text!./day-schedule.html','css!./day-schedule.css',
  '../../services/mongo-storage',
  './services/schedule-service',
  './time-unit-row',
  './time-unit-row-header',
  './room-column',
  './scroll-grid'
], function(app, _, template) {

  app.directive("daySchedule", ['$timeout','scheduleService',
    function($timeout,scheduleService) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'day': '=',
          'startTime':'=',
          'endTime':'=',
          'search':'=',
        },
        controller: function($scope) {

            init();
            //============================================================
            //
            //============================================================
            function init() {
              $scope.venueId='';
              $scope.venue='';
              $scope.venues=[];
              $scope.changeVenue=changeVenue;
              initVenues();
            } //init

            //============================================================
            //
            //============================================================
            function initVenues() {
                $scope.venueId='';
                scheduleService.getVenues()
                .then(function(res){
                  $scope.venues=res;
                  scheduleService.getVenue().then(function(ven){
                      $scope.venue=ven;
                      $scope.venueId=ven._id;
                  });
                });
            } //initVenues

            //============================================================
            //
            //============================================================
            function changeVenue() {
                $scope.venue = _.find($scope.venues,{'_id':$scope.venueId});
                scheduleService.setVenue($scope.venue);
            } //changeVenue

          } //controller
      }; //return
    }
  ]);
});