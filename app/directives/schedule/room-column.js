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
          'rooms': '=',
        },
        controller: function($scope,$element,$document) {

            init();

            //============================================================
            //
            //============================================================
            function init() {
                $scope.rooms=[];

              //  initRooms();

            } //init

            // //============================================================
            // //
            // //============================================================
            // function initRooms() {
            //
            //
            //       $scope.rooms=res;
            //       $scope.rowHeight=scheduleService.getHeadersHeight();
            //
            // } //initRooms

          } //controller
      }; //return
    }
  ]);
});