define(['app', 'lodash', 'text!./scroll-grid.html','moment','css!./scroll-grid.css'
], function(app, _, template, moment) {

  app.directive("scrollGrid", ['$timeout',
    function($timeout) {
      return {
        restrict: 'E',
        template: template,
        transclude: true,
        replace: true,
        scope: {
          'day': '=',
          'startTime':'=',
          'endTime':'=',
        },
        controller: function($scope) {


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