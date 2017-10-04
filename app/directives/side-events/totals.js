define(['app',
    'lodash',
    'text!./totals.html',

], function(app, _, template) {

    app.directive("totals", ['$q','$document',
        function( $q,$document) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,

                link: function($scope, $element) {

                        var timeUnit = 900.025; //15 minutes in seconds
                        var intervalDuration; // number on sub time intervals in a col, now a colomm is houw
                        intervalDuration = 3600 / timeUnit;
                        var initialized = false;

                        // ============================================================
                        //
                        // ============================================================
                        var killW = $scope.$watch('reservations', function() {
                              if(!_.isEmpty($scope.reservations) ){
                                  initTimeIntervals();
                                  killW();
                              }
                        });

                        //============================================================
                        //
                        //============================================================
                        function initTimeIntervals() {

                          initialized=true;

                          if(!_.isObject($scope.bagScopes))
                            $scope.bagScopes = {};

                          $scope.timezone=$scope.conference.timezone;

                          if ($scope.conferenceDays && !_.isEmpty($scope.conferenceDays)) {
                                $scope.firstDay = moment.tz($scope.conferenceDays[0],$scope.conference.timezone).startOf('day');
                                $scope.lastDay =moment.tz($scope.conferenceDays[$scope.conferenceDays.length-1],$scope.conference.timezone).startOf('day');

                                $scope.timeIntervals=[];
                                if($scope.conferenceDays && $scope.conferenceDays.length)
                                  $scope.conferenceDays.forEach(function(item){
                                    $scope.conference.seTiers.forEach(function(tier){
                                        var cell ={};
                                        cell.dayTier = moment.tz(item,$scope.conference.timezone).startOf('day').add(tier.seconds,'seconds');
                                        cell.id ='totals'+cell.dayTier.format('YYYYMMDDTHHmm');
                                        cell.room = 'totals';
                                        cell.drag = false;
                                        cell.bag=[];

                                        if(cell.dayTier.isoWeekday()<6)
                                            $scope.timeIntervals.push(cell);


                                        $scope.bagScopes[cell.id]=cell.bag;
                                    });

                                  });

                                  $scope.getTotals();

                            }
                        } //initTimeIntervals


                        // //============================================================
                        // //
                        // //============================================================
                        // function initOuterGridWidth() {
                        //     var scrollGridEl;
                        //     var deferred = $q.defer();
                        //     var countInterval = 0;
                        //
                        //     var cancInterval = setInterval(function() {
                        //         $document.ready(function() {
                        //             scrollGridEl = $document.find('#scroll-grid');
                        //             $scope.outerGridWidth = Number(scrollGridEl.width() - 1);
                        //
                        //             countInterval++;
                        //
                        //             if ($scope.outerGridWidth && countInterval < 25) {
                        //                 clearInterval(cancInterval);
                        //                 deferred.resolve(scrollGridEl);
                        //             } else {
                        //                 clearInterval(cancInterval);
                        //                 deferred.reject('time out');
                        //             }
                        //             if (countInterval > 24) {
                        //                 deferred.reject('time out');
                        //                 clearInterval(cancInterval);
                        //             }
                        //         });
                        //     }, 100);
                        //
                        //     return deferred.promise;
                        // } //initOuterGridWidth

                        // //============================================================
                        // //
                        // //============================================================
                        // function initIntervalWidth() {
                        //     $element.css('max-width',$scope.outerGridWidth);
                        // } //initDayWidth

                        // //============================================================
                        // //
                        // //============================================================
                        // function calcColWidths() {
                        //    $scope.colWidth = $scope.$parent.colWidth;
                        //
                        //    initIntervalWidth();
                        // } //init


                        //============================================================
                        //
                        //============================================================
                        $scope.getTotals = function () {

                            _.each($scope.rooms, function(room) {
                                    _.each($scope.reservations[room._id], function(res) {

                                        isReservationInRow(res);
                                    });
                            });
                        }; // getReservations


                        //============================================================
                        //
                        //============================================================
                        function isReservationInRow(res) {

                            for (var i = 0; i < $scope.timeIntervals.length; i++) {

                                    var interval = $scope.timeIntervals[i];
                                    if(!$scope.timeIntervals[i].totals) $scope.timeIntervals[i].totals=0;
                                    if (isResInTimeInterval(interval.dayTier, res))
                                        $scope.timeIntervals[i].totals++;

                            } //for
                        } //loadReservationInRow


                        //============================================================
                        //
                        //============================================================
                        function isResInTimeInterval(timeInterval, res) {
                            return  moment.tz(res.start,$scope.conference.timezone).isSameOrAfter(timeInterval) &&
                                    moment.tz(res.start,$scope.conference.timezone).isBefore(moment.tz(timeInterval,$scope.conference.timezone).add(90,'minutes'));

                        } //isResInInterval
                    }, //link
            }; //return
        }
    ]);
});