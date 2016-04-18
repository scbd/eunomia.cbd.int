define(['app', 'lodash', 'text!./room-column.html','css!./room-column.css','./room-row',
], function(app, _, template) {

  app.directive("roomColumn", [
    function() {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: true,
        scope: {
          'venue': '=',
        },
        controller: function($scope,$element,$document,scheduleService) {

            init();

            //============================================================
            //
            //============================================================
            function init() {
                $scope.rooms=[];

                initRooms();

            } //init

            //============================================================
            //
            //============================================================
            function initRooms() {

                scheduleService.getRooms()
                .then(function(res){
                  $scope.rooms=res;
                  $scope.rowHeight=scheduleService.getHeadersHeight();
                });
            } //initRooms

          } //controller
      }; //return
    }
  ]);
});