define(['app', 'lodash',
    'text!./reservation.html',
    'moment',
    '../../color-picker',
    'directives/color-picker',
    'directives/agenda-select',
    'directives/forms/edit/disable-auto-trim'
], function(app, _, template, moment) {

    app.directive("reservation", ['$timeout', 'mongoStorage', '$document', '$rootScope','$http', 'whenElement',
        function($timeout, mongoStorage, $document, $rootScope, $http, whenElement) {
            return {
                restrict  : 'E'     ,
                template  : template,
                replace   : true    ,
                transclude: false   ,
                scope: {
                          'doc'            : '=?',
                          'conferenceDays' : '=?',
                          'day'            : '=?',
                          'startObj'       : '=?',
                          'closeThisDialog': '&',
                          'room'           : '=?',
                          'rooms'          : '=?',
                          'timeUnitRowCtrl': '=?',
                          'conference'     : '=?',
                          'tab'            : "=?"
                      },

                link: function($scope, $element) {
                        
                        $scope.addLinkStore    = { name: '', url: '', locale: 'en' }
                        $scope.validLink       = true
                        $scope.copyToClipboard = copyToClipboard


                        //============================================================
                        //
                        //============================================================
                        async function getInteractioEVentsMap(){
                          const s = { 'title': 1 };
                          const { data: interactioEventsMap } = await $http.get('https://api.cbd.int/api/v2022/interactio-events-map', { params: { s } })

                          $scope.interactioEventsMap = addAutoInteractioEvent(interactioEventsMap)
                        };

                      
                        //============================================================
                        //
                        //============================================================
                        function addAutoInteractioEvent(interactioEventsMap){
                          if(!hasDefaultInteractioEvent()) return interactioEventsMap

                          const { interactioEventId, linksTemplate }  = $scope.room


                          const interactioEvent = interactioEventsMap.find(({ interactioEventId:id }) => { return (interactioEventId === id)})

                          const   auto = { ...interactioEvent, title: `AUTO - ${interactioEvent.title}`, interactioEventId, linkTemplates: [ linksTemplate ] }

                          interactioEventsMap.unshift(auto)

                          return interactioEventsMap
                        }

                        //============================================================
                        //
                        //============================================================
                        function hasDefaultInteractioEvent(){
                          return $scope.room && $scope.room.interactioEventId
                        }

                        $scope.hasInteractioEventLinkTemplates = hasInteractioEventLinkTemplates
                        $scope.getLinkTemplates                = hasInteractioEventLinkTemplates

                      
                        //============================================================
                        //
                        //============================================================  
                        function hasInteractioEventLinkTemplates(id){
                          if(!id) return false

                          const found = $scope.interactioEventsMap.find(({ interactioEventId }) => (interactioEventId === id))

                          if(found && found.linksTemplates && found.linksTemplates.length)
                          return found.linksTemplates

                          return false
                        }

                        //============================================================
                        //
                        //============================================================
                        $scope.removeLink = function(index) {
                          $scope.doc.links.splice(index, 1)
                        };

                        //============================================================
                        //
                        //============================================================
                        $scope.addLink = function(linkObj) {
                          $scope.doc.links = $scope.doc.links || []
                          if(!linkObj.url) return $scope.validLink = false
                          
                          $scope.doc.links.push(JSON.parse(JSON.stringify(linkObj)))
                          linkObj.name = ''
                          linkObj.url = ''
                        };
                        
                        //============================================================
                        //
                        //============================================================
                        $scope.isAdmin = function() {
                            return _.intersection($rootScope.user.roles, [ 'EunoAdministrator']).length > 0;
                        };

                        //============================================================
                        //
                        //============================================================
                        function init() {

                            $scope.options = { locales: ['ar', 'en', 'es', 'fr', 'ru', 'zh'] };
                            $scope.tabs    = {
                                                'details'           : { 'active': false },
                                                'recurrence'        : { 'active': false },
                                                'recurrenceQuestion': { 'active': false },
                                                'sideEvent'         : { 'active': false },
                                                'cctv'              : { 'active': false },
                                                'agenda'            : { 'active': false },
                                                'options'           : { 'active': false },
                                                'interactio'        : { 'active': false }
                                            };

                            if($scope.doc._id)
                              mongoStorage.loadDoc('reservations',$scope.doc._id).then(function(res){
                                  $scope.doc=res;
                                  $scope.doc.start=moment.tz(res.start,$scope.conference.timezone).format('YYYY-MM-DD HH:mm');
                                  $scope.doc.end=moment.tz(res.end,$scope.conference.timezone).format('YYYY-MM-DD HH:mm');
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
                              });

                            if($scope.tab) $timeout($scope.changeTab($scope.tab),100);
                            else $scope.changeTab('details');

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
                            if(!$scope.doc.agenda) $scope.doc.agenda={};

                            $scope.levelChangeSquare();

                            if ($scope.doc.recurrence) {
                                mongoStorage.getRecurrences($scope.doc.seriesId).then(function(res) {
                                    if (!_.isEmpty(res.data))
                                        $scope.recurrenceSeries = res.data;


                                }).then(availableApiCall);

                            }

                          //============================================================
                          //
                          //============================================================
                          $scope.$watch('doc.recurrence', function(val, prevVal) {
                              if (val && val !== prevVal) {
                                availableApiCall();
                              }
                            });

                          //============================================================
                          //
                          //============================================================
                          $scope.$watch('doc.end', function(val, prevVal) {
                              if (val && val !== prevVal && $scope.doc.recurrence) {
                                availableApiCall();
                              }
                          });

                          //============================================================
                          //
                          //============================================================
                          $scope.$watch('doc.start', function(val, prevVal) {
                              if ($scope.doc.start && val && val !== prevVal) {
                                  // if (!moment.tz($scope.doc.start,$scope.conference.timezone).isSame(moment.tz($scope.doc.end,$scope.conference.timezone), 'day') && $scope.doc.end) {
                                  //     var t = moment.utc($scope.doc.end);
                                  //     $scope.doc.end = moment.utc($scope.doc.start).startOf('day').add(t.hours(), 'hours').add(t.minutes(), 'minutes').format('YYYY-MM-DD HH:mm');
                                  // }
                                  // if($scope.doc.end && moment.tz($scope.doc.start,$scope.conference.timezone).isSameOrAfter(moment.tz($scope.doc.end,$scope.conference.timezone)) ){
                                  //   var e = moment.utc($scope.doc.start);
                                  //   $scope.doc.end = moment.utc($scope.doc.start).startOf('day').add(e.hours(), 'hours').add(e.minutes()+30, 'minutes').format('YYYY-MM-DD HH:mm');
                                  // }
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

                          getInteractioEVentsMap()
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function hasAgenda(doc){
                          if(!doc.type) return false;
                            var agendaTypes = ['570fd1ac2e3fa5cfa61d90f5','570fd1cb2e3fa5cfa61d90f7','582330845d4c0e8231238ebf','570fd1552e3fa5cfa61d90f0'];

                            if(_.indexOf(agendaTypes,doc.type)>-1)
                              return true;
                            else
                              return false;

                        }
                        $scope.hasAgenda=hasAgenda;



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
                            }).catch(function (response) {
                                console.log(response);
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
                            //$scope.changeTab('details');
                        }; //$scope.editSeries


                        //============================================================
                        //
                        //============================================================
                        function deleteRes() {

                            if (confirm('Are you sure you would like to permanently delete this reservation?')) {
                                var dalObj = _.clone($scope.doc);
                                dalObj.meta={};
                                dalObj.meta.status='deleted';

                                return $scope.save(dalObj).then(function() {
                                    if($scope.doc.sideEvent)
                                      $http.get('https://api.cbd.int/api/v2016/inde-side-events/',{params:{q:{'id':$scope.doc.sideEvent.id},f:{'id':1}}}).then(function(res2){
                                            var params = {};
                                            params.id = res2.data[0]._id;
                                            var update =res2.data[0];
                                            update.meta={};
                                            if (!update.meta.clientOrg) update.meta.clientOrg = 0;
                                            update.meta.status='canceled';
                                            $http.patch('https://api.cbd.int/api/v2016/inde-side-events/'+res2.data[0]._id,update,params);
                                      });
                                });
                            }
                            $scope.closeThisDialog();
                        } //init
                        $scope.deleteRes = deleteRes;

                        //============================================================
                        //
                        //============================================================
                        function initMaterial() {
                            const { timezone }   = $scope.conference
                            const { start, end, startT } = $scope.doc
                            const   format       = 'YYYY-MM-DD HH:mm'

                            $scope.doc.end   = $scope.doc.end? moment.tz(end  , timezone).format(format) : moment.tz($scope.startObj, timezone).add(30, 'minutes').format(format)
                            $scope.doc.start = startT ? moment.tz(start, timezone).format(format) : $scope.startObj.format(format)

                            whenElement('startT', $element)
                            .then(($el) => {
                                                    

                                                    $el.bootstrapMaterialDatePicker({ switchOnClick: true, time: true, date: true, format, clearButton: false, weekStart: 0 })
                                                    $el.bootstrapMaterialDatePicker('setDate', moment.tz($scope.doc.start, timezone));
                                                    // $el.bootstrapMaterialDatePicker('setMinDate', moment.tz($scope.doc.start, timezone));
                                                    // $el.bootstrapMaterialDatePicker('setMaxDate', moment.tz($scope.doc.end, timezone));
                                                    $timeout($($el).trigger('change'), 100);
                                                    $.material.init();
                                                  })
                                                          
                            whenElement('endT', $element)
                              .then(($endTEl) => {

                                                  const setMinDate = moment.tz($scope.doc.start, timezone).add(15, 'minutes')
                  
                                                  $endTEl.bootstrapMaterialDatePicker({ switchOnClick: true, time: true, date: true, format, clearButton: false, weekStart: 0 })
                                                  $endTEl.bootstrapMaterialDatePicker('setDate', moment.tz($scope.doc.end, timezone));
                                                  $endTEl.bootstrapMaterialDatePicker('setMinDate', setMinDate);
                                                  $endTEl.bootstrapMaterialDatePicker('setMaxDate', $scope.conferenceDays[$scope.conferenceDays.length-1]);
                                                  $timeout($($endTEl).trigger('change'), 100);
                                                  $.material.init();
                                                })
                        }

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
                            if(!objClone._id)
                              objClone.end = moment.utc(moment.tz(objClone.end,$scope.conference.timezone)).format();//moment.tz(objClone.end,$scope.conference.timezone);
                            else
                                objClone.end = moment.utc(moment.tz(objClone.end,$scope.conference.timezone)).format();

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

                            delete(docClone.agenda);
                            delete(docClone.message);

                            if(!isNew){
                              var diff= moment(docClone.end).diff(moment(docClone.start),'minutes');

                                docClone.start = moment($scope.doc.series[k].date).format();
                                docClone.end = moment($scope.doc.series[k].date).add(diff, 'minutes').format();
                                docClone._id = retRecId($scope.doc.series[k].date,$scope.recurrenceSeries);

                            }else{
                              docClone.start = moment.tz(docClone.start,$scope.conference.timezone).add(k, 'days').format();
                              docClone.end = moment.tz(docClone.end,$scope.conference.timezone).add(k, 'days').format();
                            }
                            if(docClone.videoUrl)docClone.videoUrl=docClone.videoUrl.trim()
                            
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

                            return (moment.utc(doc.start).startOf('day').isBefore(moment.utc(day).startOf('day')) ||  !moment(day).utc().add(moment(day).utcOffset(),'m').isSame(moment.utc(day).startOf('day')));
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
                        function availableApiCall() {
                          const allPromises = [];
                          const diff        = moment($scope.doc.end).diff(moment($scope.doc.start),'minutes');


                          _.each($scope.doc.series,function(r,index){
                            var end   = moment.utc(moment.tz(r.date,$scope.conference.timezone).add(diff,'minutes')).format();
                            var start = moment.utc(moment.tz(r.date,$scope.conference.timezone)).format();
                            var curRec =_.find($scope.recurrenceSeries,function(j){
                                return moment(j.start).isSame(r.date);
                            });

                            const params = { q : {
                                                    'meta.status'  : { '$ne': 'deleted' },
                                                    'location.room': $scope.doc.location.room,
                                                    $or: [
                                                          { $and :[ { start: { $gte: { $date: start } } }, { start : { $lt : { $date: end } } } ]},
                                                          { $and :[ { end  : { $gte: { $date: start } } }, { end   : { $lt : { $date: end } } } ]},
                                                          { $and :[ { start: { $lt : { $date: start } } }, { end   : { $gte: { $date: end } } } ]}
                                                        ]
                                                },
                                            c : 1
                                          };

                            if(curRec)params.q._id={'$ne':{'$oid':curRec._id}};

                            allPromises.push($http.get('https://api.cbd.int/api/v2016/reservations',{ params}).then(
                                ({ data }) =>{

                                    if(data.count){
                                      $scope.doc.series[index].available=false;
                                      if(!$scope.recurrenceSeries && _.isEmpty($scope.recurrenceSeries))
                                        $scope.doc.series[index].selected=false;
                                    }else
                                      $scope.doc.series[index].available=true;

                              })); // mongoStorage.getReservations

                          });
                        }

                        //============================================================
                        // returns true if it does not exist in series
                        //============================================================
                        function isAvailable(doc) {
                          if(_.has(doc, 'available'))
                            return doc.available;
                          else
                            return -1;
                        }
                        $scope.isAvailable=isAvailable;
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
                            if ($scope.isSideEvent() && obj.sideEvent)  {
                                obj.sideEvent.title = obj.title;
                                obj.sideEvent.description = obj.description;
                            }

                            if(!obj.seriesId && obj.recurrence) obj.seriesId = guid();

                            var objClone = cleanReservation(obj);


                            if(!objClone.start || !objClone.end ) throw "Error missing start or end time or location.";

                            return mongoStorage.save('reservations', objClone).then(function(res) {
                                $timeout(function() {
                                    if (res.data.id) obj._id = res.data.id;

                                    if (objClone.location.room !== $scope.room._id && objClone._id) // if user chose new room reload schedule
                                            $scope.timeUnitRowCtrl.resetSchedule();
                                    else{
                                          $scope.timeUnitRowCtrl.deleteRes(objClone);
                                          $scope.timeUnitRowCtrl.getReservations({'resId':obj._id});
                                    }



                                    if (!moment.utc($scope.day).isSame(moment.utc($scope.doc.start).startOf('day'), 'day')) // if user changes the day change view to that day
                                        $scope.timeUnitRowCtrl.setDay(moment.tz(objClone.end,$scope.conference.timezone).startOf('day'));


                                    saveRecurrences(obj);

                                }, 500).then(function(){

                                });

                                // if(!objClone._id)
                                //   $scope.conference.changeConference();
                                $rootScope.$broadcast("showInfo", "Reservation '" + objClone.title + "' Successfully Updated.");
                                $rootScope.$broadcast('schedule-refresh');
                                $scope.closeThisDialog();
                            }).catch(function(error) {
                                console.log(error);
                                $rootScope.$broadcast("showError", "There was an error saving your Reservation: '" + error.data.message + "' to the server.");
                            });
                        }; //save

                        function copyToClipboard(text) {
                          if (window.clipboardData) { // Internet Explorer
                              window.clipboardData.setData("Text", text);
                          } else {
                            navigator.clipboard.writeText(text);
                          }
                        }

                        $element.ready(init)
                    } //link
            }; //return
        }
    ]);

});