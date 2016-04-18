define(['app', 'lodash', 'text!./time-unit-row.html','css!./time-unit-row.css'
], function(app, _, template) {

  app.directive("timeUnitRow", [
    function() {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'doc': '='
        },
        controller: function($scope, $element,scheduleService) {

            init();

            //============================================================
            //
            //============================================================
            function init() {
              var cancel = setInterval(function(){

                 $scope.rowHeight=Number(scheduleService.getRowHeight())+1;// +1 hack adoodle doo
                 $element.height($scope.rowHeight);
                 $scope.outerRowWidth=scheduleService.getOuterGridWidth();
                 $scope.timeIntervals=scheduleService.getTimeIntervals($scope.startTime,$scope.endTime);

                 $scope.hourOn=hourOn;
                 $scope.toHour=toHour;
                 if($scope.rowHeight && $scope.outerRowWidth && $scope.timeIntervals){
                     clearInterval(cancel);
                     calcColWidths();
                 }
              },100);

            } //init

$scope.test=function(sub){alert(sub);};
            //============================================================
            //
            //============================================================
            function calcColWidths() {

                $scope.colWidth = Number($scope.outerRowWidth)/Number($scope.timeIntervals.length);

            } //init

            //============================================================
            //
            //============================================================
            function hourOn(val) {

                return ((Math.floor(val/4)%2)===0);
            } //init
            //============================================================
            //
            //============================================================
            function toHour(val) {

                return moment(val).format();
            } //init

          } //link
      }; //return
    }
  ]);
});