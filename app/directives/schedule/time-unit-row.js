define(['app', 'lodash', 'text!./time-unit-row.html','moment','css!./time-unit-row.css'
], function(app, _, template, moment) {

  app.directive("timeUnitRow", ['$timeout',
    function($timeout) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'doc': '='
        },
        controller: function($scope, $element) {

            $scope.oneLine = false;
            $scope.twoLine = false;
            $scope.threeLine = false;
            init();

            //============================================================
            //
            //============================================================
            function init() {


            } //triggerChanges

          } //link
      }; //return
    }
  ]);
});