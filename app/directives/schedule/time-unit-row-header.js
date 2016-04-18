define(['app', 'lodash', 'text!./time-unit-row-header.html','moment','css!./time-unit-row-header.css'
], function(app, _, template, moment) {

  app.directive("timeUnitRowHeader", ['$timeout',
    function($timeout) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'day': '=',
          'startTime':'=',
          'endTime':'=',
        },
        controller: function($scope,$element, scheduleService) {

            init();
//todo set start and end in service when set
            //============================================================
            //
            //============================================================
            function init() {
             var cancel = setInterval(function(){

                $scope.rowHeight=scheduleService.getHeadersHeight();
                $scope.outerRowWidth=scheduleService.getOuterGridWidth();
                $scope.timeIntervals=scheduleService.getTimeIntervalsHeader($scope.startTime,$scope.endTime);
                $element.height($scope.rowHeight);
                $scope.hourOn=hourOn;
                $scope.toHour=toHour;
                if($scope.rowHeight && $scope.outerRowWidth && $scope.timeIntervals){
                    clearInterval(cancel);
                    calcColWidths();
                }
             },100);
            } //init

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
  app.filter('floor', function() {
      return function(input) {
          return Math.floor(input);
      };
  });
  app.filter('toHour', function() {
      return function(input) {
          if(input.minutes()===0)
            return input.format('hh:mm a');
          else
            return ' ';

      };
  });
});