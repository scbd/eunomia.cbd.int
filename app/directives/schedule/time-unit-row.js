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
                    'day': '='
                },
                require: '^conferenceSchedule',
                link: function($scope, $element, $attr, schedule) {

                        $scope.schedule = schedule;


                        var timeUnit = 900.025; //15 minutes in seconds
                        var intervalDuration, allOrgs; // number on sub time intervals in a col, now a colomm is houw
                        intervalDuration = 3600 / timeUnit;

                        mongoStorage.getAllOrgs('inde-orgs', 'published').then(function(orgs) {
                            allOrgs = orgs.data;
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('conferenceDays', function() {
                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('startTime', function() {

                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('endTime', function() {

                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('day', function() {
                            if ($scope.day)
                                initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('room.rowHeight', function() {
                            if ($scope.room.rowHeight)
                                $element.height($scope.room.rowHeight);
                        });

                        initTypes();

                        //============================================================
                        //
                        //============================================================
                        function initTimeIntervals() {
                            if ($scope.startTime && $scope.endTime && $scope.conferenceDays && !_.isEmpty($scope.conferenceDays)) {

                                var hours = $scope.endTime.hours() - $scope.startTime.hours();

                                $scope.timeIntervals = [];

                                var t = moment($scope.day).add($scope.startTime.hours(), 'hours').add($scope.startTime.minutes(), 'minutes');

                                for (var i = 0; i <= hours; i++) {
                                    var intervalObj = {};
                                    intervalObj.subIntervals = [];
                                    intervalObj.interval = moment.utc(t);
                                    for (var j = 0; j < intervalDuration; j++) {
                                        intervalObj.subIntervals.push({
                                            time: moment.utc(t).startOf('minute'),
                                            res: {}
                                        });
                                        t = t.add(timeUnit, 'seconds');
                                    }
                                    $scope.timeIntervals.push(intervalObj);
                                }

                                initOuterGridWidth().then(function() {
                                    calcColWidths();
                                    getReservations();
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
                            $element.width($scope.outerGridWidth);
                        } //initDayWidth

                        //============================================================
                        //
                        //============================================================
                        function calcColWidths() {
                            $scope.colWidth = Number($scope.outerGridWidth) / Number($scope.timeIntervals.length);
                            initIntervalWidth();
                        } //init
                        var inProgress = false;

                        //============================================================
                        //
                        //============================================================
                        function initTypes() {

                            $scope.options = {};
                            return mongoStorage.getDocs('reservation-types', status, true).then(function(result) {
                                $scope.options.types = result.data;
                            }).catch(function onerror(response) {
                                $scope.onError(response);
                            });
                        } //initTypes()

                        //============================================================
                        //
                        //============================================================
                        function getReservations(resId) {
                            cleanSchedule(resId);
                            if (!_.isEmpty($scope.conferenceDays) && !inProgress) {

                                inProgress = true;
                                var start = moment($scope.conferenceDays[0]).startOf('day').format('X');
                                var end = moment($scope.conferenceDays[$scope.conferenceDays.length - 1]).endOf('day').format('X');

                                mongoStorage.getReservations(start, end, {
                                    room: $scope.room._id
                                }).then(
                                    function(responce) {

                                        $scope.reservations = responce.data;

                                        initTypes().then(function() {
                                            calcAllResWidths($scope.reservations);
                                            _.each($scope.reservations, function(res) {

                                                embedTypeInRes(res);
                                                embedOrgsSideEvent(res);
                                                loadReservationInRow(res);
                                            });
                                        });
                                        inProgress = false;
                                    }
                                ); // mongoStorage.getReservations
                            } // if
                        } // getReservations

                        //============================================================
                        //
                        //============================================================
                        function loadReservationInRow(res) {

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

                            var resStart = moment.utc(res.start).format('X');
                            var intervalStart = moment.utc(timeInterval.time).format('X');
                            var intervalEnd = moment.utc(timeInterval.time).add(timeUnit, 'seconds').format('X');

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
                            var resStart = moment.utc(res.start).format('X');
                            var resEnd = moment.utc(res.end).format('X');
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
                            if (typeFound) {
                                res.typeObj = typeFound;
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

                                    if (res._id === interval.res._id)
                                        interval.res = {};
                                }
                            }
                        } //calcResWidth



                        //============================================================
                        //
                        //============================================================
                        $scope.save = function(obj) {

                            var objClone = _.cloneDeep(obj);

                            delete(objClone.test);
                            delete(objClone.startDisp);
                            delete(objClone.endDisp);
                            delete(objClone.typeObj);
                            delete(objClone.repeat);
                            delete(objClone.repeatDay);
                            if (!objClone.location) {
                                objClone.location = {};
                                objClone.location.venue = '56d76c787e893e40650e4170';
                                objClone.location.room = $scope.room._id;
                            } else if (!objClone.location.venue)
                                objClone.location.venue = '56d76c787e893e40650e4170';

                            return mongoStorage.save('reservations', objClone, objClone._id).then(function() {
                                $timeout(function() {

                                    if (objClone.location.room !== $scope.room._id)
                                        $scope.schedule.resetSchedule();

                                    if (objClone.meta && objClone.meta.status === 'deleted') {
                                        var deleted = _.indexOf(_.pluck($scope.reservations, '_id'), objClone._id); //_.findKey($scope.reservations,{'_.id':objClone._id});
                                        delete($scope.reservations[deleted]);
                                        if (deleted === 0 || deleted) $scope.reservations.splice(deleted, 1);
                                    }

                                    getReservations(objClone._id);
                                }, 500);
                                $rootScope.$broadcast("showInfo", "Reservation '" + objClone.title + "' Successfully Updated.");
                            }).catch(function(error) {
                                console.log(error);
                                $rootScope.$broadcast("showError", "There was an error saving your Reservation: '" + objClone.title + "' to the server.");
                            });
                        }; //save

                        //============================================================
                        //
                        //============================================================
                        $scope.resDialog = function(doc, start) {

                            $scope.editRes = doc || {};
                            $scope.editStart = start;
                            var dialog = ngDialog.open({
                                template: resDialog,
                                className: 'ngdialog-theme-default',
                                closeByDocument: true,
                                plain: true,
                                scope: $scope
                            });
                            dialog.closePromise.then(function(ret) {
                                if (ret.value == 'save') $scope.save(doc).then($scope.close).catch(function onerror(response) {
                                    $scope.onError(response);
                                });
                            });
                        }; //$scope.roomDialog

                    } //link

            }; //return
        }
    ]);
});