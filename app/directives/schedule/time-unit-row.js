define(['app',
    'lodash',
    'text!./time-unit-row.html',
    'text!../forms/edit/reservation-dialog.html',
    'moment',
    'ngDialog',
    '../forms/edit/reservation',
    './grid-reservation'
], function(app, _, template, resDialog, moment) {

    app.directive("timeUnitRow", ['ngDialog', '$timeout', '$document', '$http', 'mongoStorage', '$rootScope', '$q',
        function(ngDialog, $timeout, $document, $http, mongoStorage, $rootScope, $q) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                scope: {
                    'startTime': '=',
                    'endTime': '=',
                    'conferenceDays': '=',
                    'room': '=',
                    'rooms': '=',
                    'day': '=',
                    'conference':'=',
                    'reservations':'=',
                    'options':'='
                },
                require: ['^conferenceSchedule','timeUnitRow'],
                link: function($scope, $element, $attr, schedule) {

                        $scope.schedule = schedule[0];
                        $scope.timeUnitRowCtrl = schedule[1];

                        var timeUnit = 900.025; //15 minutes in seconds
                        var intervalDuration, allOrgs; // number on sub time intervals in a col, now a colomm is houw
                        intervalDuration = 3600 / timeUnit;
                        $scope.intervalDuration = intervalDuration;


                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('conferenceDays', function() {
                          if(!_.isEmpty($scope.conferenceDays) && !_.isEmpty($scope.reservations))
                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('startTime', function() {
                          if($scope.startTime && !_.isEmpty($scope.reservations))
                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('endTime', function() {
                          if($scope.endTime && !_.isEmpty($scope.reservations))
                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('day', function() {
                            if ($scope.day && !_.isEmpty($scope.reservations))
                                initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('room.rowHeight', function() {
                            if ($scope.room.rowHeight)
                                $element.css('height',$scope.room.rowHeight);
                        });

                        var inProgress = false;
                        //============================================================
                        //
                        //============================================================
                        function initTimeIntervals() {

                            if ($scope.startTime && $scope.endTime && $scope.conferenceDays && !_.isEmpty($scope.conferenceDays) && !inProgress) {
                                inProgress =true;
                                var hours = $scope.endTime.hours() - $scope.startTime.hours();

                                $scope.timeIntervals = [];

                                var t = moment($scope.day).add($scope.startTime.hours(), 'hours').add($scope.startTime.minutes(), 'minutes');

                                for (var i = 0; i <= hours; i++) {
                                    var intervalObj = {};
                                    intervalObj.subIntervals = [];
                                    intervalObj.interval = moment(t);
                                    for (var j = 0; j < intervalDuration; j++) {
                                        intervalObj.subIntervals.push({
                                            time: moment(t).startOf('minute'),
                                            res: {}
                                        });
                                        t = t.add(timeUnit, 'seconds');
                                    }
                                    $scope.timeIntervals.push(intervalObj);
                                }

                                initOuterGridWidth().then(function() {
                                    calcColWidths();
                                    $scope.getReservations();
                                });
                            }
                        } //initTimeIntervals

                        //============================================================
                        //
                        //============================================================
                        function initOuterGridWidth() {
                            var scrollGridEl;
                            var deferred = $q.defer();
                            var countInterval = 0;

                            var cancInterval = setInterval(function() {
                                $document.ready(function() {
                                    scrollGridEl = $document.find('#scroll-grid');
                                    $scope.outerGridWidth = Number(scrollGridEl.width() - 1);

                                    countInterval++;

                                    if ($scope.outerGridWidth && countInterval < 25) {
                                        clearInterval(cancInterval);
                                        deferred.resolve(scrollGridEl);
                                    } else {
                                        clearInterval(cancInterval);
                                        deferred.reject('time out');
                                    }
                                    if (countInterval > 24) {
                                        deferred.reject('time out');
                                        clearInterval(cancInterval);
                                    }
                                });
                            }, 100);

                            return deferred.promise;
                        } //initOuterGridWidth

                        //============================================================
                        //
                        //============================================================
                        function initIntervalWidth() {
                            $element.css('width',$scope.outerGridWidth);
                        } //initDayWidth

                        //============================================================
                        //
                        //============================================================
                        function calcColWidths() {
                            $scope.colWidth = Number($scope.outerGridWidth) / Number($scope.timeIntervals.length);
                            initIntervalWidth();
                        } //init

                        //============================================================
                        //ensure deleted res do not remain
                        //============================================================
                        function cleanSchedule(res) {

                            if (!_.isObject(res)) {
                                res = {
                                    '_id': res
                                };
                            }
                            for (var i = 0; i < $scope.timeIntervals.length; i++) {
                                for (var j = 0; j < intervalDuration; j++) {
                                    var interval = $scope.timeIntervals[i].subIntervals[j];

                                    if (res._id === interval.res._id)
                                        interval.res = {};
                                }
                            }
                        } //calcResWidth


                          //============================================================
                          //
                          //============================================================
                          $scope.resetSchedule = function () {
                              $scope.schedule.resetSchedule();
                          };

                        //============================================================
                        //
                        //============================================================
                        $scope.getReservations = function (resId) {

                            if (resId) return reloadRow(resId);
                            return $q.when($scope.reservations).then(function(responce){
                              calcAllResWidths(responce[$scope.room._id]);
                              if (!_.isEmpty($scope.conferenceDays) )
                                 _.each(responce[$scope.room._id], function(res) {
                                     embedTypeInRes(res);
                                     embedOrgsSideEvent(res);
                                     loadReservationsInRow(res);
                                 });
                                 inProgress =false;
                            });
                        }; // getReservations


                        //============================================================
                        //
                        //============================================================
                        function reloadRow (resId) {
                            cleanSchedule(resId);
                            if (!_.isEmpty($scope.conferenceDays) && !inProgress) {

                                inProgress = true;

                                var q={
                                  'location.room': $scope.room._id,
                                  '$and': [{
                                      'start': {
                                          '$gte': {
                                              '$date': moment.tz($scope.conferenceDays[0],$scope.conference.timezone).startOf('day').format()
                                          }
                                      }
                                  }, {
                                      'end': {
                                          '$lt': {
                                              '$date': moment.tz($scope.conferenceDays[$scope.conferenceDays.length - 1],$scope.conference.timezone).endOf('day').format()
                                          }
                                      }
                                  }],
                                  'meta.status': {
                                      $nin: ['archived', 'deleted']
                                  }
                                };

                                var f = {open:1,confirmed:1,title:1,start:1,end:1,location:1,'sideEvent.title':1,'sideEvent.hostOrgs':1,'sideEvent.id':1,type:1,agenda:1,seriesId:1};

                              return mongoStorage.loadDocs('reservations',q, 0,1000000,false,{},f).then(
                                    function(responce) {

                                        $scope.reservations = responce.data;


                                            calcAllResWidths($scope.reservations);
                                            _.each($scope.reservations, function(res) {
                                                embedTypeInRes(res);
                                                embedOrgsSideEvent(res);
                                                loadReservationsInRow(res);
                                            });
                                        inProgress = false;
                                    }
                                ); // mongoStorage.getReservations
                            } // if
                        }; // getReservations

                        //============================================================
                        //
                        //============================================================
                        function loadReservationsInRow(res) {

                            for (var i = 0; i < $scope.timeIntervals.length; i++) {
                                for (var j = 0; j < intervalDuration; j++) {
                                    var interval = $scope.timeIntervals[i].subIntervals[j];

                                    if (isResInTimeInterval(interval, res))
                                        interval.res = res;
                                    else if (!_.isEmpty(interval.res) && isResDeleted(interval.res))
                                        delete(interval.res);
                                } //for
                            } //for


                        } //loadReservationInRow

                        //============================================================
                        //
                        //============================================================
                        function isResInTimeInterval(timeInterval, res) {

                            var resStart = moment(res.start).format('X');
                            var intervalStart = moment(timeInterval.time).format('X');
                            var intervalEnd = moment(timeInterval.time).add(timeUnit, 'seconds').format('X');

                            return (resStart >= intervalStart && resStart < intervalEnd);

                        } //isResInInterval

                        //============================================================
                        //
                        //============================================================
                        function calcAllResWidths(reservations) {
                            _.each(reservations, function(res) {
                                res.resWidth = calcResWidth(res);
                            });
                        } //calcAllResCWidths

                        //============================================================
                        //
                        //============================================================
                        function isResDeleted(res) {

                            return (res.meta && res.meta === 'deleted');
                        } //isResDeleted

                        //============================================================
                        //
                        //============================================================
                        function calcResWidth(res) {
                            var resStart = moment(res.start).format('X');
                            var resEnd = moment(res.end).format('X');
                            if (!$scope.colWidth) throw "Error: column width not set timming issue";
                            var resWidth = Math.ceil((resEnd - resStart) / timeUnit) * ($scope.colWidth / intervalDuration);
                            return Number(resWidth);
                        } //calcResWidth

                        //============================================================
                        //
                        //===========================================================
                        function embedOrgsSideEvent(res) {
                            if (res.sideEvent && _.isEmpty(res.sideEvent.orgs)) {
                                res.sideEvent.orgs = [];
                                _.each(res.sideEvent.hostOrgs, function(org) {
                                    res.sideEvent.orgs.push(_.find(allOrgs, {
                                        '_id': org
                                    }));
                                });
                            }
                        } //embedOrgsSideEvent

                        //============================================================
                        //
                        //===========================================================
                        function embedTypeInRes(res) {
                            var typeFound = _.find($scope.options.types, {
                                '_id': res.type
                            });
                            var subFound = _.find($scope.options.types, {
                                '_id': res.subType
                            });
                            if (typeFound) {
                                res.typeObj = typeFound;
                            }
                            if (subFound ) {
                                res.subTypeObj = subFound;
                            }
                        } //embedTypeInRes

                        //============================================================
                        //ensure deleted res do not remain
                        //============================================================
                        function cleanSchedule(res) {

                            if (!_.isObject(res)) {
                                res = {
                                    '_id': res
                                };
                            }

                            for (var i = 0; i < $scope.timeIntervals.length; i++) {
                                for (var j = 0; j < intervalDuration; j++) {
                                    var interval = $scope.timeIntervals[i].subIntervals[j];

                                    if (interval.res && res._id === interval.res._id)
                                        interval.res = {};
                                }
                            }
                        } //calcResWidth


                        //============================================================
                        //
                        //============================================================
                        $scope.resDialog = function(doc, start, tab) {

                              if(!doc || !doc._id)
                                $scope.editRes = {};
                              else
                                $scope.editRes=doc;
                              if(tab)
                                $scope.tab=tab;


                            $scope.editStart = start;
                            ngDialog.open({
                                template: resDialog,
                                className: 'ngdialog-theme-default',
                                closeByDocument: true,
                                plain: true,
                                scope: $scope,
                                width: 800
                            });

                        }; //$scope.roomDialog

                    }, //link

                    controller:function($scope){

                      $scope.getReservations='';
                      //============================================================
                      //
                      //===========================================================
                      this.resetSchedule= function() {
                          $scope.schedule.resetSchedule();
                      }; //resetSchedule

                      //============================================================
                      //
                      //===========================================================
                      this.setDay= function(day) {
                          $scope.schedule.setDay(day);
                      }; //resetSchedule

                      //============================================================
                      //
                      //===========================================================
                      this.deleteRes= function(res) {

                        $timeout(function(){
                              if (!_.isObject(res)) {
                                  res = {
                                      '_id': res
                                  };
                              }

                              for (var i = 0; i < $scope.timeIntervals.length; i++) {
                                  for (var j = 0; j < $scope.intervalDuration; j++) {
                                      var interval = $scope.timeIntervals[i].subIntervals[j];

                                      if (res && interval.res && (res._id === interval.res._id))
                                          delete(interval.res);
                                  }
                              }
                          //  }
                        });
                      };//deleteRes

                      //============================================================
                      //
                      //===========================================================
                      this.getReservations= function(objId) {
                          return  $scope.getReservations(objId);
                      }; //resetSchedule
                      //============================================================
                      //
                      //===========================================================
                      this.resetSchedule = function() {
                          return $scope.resetSchedule();
                      }; //resetSchedule
                    }

            }; //return
        }
    ]);
});
