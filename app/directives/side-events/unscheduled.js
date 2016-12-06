define(['app', 'lodash', 'text!./unscheduled.html', 'moment',
    'directives/date-picker',
    'ngDialog',
    'services/mongo-storage',
    './se-room-row',
    'css!libs/angular-dragula/dist/dragula.css',
    'moment'
], function(app, _, template,moment) {

    app.directive("unscheduled", ['$timeout', '$document', 'mongoStorage','$rootScope','$q','dragulaService','$http',
        function($timeout, $document, mongoStorage,$rootScope,$q,dragulaService,$http) {
            return {
                restrict: 'E',
                template: template,
                replace: true,

                transclude: false,
                require:'unscheduled',

                link: function($scope) {
                        var hoverArray = [];
                        var cancelDropIdicators;
                        // var slotElements ={};

                        $scope.load=load;
                        init();

                        //============================================================
                        //
                        //============================================================
                        function init() {
                            $scope.options = {};
                            $scope.isOpen=true;
                            $scope.sideEvents=[];
                            initReq();
                            $scope.load($scope.conference._id);
                            initPreferences();
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function initPreferences() {
                          $timeout(function(){$scope.preferences=[];
                              _.each($scope.rooms,function(room,i){
                                if(i===0)
                                _.each(room.timeIntervals,function(tier){
                                    $scope.preferences.push({'dateValue':moment(tier.dayTier).format('YYYY/MM/DD HH:mm'),'title':moment(tier.dayTier).format('YYYY/MM/DD HH:mm'),'value':moment(tier.dayTier).format('YYYY/MM/DD HH:mm')});
                                });
                              });
                          },500);
                        }//initPreferences()

                        //============================================================
                        // Load select with users choices of prefered date times
                        //============================================================
                        function load(meeting) {
                          var allOrgs;
                          $scope.sideEvent=[];
                          return mongoStorage.getUnscheduledSideEvents(meeting).then(function(res) {
                            injectUserData(res.data);
                          //  injectContactData(res.data);
                            return mongoStorage.loadOrgs(true).then(function(orgs) {
                              allOrgs = orgs;
                            }).then(function(){
                              _.each(res.data, function(res) {
                                res.sideEvent.orgs = [];
                                _.each(res.sideEvent.hostOrgs, function(org) {
                                  res.sideEvent.orgs.push(_.find(allOrgs, {
                                    '_id': org
                                  }));
                                });
                              }); // each

                              $scope.sideEvents = res.data;

                              $scope.bagScopes['unscheduled-side-events']=$scope.sideEvents;
                              if (!$scope.seModels) $scope.seModels = [];
                              _.each($scope.sideEvents, function(se) {
                                se.visible=true;
                                $scope.seModels.push(se);
                              });
                            });

                          });
                        } //initMeeting
                        $scope.load=load;

                        //=======================================================================
                        // import created by and modified by adta for admins
                        //=======================================================================
                        function injectUserData(docs) {

                            if(!$scope.users) $scope.users=[];
                             _.each(docs, function(doc) {
                                  $scope.users.push(doc.sideEvent.meta.createdBy);
                                  $scope.users.push(doc.sideEvent.meta.modifiedBy);
                            });

                            $scope.users=_.uniq($scope.users);

                            if(!_.isEmpty($scope.users))
                            return $http.get('/api/v2013/userinfos?query='+JSON.stringify({userIDs:$scope.users})).then(function(res){
                                _.each(docs, function(doc) {
                                     if(!_.find(res.data,{userID:doc.sideEvent.meta.createdBy})) throw 'User not found : '+doc.sideEvent.meta.createdBy;
                                     doc.sideEvent.meta.createdByObj=_.find(res.data,{userID:doc.sideEvent.meta.createdBy});

                                     if(!_.find(res.data,{userID:doc.sideEvent.meta.modifiedBy})) throw 'User not found : '+doc.sideEvent.meta.modifiedBy;
                                     doc.sideEvent.meta.modifiedByObj=_.find(res.data,{userID:doc.sideEvent.meta.modifiedBy});
                               });
                            });

                        } //importUserData

                        //============================================================
                        //
                        //============================================================
                        function initReq() {
                          $scope.options.requirements = [
                            {
                              title: 'Clear Filter',
                              value: 'clear'
                            },{
                            title: 'interpretation',
                            value: 'interpretation'
                          }, {
                            title: 'catering',
                            value: 'catering'
                          }, {
                            title: 'overhead',
                            value: 'overhead'
                          }, {
                            title: 'pc',
                            value: 'pc'
                          }, {
                            title: 'sound',
                            value: 'sound'
                          }, {
                            title: 'lcd',
                            value: 'lcd'
                          }, {
                            title: 'skype',
                            value: 'skype'
                          }, ];
                        } //initMeeting


                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.canceled', function(e, target, source) {
                            toggleDragFlag (source);
                            removeDropIndicators();
                        });


                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.out', function(e, target) {
                            toggleDragFlag (target);
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.over', function(e, el, target) {
                          toggleDragFlag (target);
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.drag', function(e, el, source) {
                          toggleDragFlag (source);// hack to stop row flicker

                          var fromId  = source.attr('id');
                          var resId = el.attr('res-id');
                          var res;

                          if (fromId === 'unscheduled-side-events'){
                            res = _.find($scope.sideEvents, {'_id': resId.trim()});
                          }
                          else
                            res = $scope.bagScopes[fromId][0];


                          _.each($scope.rooms,function(room){
                                _.each($scope.slotElements[room._id],function(el){
                                  if (res.sideEvent.expNumPart > room.capacity)
                                    angular.element(el).addClass('label-danger-light');
                                  else
                                    angular.element(el).addClass('label-success-light');
                                });

                          });

                          cancelDropIdicators = $timeout(function(){
                              removeDropIndicators();
                          },10000);
                        });//se-bag.drag

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.cloned', function(e, mirror) {
                          mirror.find('#res-title').hide();
                        });

                        //============================================================
                        //
                        //============================================================
                        function toggleDragFlag (source){
                          var r =_.find($scope.rooms,{'_id':source.attr('room')});
                          if(!r) return;
                          var cell = _.find(r.timeIntervals,{'id':source.attr('id')});
                          $timeout(function(){cell.drag=!cell.drag;});

                        }

                        //============================================================
                        //
                        //============================================================
                        function setTimes(r, container) {
                            var q = {};
                            q._id=r._id;
                            if(!container.attr('date')) throw 'Error: date not set in element';
                            if(!container.attr('id')) throw 'Error:  bag id not set in element';
                            if(!container.attr('room')) throw 'Error: room id not set in element';


                            var startDate = moment.tz(container.attr('date'),$scope.conference.timezone); //.format('X')
                            if (container.attr('id') !== 'unscheduled-side-events') {
                              q.start = r.start = startDate.format();

                              if(moment(q.start).format('HH')==='13')
                                  q.end = r.end =startDate.add(89,'minutes').add(59,'seconds').format();
                              else if(moment(q.start).format('HH')==='18')
                                  q.end = r.end =startDate.add(74,'minutes').add(59,'seconds').format();
                              q.location = r.location = {};
                              q.location.venue =r.location.venue= $scope.conference.venueId;
                              q.location.conference =r.location.conference= $scope.conference._id;
                              q.location.room = r.location.room =container.attr('room');
                              q.meta={};
                              q.meta.status= r.meta.status;
                              return mongoStorage.save('reservations',q).then(function(){
                                  $rootScope.$broadcast("showInfo"," side events successfully saved for:   "+ r.title);
                              }).catch(onError);
                            } else {
                              q.start = null;
                              q.end = null;
                              q.location = r.location = {};
                              q.location.venue =r.location.venue= $scope.conference.venueId;
                              q.location.conference =r.location.conference= $scope.conference._id;
                              q.location.room = r.location.room =container.attr('room');
                              return mongoStorage.save('reservations',q).then(function(){
                                  $rootScope.$broadcast("showInfo"," side events successfully saved for:  "+ r.title);
                              }).catch(onError);
                            }
                        }

                        //============================================================
                        //
                        //============================================================
                          function onError(error){
                            console.log(error);
                            $rootScope.$broadcast("showError", "There was an error saving this side event.");
                          }

                          //============================================================
                          //
                          //============================================================
                        $scope.$on('se-bag.drop-model', function(e, el, container,source) {
                          var res;
                          //var fromId= source.attr('id');
                          var toId  = container.attr('id');
                          var resId = el.attr('res-id');

                          toggleDragFlag(source);

                          if (toId === 'unscheduled-side-events')
                            res = _.find($scope.sideEvents, {
                              '_id': resId
                            });
                          else
                            res = $scope.bagScopes[toId][0];

                          if(res)
                            res.visible=true;
                          setTimes(res, container);
                          removeDropIndicators();

                        });


                      //============================================================
                      //
                      //============================================================
                      function removeDropIndicators(){

                          _.each($scope.rooms,function(room){
                                _.each($scope.slotElements[room._id],function(el){
                                  angular.element(el).removeClass('label-danger-light');
                                  angular.element(el).removeClass('label-success-light');
                                });

                          });
                      }// removeDropIndicators


                        //============================================================
                        //
                        //============================================================
                        function getBagScope(container) {

                          if (container.attr('id') === 'unscheduled-side-events')
                            return $scope.sideEvents;
                          else {
                            var room = _.find($scope.rooms, {
                              '_id': container.attr('room')
                            });
                            if (!room) throw "Error: room id mismatch when finding bag scope.";

                            return room.timeIntervals[container.attr('id')].bag;
                          }
                        }
                        $scope.getBagScope=getBagScope;


                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.searchOrgFilter = function(s) {
                              if (!s || s === ' ') {
                                    _.each($scope.sideEvents,function(sideE){
                                            sideE.visible=true;
                                    });
                                    return true;
                              }
                              _.each($scope.sideEvents,function(sideE){
                                console.log(sideE);
                                    var temp = JSON.stringify(sideE.sideEvent.orgs);
                                    if(temp && temp.toLowerCase().indexOf(s.toLowerCase()) < 0 && sideE.visible)
                                      sideE.visible=false;
                              });
                        };


                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.searchReqFilter = function(s) {
                              if(s==='clear'){
                                $scope.clearFilters();
                              }
                              searchSe(s);
                        };


                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.searchPrefFilter = function(s) {

                          if (!$scope.preferenceSearch || $scope.preferenceSearch == ' ') return true;

                          var tierTime='';
                          if(moment(s,'YYYY/MM/DD HH:mm').format('HH:mm')==='13:15') tierTime='lunch';
                          if(moment(s,'YYYY/MM/DD HH:mm').format('HH:mm')==='18:15') tierTime='evening';

                          _.each($scope.sideEvents,function(se){
                              _.each(se.sideEvent.prefDate,function(p,key){
                                    if(p.indexOf(s.substring(0,10))<0  && se.sideEvent.prefDateTime[key].toLowerCase()!==tierTime)
                                      se.visible=false;
                              });
                            });
                        };


                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.clearFilters= function() {
                              $scope.preferenceSearch='';
                              $scope.searchReq='';
                              $scope.searchOrg='';
                              $scope.search='';
                              $timeout(function(){
                                  _.each($scope.sideEvents,function(sideE){
                                          sideE.visible=true;
                                  });
                              });
                        };

                        //============================================================
                        //
                        //============================================================
                        function sync () {
                            $scope.syncLoading = true;
                            mongoStorage.syncSideEvents($scope.conference._id).then(function(res) {
                              $rootScope.$broadcast("showInfo",res.data.count+" side events successfully synced for "+ $scope.conference.schedule.title);
                            }).then(function() {
                              load();
                              $scope.syncLoading = false;
                            });
                        }//sync
                        $scope.sync=sync;


                        //============================================================
                        //
                        //============================================================
                        function sideEventsVisible () {
                            var count = 0;
                            _.each($scope.sideEvents,function(se){
                               if(se.visible) count++;
                            });
                            return count;
                        }//sync
                        $scope.sideEventsVisible=sideEventsVisible;


                        //============================================================
                        //
                        //============================================================
                         function searchSe (s) {

                              if (!s || s === ' ') {
                                return true;
                              }
                              _.each($scope.sideEvents,function(sideE){
                                    var temp = JSON.stringify(sideE);
                                    if(temp && temp.toLowerCase().indexOf(s.toLowerCase()) < 0 && sideE.visible)
                                      sideE.visible=false;
                              });

                        } //ssearchSe
                        $scope.searchSee=searchSe;
                }, //link
                controller: function($scope) {


                        //============================================================
                        //
                        //============================================================
                        dragulaService.options($scope, 'se-bag', {
                          mirrorAnchor: 'top',
                          accepts: sEBagAccepts
                        });

                        //============================================================
                        //
                        //============================================================
                        function sEBagAccepts(el, target) {

                          target = angular.element(target);

                          if (_.isArray($scope.bagScopes[target.attr('id')]) && $scope.bagScopes[target.attr('id')].length !== 0 && target.attr('id') !== 'unscheduled-side-events')
                            return false;
                          else
                            return true;
                        }

                        //============================================================
                        //
                        //============================================================
                         function searchReservations (res) {
                              if (!$scope.searchRes || $scope.searchsearchRes == ' ') {
                                res.searchFound=false;
                                return true;
                              }
                              var temp = JSON.stringify(res);
                              if(temp.toLowerCase().indexOf($scope.searchRes.toLowerCase()) >= 0){
                                res.searchFound=true;
                                return true;
                              }else{
                                res.searchFound=false;
                                return true;
                              }
                        } //searchReservations
                        this.searchReservations=searchReservations;


                }, //link
        };//return
    }]);//directive
});//require