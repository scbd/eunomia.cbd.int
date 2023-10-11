define(['app', 'lodash',
    'text!./reservation.html',
    'moment',
    'data/languages',
    '../../color-picker',
    'directives/color-picker',
    'directives/agenda-select',
    'directives/forms/edit/disable-auto-trim'
], function(app, _, template, moment, languages) {

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
                        $scope.youtube         = { live : false, event : {}, languages : {} }
                        $scope.linksTemplates = [];

                        //============================================================
                        //
                        //============================================================
                        async function loadInteractioEventsMap(){
                          const q = { $or: [
                            { conferenceId: { $oid: $scope.conference._id } },
                            { conferenceId: { $exists: false } },
                          ]};
                          const s = { 'title': 1 };
                          const { data } = await $http.get('/api/v2022/interactio-events-map', { cache:true, params: { q, s } })
                          const interactioEventsMap = sortInteractioEvent(data);

                          $scope.$apply(()=>{
                            $scope.interactioEventsMap = interactioEventsMap
                            updateLinksTemplates();
                          });
                        };

                        //============================================================
                        //
                        //============================================================
                        function sortInteractioEvent(interactioEvents) {

                          const res               = $scope.doc;
                          const roomId            = res?.location?.room;
                          const reservationTypeId = res?.type;
                          const sideEventId       = res?.sideEvent?.id;
                          const interactioEventId = $scope.rooms.find(o=>o._id == roomId)?.interactioEventId;
                          const eventIds          = Object.keys(res?.agenda?.meetings || {});
                          const agendaItems       = (res?.agenda?.items || []).reduce((r,v)=>{
                            r[v.meeting] = r[v.meeting] || [];
                            r[v.meeting].push(v.item)
                            return r;
                          }, {});

                          interactioEvents = _.sortBy(interactioEvents, (o) => {
                            let score = 0;

                            if(o.reservationTypeId && o.reservationTypeId == reservationTypeId) score+=5;
                            if(o.roomId            && o.roomId            == roomId)            score+=5;
                            if(o.sideEventId       && o.sideEventId       == sideEventId)       score+=20;
                            if(o.interactioEventId && o.interactioEventId == interactioEventId) score+=20;
                            if(o.endTime           && new Date(o.endTime)  <  new Date())       score-=100
                            if(o.eventIds) {
                              o.eventIds.forEach(eventId=>{
                                if(eventIds.includes(eventId)) score++;
                              });
                            }
                            if(o.agendaItems) {
                              const keys = Object.keys(o.agendaItems);
                              keys.forEach(key=>{
                                const resItems =   agendaItems[key] || [];
                                const ievItems = o.agendaItems[key] || [];
                                score += _.intersection(resItems, ievItems).length;
                              });
                            }

                            o.score = score;

                            return `${1000-score}_${o.title}`
                                   .replace(/\d+/g, t=> `${t}`.padStart(6, '0'))
                                   .replace(/#/g,   t=> 'z')
                                   .toLocaleLowerCase()
                          });

                          return interactioEvents;
                        }

                        $scope.getInteractioEventGrouping = function(event){

                          const bestScore = $scope.interactioEventsMap[0].score;

                          if(event.score && event.score == bestScore) return 'Best match(es)';
                          if(event.score > 0)                         return 'Good match(es)';

                          return 'Other(s)';
                        };

                        $scope.getInteractioEventTitle = function(event){

                          const { title, interactioEventId, score } = event;
                          const expired = score<0;
                          
                          let newTitle = `${expired ? '* EXPIRED * ' : ''} ${title} - (${interactioEventId})`

                          if(score>0) newTitle += `(score: ${score})`;

                          return newTitle;
                        };

                        $scope.$watch('doc.interactioEventId', updateLinksTemplates);

                        function updateLinksTemplates(){
                          const id = $scope.doc.interactioEventId;
                          
                          const linksTemplates =  (($scope.interactioEventsMap||[]).find(({ interactioEventId }) => (interactioEventId === id))||{}).linksTemplates || []

                          $scope.linksTemplates =  [
                            { value: undefined, title: "please select..."},
                            { value: null,      title: "NO CONNECT BUTTON or PRIVATE"},
                            ...linksTemplates.map(value => ({ value, title: _.startCase(value)}))
                          ];

                          if($scope.doc.linksTemplate===undefined && linksTemplates.length==1)
                            $scope.doc.linksTemplate = linksTemplates[0]

                          if($scope.doc.linksTemplate && !linksTemplates.includes($scope.doc.linksTemplate)) {
                            $scope.doc.linksTemplate = linksTemplates.length==1 ? linksTemplates[0] : undefined;
                          }

                          checkDoubleIntercatioBooking();
                        }

                        function checkDoubleIntercatioBooking(){

                          $scope.interactioDoubleBooking = null;
                          const { interactioEventId, start, end, _id } = $scope.doc;

                          if(!interactioEventId) return;

                          const q = {
                            interactioEventId,
                            'meta.status'  : { $ne: 'deleted' },
                            "end" :   { $gt: { $date : moment(start).toDate() }},
                            "start" : { $lt: { $date : moment(end).toDate() }}
                          };

                          if(_id) q._id = {$ne : { $oid: _id }}

                          $http.get('/api/v2016/reservations', { params : { q } }).then(({ data })=>{
                            $scope.interactioDoubleBooking = data[0];
                          })

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

                          

                            $scope.options = { 
                              languages: {...languages },
                              youtubeEvents : $scope.conference?.conference?.youtubeEvents
                            };
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
                                            $scope.doc.series[k] = {date:moment($scope.doc.start).format(),selected:false};
                                          else{
                                            $scope.doc.series[k] = isBefore  ? {date:moment(day).add(countDays,'days').format(),selected:false} : {date:moment($scope.doc.start).add(countDays,'days').format(),selected:false};

                                          }
                                      });
                                  }
                                  if(!_.isEmpty($scope.doc.youtube)){
                                    $scope.youtube = $scope.doc.youtube;
                                    if($scope.youtube?.event)
                                      $scope.youtube.selectedEvent = $scope.youtube?.event.event
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
                                            $scope.doc.series[k] = {date:moment($scope.doc.start).format(),selected:false};
                                          else{
                                            $scope.doc.series[k] = isBefore  ? {date:moment(day).add(countDays,'days').format(),selected:false} : {date:moment($scope.doc.start).add(countDays,'days').format(),selected:false};

                                          }
                                      });
                                  }

                              }
                          });

                        } //init

                        $scope.$watch('tabs.interactio.active', function(visible){
                          if(visible) loadInteractioEventsMap()
                        })

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
                                var dalObj = _.clone( $scope.doc);
                                dalObj.meta={};
                                dalObj.meta.status='deleted';

                                return $scope.save(dalObj).then(function() {
                                    if($scope.doc.sideEvent)
                                      $http.get('/api/v2016/inde-side-events/',{params:{q:{'id':$scope.doc.sideEvent.id},f:{'id':1}}}).then(function(res2){
                                            var params = {};
                                            params.id = res2.data[0]._id;
                                            var update =res2.data[0];
                                            update.meta={};
                                            if (!update.meta.clientOrg) update.meta.clientOrg = 0;
                                            update.meta.status='canceled';
                                            $http.patch('/api/v2016/inde-side-events/'+res2.data[0]._id,update,params);
                                      });
                                });
                            }
                            $scope.closeThisDialog();
                        } 
                        $scope.deleteRes = deleteRes;

                        async function deleteSeries() {

                            if (confirm('Are you sure you would like to permanently delete all reservations in series?')) {
                                const status = 'deleted'
                                const meta   = { status }
                                const res           = { _id: $scope.doc._id, meta }
                                const recurrences    = $scope.doc.series.filter(({ _id }) => _id) 

                                for (const rec of recurrences) {
                                    const _id    = rec._id

                                    await mongoStorage.save('reservations', { _id, meta })
                                }
                            }
                            $rootScope.$broadcast('schedule-refresh');
                            $scope.closeThisDialog();
                        } 
                        $scope.deleteSeries = deleteSeries;

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
                                                    $timeout($($el).trigger('change'), 100);
                                                    $.material.init();
                                                  })
                            whenElement('endT', $element)
                            .then(($endTEl) => {
  
                                                const setMinDate = moment.tz($scope.doc.start, timezone).add(15, 'minutes')
                
                                                $endTEl.bootstrapMaterialDatePicker({ switchOnClick: true, time: true, date: true, format, clearButton: false, weekStart: 0 })
                                                $endTEl.bootstrapMaterialDatePicker('setDate', moment.tz($scope.doc.end, timezone));
                                                
                                                $endTEl.bootstrapMaterialDatePicker('setMaxDate', $scope.conferenceDays[$scope.conferenceDays.length-1]);
                                                setMinEndDate()
                                                $.material.init();
                                              })
                        }

                        function setMinEndDate(){
                          whenElement('endT', $element)
                            .then(($endTEl) => {
                          const { timezone }   = $scope.conference
                          const setMinDate     = moment.tz($scope.doc.start, timezone).add(15, 'minutes')

                          $endTEl.bootstrapMaterialDatePicker('setMinDate', setMinDate);

                          $timeout($($endTEl).trigger('change'), 100);
                            })
                        }
                        $scope.setMinEndDate = setMinEndDate

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
                                        }
                                        // else if(!v.selected && !isNewReservationInSeries(v.date) ){
                                        //     deleteRec(v.date);
                                        // }

                                    });
                                }
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
                                            // c : 1
                                          };

                            if(curRec)params.q._id={'$ne':{'$oid':curRec._id}};

                            allPromises.push($http.get('/api/v2016/reservations',{ params}).then(
                                ({ data }) =>{

                                    if(data.length){
                                      $scope.doc.series[index].available=false;
                                      if($scope.doc.seriesId === data[0].seriesId)
                                        $scope.doc.series[index]._id = data[0]._id
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

                            if($scope.youtube?.live){

                              objClone.youtube = objClone.youtube || {};
                              objClone.youtube.live = $scope.youtube?.live;
                              objClone.youtube.languages = $scope.youtube?.languages;

                              if($scope.youtube?.selectedEvent)
                                objClone.youtube.event = $scope.options.youtubeEvents.find(e=>e.event == $scope.youtube.selectedEvent);
                              else 
                                objClone.youtube.event = undefined;
                            }
                            else{
                              objClone.youtube = {};
                            }

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

                        $scope.onYoutubeLiveChange = function(youtubeLive){
                        
                            $scope.doc.youtube = undefined;
                            $scope.youtube.selectedEvent = undefined;
                        }

                        $element.ready(init)
                    } //link
            }; //return
        }
    ]);

});