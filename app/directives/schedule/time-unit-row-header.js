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
          'conferenceDays':'='
        },
        controller: function($scope,$element,$document) {

            $scope.$watch('conferenceDays',function(){
              initTimeIntervals();
            });
            $scope.$watch('startTime',function(){

              initTimeIntervals();
            });
            $scope.$watch('endTime',function(){

              initTimeIntervals();
            });

            //============================================================
            //
            //============================================================
            function initTimeIntervals(){
          
              if($scope.startTime && $scope.startTime.hours() && $scope.endTime && $scope.endTime.hours() && $scope.conferenceDays && !_.isEmpty($scope.conferenceDays)){
                  var hours = $scope.endTime.hours()-$scope.startTime.hours();

                  $scope.timeIntervals = [];
                  var t = moment($scope.conferenceDays[0]).add($scope.startTime.hours(),'hours').add($scope.startTime.minutes(),'minutes');
                  for(var  i=0; i< hours ; i++)
                  {
                    $scope.timeIntervals.push(moment(t));
                    t=t.add(1,'hours');
                  }
                  initOuterGridWidth();

              }
            }//initTimeIntervals

            //============================================================
            //
            //============================================================
            function initOuterGridWidth() {
              var scrollGridEl;
                    $document.ready(function(){
                      $timeout(function(){
                        scrollGridEl=$document.find('#scroll-grid');

                        $scope.outerGridWidth=Number(scrollGridEl.width());
                        initDayWidth();
                        calcColWidths();

                      });
                    });

            }//initOuterGridWidth

            //============================================================
            //
            //============================================================
            function initDayWidth(){
                  _.each($scope.conferenceDays,function(con,key){
                        $timeout(function(){$element.find('#day-header-'+key).width($scope.outerGridWidth);});
                  });
                  _.each($scope.conferenceDays,function(con,key){
                        $timeout(function(){$element.find('#interval-header-'+key).width($scope.outerGridWidth);});
                  });
            }//initDayWidth

            //============================================================
            //
            //============================================================
            function initIntervalWidth(){
                  _.each($scope.timeIntervals,function(con,key){
                        $timeout(function(){$element.find('#sub-interval-header-'+key).width($scope.colWidth);});

                  });
            }//initIntervalWidth

            //============================================================
            //
            //============================================================
            function calcColWidths() {

                $scope.colWidth = Number($scope.outerGridWidth)/Number($scope.timeIntervals.length);
                initIntervalWidth();
            } //init

          } //calcColWidths
      }; //return
    }
  ]);
  app.filter('momentFormat', function() {
      return function(input) {
          return input.format('dddd [the] Do of MMMM, YYYY');
      };
  });
  // app.filter('floor', function() {
  //     return function(input) {
  //         return Math.floor(input);
  //     };
  // });
  app.filter('toHour', function() {
      return function(input) {
          //if(input.minutes()===0)

            return input.format('hh:mm a');
          // else
          //   return ' ';

      };
  });
});