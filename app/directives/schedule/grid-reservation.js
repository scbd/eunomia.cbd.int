define(['app', 'lodash', 'text!./grid-reservation.html','moment'
], function(app, _, template, moment) {

  app.directive("gridReservation", ['$timeout',
    function($timeout) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        priority: -100,
        scope: {
          'doc': '=',

        },
        controller: function($scope, $element) {

            $scope.oneLine = false;
            $scope.twoLine = false;
            $scope.threeLine = false;
            init();

            $scope.$watch('doc.meta.status',function(){
              if($scope.doc.meta && $scope.doc.meta.status ==='deleted'){
                  $scope.doc={};
                  $element.remove();
              }
            });
            //============================================================
            //
            //============================================================
            function init() {
              var titleEl = $element.find("#res-el").popover({
                placement: 'top',
                html: 'true',
                container: 'body',
                content: function() {
                  return $element.find('#pop-title').html();
                }
              });

              titleEl.on('mouseenter', function() {
                titleEl.popover('show');
              });
              titleEl.on('mouseleave', function() {
                titleEl.popover('hide');
              });

            } //triggerChanges

          } //link
      }; //return
    }
  ]);
});