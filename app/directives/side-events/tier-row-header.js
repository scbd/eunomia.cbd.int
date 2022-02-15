define(['app', 'lodash', 'text!./tier-row-header.html', 'moment-timezone','filters/moment', 'services/when-element' ], function(app, _, template, moment) {

    app.directive("tierRowHeader",  ['$timeout','whenElement',
        function($timeout, whenElement) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                scope: {
                    'isOpen':'=',
                    'conferenceDays':'=',
                    'conference':'=',
                    'colWidth':'=',
                    'outerGridWidth':'='
                },
                controller: function($scope, $element, $document) {

                        // //============================================================
                        // //
                        // //============================================================
                        $scope.$watch('conferenceDays', function() {
                            if (!_.isEmpty($scope.conferenceDays))
                                initTimeIntervals();
                        });
                        //
                        // //============================================================
                        // //
                        // //============================================================
                        $scope.$watch('isOpen', function() {
                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        function initTimeIntervals() {
                            $scope.timezone=$scope.conference.timezone;

                            if ($scope.conferenceDays && !_.isEmpty($scope.conferenceDays)) {
                                $scope.firstDay = moment.tz($scope.conferenceDays[0],$scope.conference.timezone).startOf('day');
                                $scope.lastDay =moment.tz($scope.conferenceDays[$scope.conferenceDays.length-1],$scope.conference.timezone).startOf('day');

                                $scope.timeIntervals=[];
                                if($scope.conferenceDays && $scope.conferenceDays.length)
                                $scope.conferenceDays.forEach(function(item){
                                  $scope.conference.seTiers.forEach(function(tier){
                                      var dayTier = moment.tz(item,$scope.conference.timezone).startOf('day').add(tier.seconds,'seconds');
                                    //   if(dayTier.isoWeekday()<6)
                                          $scope.timeIntervals.push(dayTier);
                                  });
                                });
                                initOuterGridWidth();
                            }
                        } //initTimeIntervals

                        //============================================================
                        //
                        //============================================================
                        function initOuterGridWidth() {
                            var scrollGridEl;
                            $document.ready(() => whenElement('scroll-grid', $element).then(getAndSetOuterGrid));
                        } //initOuterGridWidth

                        function getAndSetOuterGrid(scrollGridEl) {
                          $scope.outerGridWidth = Number(scrollGridEl.width() - 1);

                          if (!$scope.outerGridWidth) throw "Error: outer grid width not found timing issue.";
                          // initDayWidth();
                          calcColWidths();
                        };
                        // //============================================================
                        // //
                        // //============================================================
                        // function initDayWidth() {
                        //
                        //     $element.find('#day-header-' + 0).css('width', $scope.outerGridWidth);
                        //     $element.find('#interval-header-' + 0).css('width', $scope.outerGridWidth);
                        // } //initDayWidth

                        //============================================================
                        //
                        //============================================================
                        // function initIntervalWidth() {
                        //     _.each($scope.timeIntervals, function(con, key) {
                        //         $timeout(function() {
                        //             $element.find('#sub-interval-header-' + key).css('width', $scope.colWidth);
                        //         });
                        //
                        //     });
                        // } //initIntervalWidth

                        //============================================================
                        //
                        //============================================================
                        function calcColWidths() {
                            $scope.colWidth =  Number($scope.outerGridWidth) / Number($scope.timeIntervals.length);

                        //    initIntervalWidth();
                        } //calcColWidths

                    } //
            }; //return
        }
    ]);
});