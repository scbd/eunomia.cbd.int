define(['app', 'lodash', 'text!./tier-row-header.html', 'moment'], function(app, _, template, moment) {

    app.directive("tierRowHeader", ['$timeout',
        function($timeout) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                scope: {
                    'isOpen':'=',
                    'conferenceDays':'=',
                    'conference':'='
                },
                controller: function($scope, $element, $document) {


                        $scope.$watch('conferenceDays', function() {
                            if (!_.isEmpty($scope.conferenceDays))
                                initTimeIntervals();
                        });

                        $scope.$watch('isOpen', function() {
                                initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        function initTimeIntervals() {

                            if ($scope.conferenceDays && !_.isEmpty($scope.conferenceDays)) {
// console.log('$scope.startTime',$scope.startTime);
// console.log('$scope.endTime',$scope.endTime);
 console.log('$scope.conferenceDays',$scope.conferenceDays);

if($scope.conferenceDays && $scope.conferenceDays.length)
$scope.conferenceDays.forEach(function(item, key){
  $scope.conferenceDays.seTiers.forEach
  moment.tz($scope.conference.StartDate,$scope.conference.timezone).startOf('day');
  $scope.timeIntervals.push(item.);

});
                                //var hours = $scope.endTime.hours() - $scope.startTime.hours();
                                $scope.timeIntervals = [];
                              //  var t = moment($scope.day).add($scope.startTime.hours(), 'hours').add($scope.startTime.minutes(), 'minutes');

                                // for (var i = 0; i < hours + 1; i++) {
                                //     $scope.timeIntervals.push(moment(t));
                                //     t = t.add(1, 'hours');
                                // }
                                initOuterGridWidth();
                            }
                        } //initTimeIntervals

                        //============================================================
                        //
                        //============================================================
                        function initOuterGridWidth() {
                            var scrollGridEl;
                            $document.ready(function() {
                                $timeout(function() {
                                    scrollGridEl = $document.find('#scroll-grid');

                                    $scope.outerGridWidth = Number(scrollGridEl.width() - 1);
                                    if (!$scope.outerGridWidth) throw "Error: outer grid width not found timing issue.";
                                    initDayWidth();
                                    calcColWidths();
                                });
                            });
                        } //initOuterGridWidth

                        //============================================================
                        //
                        //============================================================
                        function initDayWidth() {

                            $element.find('#day-header-' + 0).css('width', $scope.outerGridWidth);
                            $element.find('#interval-header-' + 0).css('width', $scope.outerGridWidth);

                            //   $scope.selectedConfDays = [];
                            //   $scope.selectedConfDays.push($scope.day);
                            // _.each($scope.selectedConfDays, function(con, key) {
                            //     $timeout(function() {
                            //         $element.find('#day-header-' + key).css('width', $scope.outerGridWidth);
                            //     });
                            // });
                            // _.each($scope.selectedConfDays, function(con, key) {
                            //     $timeout(function() {
                            //         $element.find('#interval-header-' + key).css('width', $scope.outerGridWidth);
                            //     });
                            // });
                        } //initDayWidth

                        //============================================================
                        //
                        //============================================================
                        function initIntervalWidth() {
                            _.each($scope.timeIntervals, function(con, key) {
                                $timeout(function() {
                                    $element.find('#sub-interval-header-' + key).css('width', $scope.colWidth);
                                });

                            });
                        } //initIntervalWidth

                        //============================================================
                        //
                        //============================================================
                        function calcColWidths() {
                            $scope.colWidth = Number($scope.outerGridWidth) / Number($scope.timeIntervals.length);
                            initIntervalWidth();
                        } //init
                    } //calcColWidths
            }; //return
        }
    ]);
    // app.filter('momentFormat', function() {
    //     return function(input) {
    //         return input.format('dddd [the] Do of MMMM, YYYY');
    //     };
    // });
    //
    // app.filter('toHour', function() {
    //     return function(input) {
    //         return input.format('HH:mm');
    //     };
    // });
});