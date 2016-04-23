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
//          'rowMinHeight': '=',
//          'ignoreMinHeight': '=?'
        },
        controller: function($scope, $element) {

            $scope.oneLine = false;
            $scope.twoLine = false;
            $scope.threeLine = false;
            init();
            // $element.css('width',$scope.doc.resWidth+'px');
            $scope.$watch('doc.resWidth',function(){
              console.log($scope.doc.resWidth);
              if($scope.doc.resWidth > 50)
              $element.css('max-width',$scope.doc.resWidth+'px');
            });
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
              if (!$scope.ignoreMinHeight)
                var cancelMinHeight = setInterval(function() {

                  if (!$scope.doc) clearInterval(cancelMinHeight);
                  if ($scope.rowMinHeight) {
                    clearInterval(cancelMinHeight);

                    $timeout(function() {
                      if ($scope.rowMinHeight <= 42)
                        $scope.oneLine = true;
                      else
                        $scope.oneLine = false;

                      if ($scope.rowMinHeight > 42 && $scope.rowMinHeight <= 61)
                        $scope.twoLine = true;
                      else
                        $scope.twoLine = false;

                      if ($scope.rowMinHeight > 61)
                        $scope.threeLine = true;
                      else
                        $scope.threeLine = false;
                    });

                    if ($element.height() > $scope.rowMinHeight)
                      $element.height($scope.rowMinHeight);



                  }
                }, 500);


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