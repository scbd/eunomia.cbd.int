define(['app', 'lodash', 'text!./unscheduled.html', 'moment', 'text!../forms/edit/reservation-view-dialog.html',
'text!../forms/edit/filter-dialog.html',
'text!../forms/edit/config-dialog.html',
    'ngDialog',
    'services/mongo-storage',
    'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css',
    'moment',
    'ngDialog',
    'filters/htmlToPlaintext',
    'ui.select',
    'filters/propsFilter',
    'directives/side-events/side-event'
    
], function(app, _, template,moment,resDialog,filterDialog,configDialog) {

    app.directive("unscheduled", ['$timeout', '$document', 'mongoStorage','$rootScope','$q','dragulaService','$http','$document','ngDialog','whenElement',
        function($timeout, $document, mongoStorage,$rootScope,$q,dragulaService,$http,$document,ngDialog, whenElement) {
            return {
                restrict: 'E',
                template: template,
                replace: true,

                transclude: false,
                require:'unscheduled',

                link: function($scope,$element) {
                        var hoverArray = [];
                        var cancelDropIdicators;
                        // var slotElements ={};

                        $scope.load=load;
                        $scope.tabs={};
                        $scope.tabs.details={};
                        $scope.tabs.other={};
                        $scope.tabs.contact={};
                        $scope.tabs.details.active =true;
                        $scope.searchT=[];
                        $scope.selectedTime='';

                        
                        init();
                        //============================================================
                        //
                        //============================================================
                        function destryTootips(){
                            $('.popover').each(function(i,o){
                              this.remove();
                            });
                        }// removeDropIndicators

                        //============================================================
                        //
                        //============================================================
                        $scope.resDialog = function(res) {
                          res.loadingRes=true;
                          if(res.sideEvent)
                            getRes(res.sideEvent.id).then(function(r){
                              $scope.se=r;
                              loadOrgs($scope.se.hostOrgs).then(function(orgObjs){
                                  $scope.se.hostOrgObjs=orgObjs;
                                  if(r.contact && r.contact.country)
                                  loadCountry(r.contact.country.identifier).then(function(cObj){
                                      $scope.se.countryObj = cObj;
                                      ngDialog.open({
                                          template: resDialog,
                                          className: 'ngdialog-theme-default',
                                          closeByDocument: true,
                                          plain: true,
                                          scope: $scope
                                      });
                                        res.loadingRes=false;

                                  });
                                  else {
                                    ngDialog.open({
                                        template: resDialog,
                                        className: 'ngdialog-theme-default',
                                        closeByDocument: true,
                                        plain: true,
                                        scope: $scope
                                    });
                                      res.loadingRes=false;
                                  }
                                });
                            });
                        }; //$scope.roomDialog


                        function loadDates() {
                          const { timezone, schedule, StartDate, EndDate } = $scope.conference
                          const { sideEvents } = schedule
                          const { sideEventVisibleDays, seTiers } = sideEvents

                          const numDays = moment(EndDate).diff(StartDate,'days');

                            $scope.sideEventTimes=[{title:'All Days',value:'all', selected:true}];

                            for(let i=1; i<=numDays; i++)
                            {
                              const dayOfWeekInt = moment(StartDate).startOf('day').add(i,'days').isoWeekday()

                              if(!sideEventVisibleDays.includes(dayOfWeekInt)) continue
                              
                              for (const { seconds } of seTiers) {
                                const dateTime = moment(StartDate).startOf('day').add(i,'days').add(seconds,'seconds').subtract(1,'hours')
                                const title    = dateTime.format('dddd MMM Do @ HH:mm')
                                const value    = dateTime.format()

                                $scope.sideEventTimes.push({ title, value })
                              }
                            }
                        }

                      //   function savePrefs() {
                      //       localStorage.setItem('prefs', JSON.stringify($scope.prefs));
                      //   }

                      // $scope.savePrefs=savePrefs;

                        //============================================================
                        //
                        //============================================================
                        $scope.configDialog = function() {

                              var dialog = ngDialog.open({
                                  template: configDialog,
                                  className: 'ngdialog-theme-default',
                                  closeByDocument: true,
                                  plain: true,
                                  scope: $scope,
                                  width:700

                              });
                              dialog.closePromise.then(closeCallBack);
                        }; //$scope.filterDialog

                        $scope.filterDialog = function() {
                              $scope.$parent.searchT=[];
                              $scope.selectedTime='';
                              if(!_.isEmpty($scope.sideEvents))
                                load();

                              var dialog = ngDialog.open({
                                  template: filterDialog,
                                  className: 'ngdialog-theme-default',
                                  closeByDocument: true,
                                  plain: true,
                                  scope: $scope,

                              });
                              dialog.closePromise.then(closeCallBack);
                        }; //$scope.filterDialog


                        function closeCallBack(){

                          if(_.isEmpty($scope.sideEvents)){
                            $scope.$parent.searchT=[];
                            $scope.selectedTime='';
                            load();
                          }
                          return true;
                        }


                        function init() {
                            $scope.loadingRes = true
                            $scope.options = {};
                            $scope.loading={};
                            $scope.isOpen=true;
                            $scope.sideEvents=[];
                            initReq();
                            $scope.load($scope.conference._id);
                            // initPreferences();
                            loadDates();
                            // if(localStorage.getItem('prefs') && localStorage.getItem('prefs')!=='undefined')
                            //   $scope.prefs = JSON.parse(localStorage.getItem('prefs'));

                        }



                        function getRes(id) {
                          return $http.get('/api/v2016/inde-side-events/'+encodeURIComponent(id))
                                  .then(({ data }) => data);
                        } 

                        async function loadCountry(code) {
                          if(!code) return true

                          const f      = { history:0, meta:0, treaties:0 }
                          const params = { f }

                          return $http.get('/api/v2015/countries/'+encodeURIComponent(code.toUpperCase()), { params })
                                  .then(({ data }) => data);
                        } //loadOrgs


                        function loadOrgs(orgs) {

                        const f                = {history:0,meta:0};
                        const orgsFormated     = [];
                        const partiesFormated  = [];

                        _.each(orgs,function(o){
                            if(o.length>2)
                              orgsFormated.push({'$oid':o});
                            else
                              partiesFormated.push(o.toUpperCase());
                        });

                        const q ={ '_id': { '$in': orgsFormated } };

                          return mongoStorage.loadDocs('inde-orgs',q, 0,1000000,false,{'acronym':1},f).then(
                              function(responce) {
                                    var params={params:{}};
                                    params.params.q={'code':{'$in':partiesFormated}};

                                    return $http.get('/api/v2015/countries',params).then(function(res){
                                      return responce.data.concat(res.data);
                                    });

                              });

                        } //loadOrgs

                        //============================================================
                        //
                        //============================================================
                        function load(searchT) {


                          $scope.loading.unscheduled=true;
                          // destryTootips();

                          // $timeout(function(){$scope.sideEvents = [];});

                          var f = {subType:1,type:1,'meta.status':1,'sideEvent.id':1,'sideEvent.expNumPart':1};
                          var sort ={'sideEvent.id':-1};
                          var q={
                            'location.conference':$scope.conference._id,
                            '$and':[{'sideEvent':{'$exists':true}},{type:'570fd0a52e3fa5cfa61d90ee'}],
                            'start':null,
                            'meta.status': {
                                $nin: ['archived', 'deleted','draft']
                            }
                          };

                          if(_.isArray(searchT) && !_.isEmpty(searchT)){
                              q.subType={'$in':searchT};
                          }

                          if($scope.selectedTime && $scope.selectedTime!=='all'){

                              var tier;
                              if(Number(moment.tz($scope.selectedTime,$scope.conference.timezone).format('hh'))<18)
                                tier='evening';
                              else
                                tier='lunch';

                              q['$or'] = [{'$and':[{'sideEvent.prefDate.one':moment.tz($scope.selectedTime,$scope.conference.timezone).format('(dddd) YYYY/MM/DD')},{'sideEvent.prefDateTime.one':tier}]},
                                         {'$and':[{'sideEvent.prefDate.two':moment.tz($scope.selectedTime,$scope.conference.timezone).format('(dddd) YYYY/MM/DD')},{'sideEvent.prefDateTime.two':tier}]},
                                         {'$and':[{'sideEvent.prefDate.three':moment.tz($scope.selectedTime,$scope.conference.timezone).format('(dddd) YYYY/MM/DD')},{'sideEvent.prefDateTime.three':tier}]}
                                       ];
                          }
                          if($scope.search){
                            if(Number.isInteger(Number($scope.search)))
                              q['sideEvent.id'] = Number($scope.search);
                            else
                              q['$text'] = {'$search':'"'+$scope.search.trim()+'"'};  // jshint ignore:line
                          }


                          return $q.when($scope.options.typesProm).then(function(){mongoStorage.loadDocs('reservations',q, 0,1000000,false,sort,f).then(
                              function(responce) {
                                    $scope.sideEvents = responce.data;
                                    $timeout(function(){$scope.loading.unscheduled=false;
                                      $scope.options.types=_.clone($scope.options.types);
                                      if($scope.options.types){
                                        $scope.sideEvents.forEach(function(res){

                                              var type  = _.find($scope.options.types,{'_id':res.type});

                                              var subType = _.find(type.children,{'_id':res.subType});

                                              if(type)
                                                res.subTypeObj=subType;

                                              res.loadingRes=false;
                                        });

                                        var blocked =_.find($scope.options.types,{'title':'Blocked'});
                                        var se =_.find($scope.options.types,{'_id':'570fd0a52e3fa5cfa61d90ee'});
                                        if(!blocked) throw "Blocked type not found";
                                        $scope.options.blockedTypes=blocked.children;

                                        if(!blocked) throw "Side-event type not found";
                                        $scope.seTypes = se.children;
                                      }
                                        $scope.loading.unscheduled=false;
                                    },100);

                                    return   $scope.sideEvents;
                              }
                          );});

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
                        $scope.$on('se-bag.over', function(e, el, target,source) {
                          toggleDragFlag (target);

                          if(target.attr('id') ==='unscheduled-side-events' ){
                            
                            whenElement('res-panel', el).then((e)=> { 

                              e.show();
                              whenElement('res-el', el).then(($e)=> { 
                              
                                $e.show(); 
                              })
                            })
                          }

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
                                  if (res.sideEvent && res.sideEvent.expNumPart > room.capacity)
                                    angular.element(el).addClass('label-danger-light');
                                  else
                                    angular.element(el).addClass('label-success-light');
                                });

                          });

                          cancelDropIdicators = $timeout(function(){
                              removeDropIndicators();
                          },10000);
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
                          const { tz } = $scope.conference.timeObjects

                            var q = {};
                            q._id=r._id;

                            var startDate = moment.tz(container.attr('date'),tz); //.format('X')

                            if (container.attr('id') !== 'unscheduled-side-events') {
                              q.start = r.start = startDate.format();
                              if(!container.attr('date')) throw 'Error: date not set in element';
                              if(!container.attr('id')) throw 'Error:  bag id not set in element';
                              if(!container.attr('room')) throw 'Error: room id not set in element';

                              // if(moment(q.start).format('HH')==='13')
                              q.end = r.end =startDate.add(90,'minutes').format();

                              q.location = r.location = {};
                              q.location.venue =r.location.venue= $scope.conference.venueId;
                              q.location.conference =r.location.conference= $scope.conference._id;
                              q.location.room = r.location.room =container.attr('room');

                              return mongoStorage.save('reservations',q).then(function(){
                                if(r.sideEvent)
                                  $rootScope.$broadcast("showInfo"," side events successfully saved for:   "+ r.sideEvent.id);
                                else
                                  $rootScope.$broadcast("showInfo"," Blocked reservation successfully moved");
                                  $scope.load($scope.conference._id);
                                  $http.get('/api/v2016/inde-side-events/',{params:{q:{'id':r.sideEvent.id},f:{'id':1}}}).then(function(res2){
                                        var params = {};
                                        params.id = res2.data[0]._id;
                                        var update =res2.data[0];
                                        update.meta={};
                                        if (!update.meta.clientOrg) update.meta.clientOrg = 0;
                                        update.meta.status='scheduled';
                                        $http.patch('/api/v2016/inde-side-events/'+res2.data[0]._id,update,params);
                                  });
                              }).catch(onError);
                            } else {
                              q.start = null;
                              q.end = null;
                              q.location = r.location = {};
                              q.location.venue =r.location.venue= $scope.conference.venueId;
                              q.location.conference =r.location.conference= $scope.conference._id;
                              q.location.room = r.location.room ='unscheduled';
                              return mongoStorage.save('reservations',q).then(function(){
                                  if(r.sideEvent)
                                    $rootScope.$broadcast("showInfo"," side events successfully saved for:  "+ r.sideEvent.id);
                                  else
                                    $rootScope.$broadcast("showInfo"," Blocked side-event tier successfully unscheduled");
                                  $scope.sideEvents=[];
                                  $scope.load($scope.conference._id);
                                  $http.get('/api/v2016/inde-side-events/',{params:{q:{'id':r.sideEvent.id},f:{'id':1}}}).then(function(res2){
                                        var params = {};
                                        params.id = res2.data[0]._id;
                                        var update =res2.data[0];
                                        update.meta={};
                                        if (!update.meta.clientOrg) update.meta.clientOrg = 0;
                                        update.meta.status='published';
                                        $http.patch('/api/v2016/inde-side-events/'+res2.data[0]._id,update,params);
                                  });
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
                          var toId  = container.attr('id');
                          var fromId  = source.attr('id');
                          var resId = el.attr('res-id');


                          toggleDragFlag(source);
                          if(fromId === toId) return; //no api call for drop from source to source

                          if (toId === 'unscheduled-side-events')
                            res = _.find($scope.sideEvents, {
                              '_id': resId
                            });
                          else
                            res = $scope.bagScopes[toId][0];

                          if(res)
                            res.visible=true;

                          if(!res) throw "Error: reservation _id lost";
                          setTimes(res, container);

                          removeDropIndicators();

                        });


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
                        $scope.clearFilters= function() {
                              // $scope.preferenceSearch='';
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
                          accepts: sEBagAccepts,
                          mirrorContainer: $document.body,
                          revertOnSpill:true
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
