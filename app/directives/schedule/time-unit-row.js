define(['app', 'lodash', 'text!./time-unit-row.html','text!../forms/edit/reservation-dialog.html','css!./time-unit-row.css',  'ngDialog','../forms/edit/reservation',
], function(app, _, template,resDialog) {

  app.directive("timeUnitRow", ['ngDialog',
    function(ngDialog) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'day': '=',
          'startTime':'=',
          'endTime':'=',
          'conferenceDays':'=?'
        },
        controller: function($scope, $element,scheduleService) {
            $scope.timeIntervals=[];
            init();

            //============================================================
            //
            //============================================================
            function init() {
              var timeoutCount=0;

              var cancel = setInterval(function(){

                 $scope.rowHeight=Number(scheduleService.getRowHeight())+1;// +1 hack adoodle doo
                 $element.height($scope.rowHeight);
                 $scope.outerRowWidth=Number(scheduleService.getOuterGridWidth())*$scope.conferenceDays.length;

                 if($scope.startTime && $scope.endTime)
                    $scope.timeIntervals=scheduleService.getTimeIntervalsConference($scope.startTime,$scope.endTime);

                 $scope.hourOn=hourOn;
                 $scope.toHour=toHour;
                 if($scope.rowHeight && $scope.outerRowWidth && !_.isEmpty($scope.timeIntervals)){
                     clearInterval(cancel);
                     calcColWidths();
                 }
                 if(timeoutCount===20){

                   clearInterval(cancel);
                   throw "Error: initialization onf grid rows timed out 2 seconds";
                 }
                 timeoutCount++;
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

            //============================================================
            //
            //============================================================
            $scope.resDialog = function(res) {
                $scope.editRes = res;
                ngDialog.open({
                  template: resDialog,
                  className: 'ngdialog-theme-default',
                  closeByDocument: true,
                  plain: true,
                  scope: $scope
                });
            };//$scope.roomDialog

          } //link
      }; //return
    }
  ]);
});