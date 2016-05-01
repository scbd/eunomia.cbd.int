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
                    'timeUnitRowCtrl': '=?'
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
                                'sideEvent': {
                                    'active': false
                                },
                                'cctv': {
                                    'active': false
                                }
                            };

                            initTypes();
                            initMaterial();


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

                            $scope.recurrence = [];
                            _.each($scope.conferenceDays, function(day, k) {
                                $scope.recurrence[k] = true;
                            });
                            //init reccurence
                            if($scope.doc.recurrence)
                            {
                              mongoStorage.getRecurrences($scope.doc._id).then(function(res){
                                if(!_.isEmpty(res.data)){
                                  $scope.doc.children=res.data;

                                  _.each(res.data,function(c,k){
                                      $scope.recurrence[k]=true;
                                  });
                                }else
                                  {
                                    $scope.doc.recurrence=false;
                                    $scope.save($scope.doc);
                                  }

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
                        function initTypes() {
                            var parentObj, typesTemp;
                            return mongoStorage.getDocs('reservation-types', status, true).then(function(result) {
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
                                if (isSideEvent()) {
                                    typesTemp = [];
                                    var seType = _.find($scope.options.types, {
                                        '_id': '570fd0a52e3fa5cfa61d90ee'
                                    });
                                    typesTemp.push();

                                    typesTemp = _.sortBy(seType.children, function(o) {
                                        return o.title;
                                    });
                                    _.each(typesTemp, function(t) {
                                        t.title = '___ ' + t.title;
                                    });
                                    typesTemp.unshift(seType);
                                    $scope.options.types = typesTemp;
                                }

                            }).catch(function onerror(response) {
                                $scope.onError(response);
                            });
                        }

                        //============================================================
                        //
                        //============================================================
                        function isSideEvent() {
                            if ($scope.doc.type === '570fd0a52e3fa5cfa61d90ee') return true;
                            var seType = _.find($scope.options.types, {
                                '_id': '570fd0a52e3fa5cfa61d90ee'
                            });
                            return _.find(seType.children, {
                                '_id': $scope.doc.type
                            });
                        }


                        // //============================================================
                        // //
                        // //============================================================
                        // function generateSeries() {
                        //     if(_.isEmpty($scope.series)) $scope.series= [];
                        // }//init



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
                                // $.material.init();
                                // $.material.input();
                                // $.material.ripples();
                                // $.material.checkbox();

                                $timeout(function() {
                                    if ($scope.doc.startT)
                                        $scope.doc.start = moment.utc($scope.doc.start).format('YYYY-MM-DD HH:mm');
                                    else
                                        $scope.doc.start = moment.utc($scope.startObj).format('YYYY-MM-DD HH:mm');
                                });

                                $timeout(function() {
                                    if ($scope.doc.end)
                                        $scope.doc.end = moment.utc($scope.doc.end).format('YYYY-MM-DD HH:mm');
                                    else
                                        $scope.doc.end = moment.utc($scope.doc.start).add(30, 'minutes').format('YYYY-MM-DD HH:mm');
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
                          if(!val)
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
                        function cleanReservation(res) {
                            if (!res) throw "Error: not res obj passed.";
                            var objClone = _.cloneDeep(res);
                            delete(objClone.test);
                            delete(objClone.startDisp);
                            delete(objClone.endDisp);
                            delete(objClone.typeObj);
                            delete(objClone.children);
                            objClone.start = moment.utc(objClone.start, 'YYYY-MM-DD HH:mm').format();
                            objClone.end = moment.utc(objClone.end, 'YYYY-MM-DD HH:mm').format();
                            addLocation(objClone);
                            return objClone;
                        } //initVunues

                        //============================================================
                        //
                        //============================================================
                        function addLocation(objClone) {

                            if (!objClone.location) {
                                objClone.location = {};
                                objClone.location.venue = '56d76c787e893e40650e4170';
                                objClone.location.room = $scope.room._id;
                            } else if (!objClone.location.venue)
                                objClone.location.venue = '56d76c787e893e40650e4170';

                        } //initVunues

                        //============================================================
                        //
                        //============================================================
                        $scope.hideCurrentDay = function(doc,day) {

                            return !(moment.utc(doc.start).startOf('day').isSame(moment.utc(day).startOf('day')));

                        }; //initVunues
                        //============================================================
                        //
                        //============================================================
                        function saveRecurrences(doc) {
                          var docClone;
                          if(!doc.children)doc.children=[];

                          if(!_.isEmpty($scope.recurrence)){

                              _.each($scope.recurrence,function(v,k){
                                    var isSame = (moment.utc(doc.start).startOf('day').isSame(moment.utc($scope.conferenceDays[0]).startOf('day').add(k,'days')));
                                    if(v && doc.children.length===0 && !isSame ){ // create
                                        docClone = cleanReservation(doc);
                                        delete(docClone._id);
                                        var resStartSeconds = moment.utc(doc.start).format('X')-moment.utc(doc.start).startOf('day').format('X');
                                        var resLengthSeconds = moment.utc(doc.end).format('X')-moment.utc(doc.start).format('X');
                                        docClone.start= moment.utc($scope.conferenceDays[0]).startOf('day').add(k,'days').add(resStartSeconds,'seconds').format();
                                        docClone.end= moment.utc(docClone.start).add(resLengthSeconds,'seconds').format();
                                        delete(docClone.recurrence);
                                        delete(docClone.meta);
                                        docClone.parent=doc._id;
                                        mongoStorage.save('reservations', docClone, docClone._id).catch(function(error) {
                                            console.log(error);
                                            $rootScope.$broadcast("showError", "There was an error saving your Reservation reccurence: '" + docClone.title + "' to the server.");
                                        });
                                    } else if(!v &&  doc.children[k]){ //delete
                                       docClone = cleanReservation(doc.children[k]);
                                       docClone.meta.status='deleted';

                                        mongoStorage.save('reservations', docClone, docClone._id).catch(function(error) {
                                            console.log(error);
                                            $rootScope.$broadcast("showError", "There was an error saving your Reservation reccurence: '" + docClone.title + "' to the server.");
                                        });
                                    }
                              });
                            }else throw"Error thrying to update reccurences but reccurrence is empty.";
                        } //initVunues
                        //============================================================
                        //
                        //============================================================
                        $scope.save = function(obj) {

                            var objClone = cleanReservation(obj);

                            return mongoStorage.save('reservations', objClone, objClone._id).then(function(res) {
                                $timeout(function() {
                                    if(res.data.id)obj._id=res.data.id;
                                    if (objClone.location.room !== $scope.room._id)
                                        $scope.timeUnitRowCtrl.resetSchedule();

                                    $scope.timeUnitRowCtrl.deleteRes(objClone);
                                    $scope.timeUnitRowCtrl.getReservations(objClone._id);
                                    if (!moment.utc($scope.day).isSame(moment.utc($scope.doc.start).startOf('day'), 'day'))
                                        $scope.timeUnitRowCtrl.setDay(moment.utc($scope.doc.start).startOf('day'));

                                    if($scope.doc.recurrence){
                                        saveRecurrences(obj);
                                    }
                                }, 500);
                                $rootScope.$broadcast("showInfo", "Reservation '" + objClone.title + "' Successfully Updated.");
                                $scope.closeThisDialog();
                            }).catch(function(error) {
                                console.log(error);
                                $rootScope.$broadcast("showError", "There was an error saving your Reservation: '" + objClone.title + "' to the server.");
                            });
                        }; //save
                        init();
                    } //link
            }; //return
        }
    ]);

    app.filter('momentDayFormat', function() {
        return function(input) {
            return moment.utc(input).format('dddd YYYY-MM-DD');
        };
    });
});