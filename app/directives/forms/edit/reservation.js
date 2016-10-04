define(['app', 'lodash',
    'text!./reservation.html',
    'moment',
    '../../color-picker'
], function(app, _, template, moment) {

    app.directive("reservation", ['$timeout', 'mongoStorage', '$document', '$rootScope',
        function($timeout, mongoStorage, $document, $rootScope) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                scope: {
                    'doc': '=?',
                    'conferenceDays': '=?',
                    'day': '=?',
                    'startObj': '=?',
                    'closeThisDialog': '&',
                    'room': '=?',
                    'rooms': '=?',
                    'timeUnitRowCtrl': '=?',
                    'conference':'=?'
                },

                link: function($scope, $element) {

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('doc.start', function(val, prevVal) {
                            if (val && val !== prevVal) {
                                if (!moment.utc($scope.doc.start).isSame(moment.utc($scope.doc.end), 'day') && $scope.doc.end) {
                                    var t = moment.utc($scope.doc.end);
                                    $scope.doc.end = moment.utc($scope.doc.start).startOf('day').add(t.hours(), 'hours').add(t.minutes(), 'minutes').format('YYYY-MM-DD HH:mm');
                                }
                                if(moment.utc($scope.doc.start).isSameOrAfter(moment.utc($scope.doc.end)) && $scope.doc.end){
                                  var e = moment.utc($scope.doc.start);
                                  $scope.doc.end = moment.utc($scope.doc.start).startOf('day').add(e.hours(), 'hours').add(e.minutes()+30, 'minutes').format('YYYY-MM-DD HH:mm');
                                }
                                if(!$scope.doc.series || _.isEmpty($scope.doc.series)){
                                    $scope.doc.series = [];
                                    var countDays = 0;
                                    _.each($scope.conferenceDays, function(day, k) {
                                        var startDay = day.startOf('day').isSame(moment.tz($scope.doc.start,$scope.conference.timezone).startOf('day'));
                                        var isBefore = day.isSameOrBefore(moment.tz($scope.doc.start,$scope.conference.timezone));
                                        if(!isBefore ) countDays++;

                                        if(startDay)
                                          $scope.doc.series[k] = {date:moment($scope.doc.start).format(),selected:true};
                                        else{
                                          $scope.doc.series[k] = isBefore  ? {date:moment(day).add(countDays,'days').format(),selected:false} : {date:moment($scope.doc.start).add(countDays,'days').format(),selected:true};

                                        }
                                    });
                                }

                            }
                        });

                        //============================================================
                        //
                        //============================================================
                        function init() {
                            $scope.options = {};
                            $scope.tabs = {
                                'details': {
                                    'active': true
                                },
                                'recurrence': {
                                    'active': false
                                },
                                'recurrenceQuestion': {
                                    'active': false
                                },
                                'sideEvent': {
                                    'active': false
                                },
                                'cctv': {
                                    'active': false
                                }
                            };

                            initTypes();
                            initMaterial();

                            if(typeof $scope.doc.open ==='undefined')
                                $scope.doc.open=true;

                            if(typeof $scope.doc.confirmed ==='undefined')
                                $scope.doc.confirmed=true;

                            _.each($scope.rooms, function(r) {
                                r.selected = false;
                            });

                            if ($scope.doc.location)
                                _.find($scope.rooms, {
                                    '_id': $scope.doc.location.room
                                }).selected = true;
                            else if ($scope.room) {
                                $scope.doc.location = {};
                                $scope.doc.location.room = $scope.room._id;
                                _.find($scope.rooms, {
                                    '_id': $scope.doc.location.room
                                }).selected = true;
                            }

                            triggerChanges();
                            $scope.levelChangeSquare();

                            if ($scope.doc.recurrence) {
                                mongoStorage.getRecurrences($scope.doc.seriesId).then(function(res) {
                                    if (!_.isEmpty(res.data))
                                        $scope.recurrenceSeries = res.data;
                                });

                            }
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function triggerChanges() {

                            $element.find('input').each(function() {
                                $timeout($(this).trigger('change'), 100);
                                if ($(this).attr('id') !== 'test')
                                    isEmptyModel($(this));
                            }); //jquery each

                            $element.find('select').each(function() {
                                $timeout(isEmptyModel($(this)));
                            }); //jquery each
                        } //triggerChanges

                        //============================================================
                        // adds isEmpty css if ngModel empty
                        //============================================================
                        function isEmptyModel(el) {
                            var ngModel, ngModelSub, $formGroup;
                            ngModel = el.attr('ng-model');
                            if (ngModel && ngModel !== 'binding') {
                                ngModelSub = ngModel.substring(ngModel.indexOf('.') + 1, ngModel.length);
                                if (!_.get($scope.doc, ngModelSub)) {
                                    $formGroup = el.closest(".form-group");
                                    $formGroup.addClass("is-empty");
                                } //
                            } //if(ngModel)
                        } /// isEmptyModel

                        //============================================================
                        //
                        //============================================================
                        $scope.loadSubTypes = function(type) {
                            $scope.options.type = _.find($scope.options.types, {
                                '_id': type
                            });
                        }; //loadSubType

                        //============================================================
                        //
                        //============================================================
                        function initTypes() {

                            var parentObj;
                            var q={

                              schema:'reservations',
                              'meta.status':{'$nin':['deleted','archived']}
                            };
                            return mongoStorage.loadDocs('types',q,0,10000, false).then(function(result) {
                                $scope.options.types = result.data;

                                _.each($scope.options.types, function(type, key) {
                                    type.showChildren = true;
                                    if (type._id === $scope.doc.type) type.selected = true;
                                    if (type.parent) {
                                        parentObj = _.find($scope.options.types, {
                                            '_id': type.parent
                                        });
                                        if (!parentObj) throw "error ref to parent res type not found.";
                                        if (!parentObj.children) parentObj.children = [];
                                        parentObj.children.push(type);
                                        delete($scope.options.types[key]);
                                    }
                                });

                                if ($scope.doc.type)
                                    $scope.options.type = _.find($scope.options.types, {
                                        '_id': $scope.doc.type
                                    });
                            }).catch(function onerror(response) {
                                $scope.onError(response);
                            });
                        }

                        //============================================================
                        //
                        //============================================================
                        $scope.isSideEvent = function() {
                            if ($scope.doc.type === '570fd0a52e3fa5cfa61d90ee') return true;
                        }; //


                        //============================================================
                        //
                        //============================================================
                        $scope.editSeries = function(yes) {

                            $scope.editSeriesFlag = yes;
                            $scope.changeTab('details');
                        }; //$scope.editSeries

                        //============================================================
                        //
                        //============================================================
                        function deleteRes() {
                            if (confirm('Are you sure you would like to permanently delete this reservation?')) {
                                if (!$scope.doc.meta) $scope.doc.meta = {};
                                $scope.doc.meta.status = 'deleted';
                                $scope.save($scope.doc);
                                $scope.closeThisDialog();
                            }
                        } //init

                        $scope.deleteRes = deleteRes;
                        //============================================================
                        //
                        //============================================================
                        function initMaterial() {
                            $document.ready(function() {
                                $timeout(function() {
                                    if ($scope.doc.startT)
                                        $scope.doc.start = moment.tz($scope.doc.start,$scope.conference.timezone).format('YYYY-MM-DD HH:mm');
                                    else
                                        $scope.doc.start = moment.tz($scope.startObj,$scope.conference.timezone).format('YYYY-MM-DD HH:mm');
                                });

                                $timeout(function() {
                                    if ($scope.doc.end)
                                        $scope.doc.end = moment.tz($scope.doc.end,$scope.conference.timezone).format('YYYY-MM-DD HH:mm');
                                    else
                                        $scope.doc.end = moment.tz($scope.doc.start,$scope.conference.timezone).add(30, 'minutes').format('YYYY-MM-DD HH:mm');
                                });
                            });
                        } //init

                        //============================================================
                        //
                        //============================================================
                        $scope.changeTab = function(tabName) {
                            _.each($scope.tabs, function(tab) {
                                tab.active = false;
                            });
                            $scope.tabs[tabName].active = true;
                        }; //initVunues

                        //============================================================
                        //
                        //============================================================
                        $scope.deleteRec = function(val) {
                            if (!val)
                                confirm("Are you sure you want to delete this Recurrence?");
                        }; //initVunues

                        //============================================================
                        //
                        //============================================================
                        function levelChangeSquare() {
                            var levelColor = {};
                            levelColor.warning = '#ff9999';
                            levelColor.alert = '#e81e25';
                            if ($scope.doc && $scope.doc.message && $scope.doc.message.level)
                                $element.find('#levelChangeSquare').css('color', levelColor[$scope.doc.message.level]);

                        } //initVunues
                        $scope.levelChangeSquare = levelChangeSquare;

                        //============================================================
                        //
                        //============================================================
                        function cleanReservation(res, isNew) {
                            if (!res) throw "Error: not res obj passed.";
                            var objClone = _.cloneDeep(res);
                            if(isNew){
                                delete(objClone._id);
                                delete(objClone.meta);
                                delete(objClone.history);
                            }

                            if(!objClone.recurrence) delete(objClone.series);
                            delete(objClone.test);
                            delete(objClone.startDisp);
                            delete(objClone.endDisp);
                            delete(objClone.typeObj);
                            delete(objClone.children);
                            delete(objClone.subTypeObj);
                            delete(objClone.resWidth);
                            if(!objClone.description)objClone.description=' ';
                            objClone.start = moment.utc(moment.tz(objClone.start,$scope.conference.timezone)).format();
                            objClone.end = moment.utc(moment.tz(objClone.end,$scope.conference.timezone)).subtract(1,'seconds').format();//moment.tz(objClone.end,$scope.conference.timezone);

                            addLocation(objClone);
                            return objClone;
                        } //initVunues

                        //============================================================
                        //
                        //============================================================
                        function addLocation(objClone) {

                            if(!objClone.location)            objClone.location = {};
                            if(!objClone.location.room)       objClone.location.room = $scope.room._id;
                            if(!objClone.location.conference) objClone.location.conference= $scope.conference._id;
                            if(!objClone.location.venue)      objClone.location.venue = $scope.conference.venueId;
                        } //initVunues

                        //============================================================
                        //
                        //============================================================
                        $scope.loadSubType = function(type) {
                            $scope.options.type = _.find($scope.options.types, {
                                '_id': type
                            });
                        }; //loadSubType

                        //============================================================
                        //
                        //============================================================
                        function saveRec(doc, k, isNew) {
                            var docClone = cleanReservation(doc,isNew);


                            if(!isNew){
                              var diff= moment(docClone.end).diff(moment(docClone.start),'minutes');

                                docClone.start = moment($scope.doc.series[k].date).format();
                                docClone.end = moment($scope.doc.series[k].date).add(diff, 'minutes').format();
                                docClone._id = retRecId($scope.doc.series[k].date,$scope.recurrenceSeries);

                            }else{
                              docClone.start = moment.tz(docClone.start,$scope.conference.timezone).add(k, 'days').format();
                              docClone.end = moment.tz(docClone.end,$scope.conference.timezone).add(k, 'days').format();
                            }

                            if((docClone._id && !isNew) || (!docClone._id && isNew))
                            mongoStorage.save('reservations',docClone).catch(function(error) {
                                console.log(error);
                                $rootScope.$broadcast("showError", "There was an error saving your Reservation reccurence: '" + docClone.title + "' to the server.");
                            });
                        } //initVunues

                        //============================================================
                        //
                        //============================================================
                        function retRecId(start,children) {
                            var res = _.find(children,function(child){
                                            if(moment(child.start).isSame(start))
                                              return true;
                                            else {
                                              return false;
                                            }
                                      });

                            if(res)
                              return res._id;
                            else
                              return false;
                        }

                        //============================================================
                        //
                        //============================================================
                        function deleteRec(start) {
                            var resId=retRecId(start,$scope.recurrenceSeries);
                            var docClone ={};
                            docClone.meta ={};
                            docClone.meta.status = 'deleted';
                            docClone._id=resId;

                            mongoStorage.save('reservations', docClone, docClone._id).catch(function(error) {
                                console.log(error);
                                $rootScope.$broadcast("showError", "There was an error saving your Reservation reccurence: '" + docClone.title + "' to the server.");
                            });
                        } //initVunues

                        //============================================================
                        //
                        //============================================================
                        $scope.hideCurrentandPastDays = function(doc, day) {
                            if(doc.seriesId) return true;
                            return (moment.utc(doc.start).startOf('day').isBefore(moment.utc(day).startOf('day')));
                        }; //initVunues

                        //============================================================
                        //
                        //============================================================
                        function guid() {
                          function s4() {
                            return Math.floor((1 + Math.random()) * 0x10000)
                              .toString(16)
                              .substring(1);
                          }
                          return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                            s4() + '-' + s4() + s4() + s4();
                        }

                        //============================================================
                        //
                        //============================================================
                        function saveRecurrences(doc) {

                            if (doc.recurrence) {


                                if (!_.isEmpty(doc.series)) {

                                    var daysCount =0;

                                    _.each(doc.series, function(v, k) {
                                        var isAfter = (moment(doc.start).isSameOrAfter(moment($scope.conferenceDays[0]).startOf('day').add(k, 'days')));
                                        if(!isAfter) daysCount++;

                                        if (v.selected && !isAfter && isNewReservationInSeries(v.date)) { // create on create after existing date


                                            saveRec(doc, daysCount,true);
                                        } else if(v.selected && !isNewReservationInSeries(v.date)){ //edit
                                            saveRec(doc, k);
                                        }else if(!v.selected && !isNewReservationInSeries(v.date) ){
                                            deleteRec(v.date);
                                        }

                                    });
                                } else throw "Error thrying to update reccurences but reccurrence is empty.";
                            }
                        } //


                        //============================================================
                        // returns true if it does not exist in series
                        //============================================================
                        function isNewReservationInSeries(start) {
                            return !retRecId(start,$scope.recurrenceSeries);
                        }


                        //============================================================
                        //
                        //============================================================
                        function saveSideEvent(doc) {
                            if ($scope.isSideEvent()) {
                                mongoStorage.save('inde-side-events', doc.sideEvent).catch(function(error) {
                                    console.log(error);
                                    $rootScope.$broadcast("showError", "There was an error saving your Side Event: #'" + doc.sideEvent.id + "' to the server.");
                                });
                            }
                        } //saveSideEvent

                        //============================================================
                        //
                        //============================================================
                        $scope.save = function(obj) {

                            if ($scope.isSideEvent()) {
                                obj.sideEvent.title = obj.title;
                                obj.sideEvent.description = obj.description;
                            }

                            if(!obj.seriesId && obj.recurrence) obj.seriesId = guid();

                            var objClone = cleanReservation(obj);


                            if(!objClone.start || !objClone.end ) throw "Error missing start or end time or location.";

                            return mongoStorage.save('reservations', objClone).then(function(res) {
                                $timeout(function() {
                                    if (res.data.id) obj._id = res.data.id;

                                    if (objClone.location.room !== $scope.room._id) // if user chose new room reload schedule
                                        $scope.timeUnitRowCtrl.resetSchedule();

                                    $scope.timeUnitRowCtrl.deleteRes(objClone);
                                    $scope.timeUnitRowCtrl.getReservations(objClone._id); // reload row to show changes by save
                                    if (!moment.utc($scope.day).isSame(moment.utc($scope.doc.start).startOf('day'), 'day')) // if user changes the day change view to that day
                                        $scope.timeUnitRowCtrl.setDay(moment.utc($scope.doc.start).startOf('day'));

                                    saveRecurrences(obj);

                                }, 500);
                                $rootScope.$broadcast("showInfo", "Reservation '" + objClone.title + "' Successfully Updated.");
                                $scope.closeThisDialog();
                            }).catch(function(error) {
                                console.log(error);
                                $rootScope.$broadcast("showError", "There was an error saving your Reservation: '" + error.data.message + "' to the server.");
                            });
                        }; //save
init();
                    } //link
            }; //return
        }
    ]);

});