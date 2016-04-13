define(['app', 'lodash','text!./grid-reservation-se.html',
  'moment'
], function(app, _, template, moment) { //'scbd-services/utilities',

  app.directive("gridReservationSe", ['$timeout','mongoStorage','$rootScope',
    function($timeout,mongoStorage,$rootScope) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {'doc':'=','rowMinHeight':'='},
        controller: function($scope, $element) { //, $http, $filter, Thesaurus



init();


          //============================================================
          //
          //============================================================
          function init() {

            var cancelMinHeight = setInterval(function(){
              if($scope.rowMinHeight){
                clearInterval(cancelMinHeight);
                console.log('rowMinHeight',$scope.rowMinHeight);
                console.log('$element.height()',$element.height());
                              if($element.height()>$scope.rowMinHeight || $scope.rowMinHeight <42)
                                  $scope.oneLine=true;
                                  else
                                    $scope.oneLine=false;
                        $element.height($scope.rowMinHeight);

              }
           },100);
           var titleEl = $element.find("#res-el").popover({ placement: 'top', html: 'true',container: 'body',
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

          }//triggerChanges

        } //link
      }; //return
    }
  ]);
});