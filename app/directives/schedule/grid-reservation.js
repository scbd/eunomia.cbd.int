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

console.log($scope.doc.resWidth);

            $scope.oneLine = false;
            $scope.twoLine = false;
            $scope.threeLine = false;
            init();
            // $element.css('width',$scope.doc.resWidth+'px');
            $scope.$watch('doc.resWidth',function(){
              if($scope.doc.resWidth &&  $scope.doc.resWidth > 0)
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
              var count = 0;

              if (!$scope.doc.resWidth){
                var cancelMinHeight = setInterval(function() {
                  count++;
                  if (count===10){ clearInterval(cancelMinHeight);
                      throw "run away set interval in grid reservation";
                  }
                  if (!$scope.doc) clearInterval(cancelMinHeight);
                  if ($scope.doc.resWidth) {
                      $element.css('max-width',$scope.doc.resWidth+'px');
                      clearInterval(cancelMinHeight);
                  }
                }, 500);
              }else{
                $element.css('max-width',$scope.doc.resWidth+'px');
              }

              titleEl.on('mouseenter', function() {
                titleEl.popover('show');
              });
              titleEl.on('mouseleave', function() {
                titleEl.popover('hide');
              });

            } //triggerChanges
            //============================================================
            //
            //============================================================
            function calcResWidth (res) {
                  var resStart = moment.utc(res.start).format('X');
                  var resEnd = moment.utc(res.end).format('X');

                  var resWidth = Math.ceil((resEnd - resStart)/timeUnit)*($scope.colWidth/subIntervals);
                  return Number(resWidth);
            };//calcResWidth
          } //link
      }; //return
    }
  ]);
});