define(['app', 'lodash', 'text!./unscheduled.html', 'moment',
    'directives/date-picker',
    'ngDialog',
    'services/mongo-storage',
    './se-room-row',
    'css!libs/angular-dragula/dist/dragula.css',
], function(app, _, template, moment) {

    app.directive("unscheduled", ['$timeout', '$document', 'mongoStorage','$rootScope','$q','dragulaService',
        function($timeout, $document, mongoStorage,$rootScope,$q,dragulaService) {
            return {
                restrict: 'E',
                template: template,
                replace: true,

                transclude: false,
                require:'unscheduled',
                scope: {
                     'isOpen': '=?',
                     'conference':'='

                },
                link: function($scope, $element,$attr,ctrl) {
                        var hoverArray = [];
                        var cancelDropIdicators;
                        var slotElements ={};
                        init();


                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.drag', function(e, el) {

                          var elModel = _.find($scope.seModels, {
                            '_id': el.attr('res-id')
                          });
                          _.each($scope.rooms,function(room){
                              if (elModel.sideEvent.expNumPart > room.capacity){
                                _.each(slotElements[room._id],function(el){
                                  angular.element(el).addClass('label-danger-light');
                                });
                              }else{
                                _.each(slotElements[room._id],function(el){
                                  angular.element(el).addClass('label-success-light');
                                });
                              }
                          });
                          cancelDropIdicators = $timeout(function(){
                              removeDropIndicators();
                          },10000);
                        });//se-bag.drag

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.cloned', function(e, mirror, shadow) {

                          mirror.children('div.panel.panel-default.se-panel').hide();
                          mirror.children('div.drag-view.text-center').show();
                          shadow.children('div.panel.panel-default.se-panel').hide();
                          shadow.children('div.drag-view.text-center').show();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.canceled', function(e, mirror) {
                          mirror.children('div.panel.panel-default.se-panel').toggle();
                          mirror.children('div.drag-view.text-center').toggle();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.shadow', function(e, el, container, source) {
                          var siblings;
                          el.children('div.panel.panel-default.se-panel').show();
                          el.children('div.drag-view.text-center').hide();
                          if (container[0].id === 'unscheduled-side-events') {
                            siblings = source.find('div.se-dragable-wrapper.grabbible.ng-scope');
                            if (source[0].id !== 'unscheduled-side-events' || el.width() < 200) {
                              el.css('height',164);
                              el.css('width',254);
                            }

                          } else if(source[0].id === 'unscheduled-side-events') {
                            el.children('div.panel.panel-default.se-panel').hide();
                            el.children('div.drag-view.text-center').show();
                             siblings = $element.find('#res-el');
                            if (siblings.length > 0) {
                              el.css('height',siblings.height());
                              el.css('width',siblings.width());
                            } else {
                              el.css('height',16);
                              el.css('width',50);
                            }
                          }//else
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.drop', function(e, el, container, source) {

                          var res;
                          if (source.attr('id') === 'unscheduled-side-events')
                            res = _.find($scope.sideEvents, {
                              '_id': el.attr('res-id')
                            });
                          else
                            res = getBagScope(source)[0];

                          if (!(source.attr('id') === 'unscheduled-side-events' && container.attr('id') === 'unscheduled-side-events'))
                            setTimes(res, container).then(
                              function() {
                                if($scope.searchReq || $scope.preferenceSearch || $scope.searchOrg || $scope.search)
                                initUnscheduledEvents($scope.conference).then(function(){
                                    loadReservations().then(function(){
                                    $scope.searchReq = $scope.preferenceSearch = $scope.searchOrg = $scope.search ='';
                                  });
                                });
                                $rootScope.$broadcast('showInfo', 'Server successfully updated:  Side Event '+res.title+' reservation registered');
                              }
                            ).catch(function(error) {
                              console.log(error);
                              $rootScope.$broadcast("showError", 'There was an error updating the server with '+res.title+', Please try your action again. ');
                            });
                        });


                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.over', function(e, el, target, source) {

                          // keep original shadow on moving unscheduled side events within its own container
                          if (target.attr('id') === 'unscheduled-side-events' && source.attr('id') === 'unscheduled-side-events') {
                            el.children('div.panel.panel-default.se-panel').toggle();
                            el.children('div.drag-view.text-center').toggle();
                            return;
                          }

                          hoverCleanUp();
                          hoverArray.push(target);
                          target.find('span.empty-bag').hide();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.drop-model', function(e, el, target) {

                          removeDropIndicators();
                          target.removeClass('label-success');
                          // show warning toast is drop not good
                          if (target.attr('id') !== 'unscheduled-side-events') {
                            var room = _.find($scope.options.rooms, {
                              '_id': target.attr('room-index')
                            });
                            var elModel = _.find($scope.seModels, {
                              '_id': el.attr('res-id')
                            });

                            if (elModel.sideEvent.expNumPart > room.capacity)
                              $rootScope.$broadcast('showWarning', 'Warning: The expected number of participants (' + elModel.sideEvent.expNumPart + ') excceds room capacity (' + room.capacity + ').');
                          }
                        });
                        //============================================================
                        //
                        //============================================================
                        function init() {
                            $scope.isOpen=true;
                            //  console.log('init unscheduled link');
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function hoverCleanUp() {

                          _.each(hoverArray, function(el) {
                            el.find('span.empty-bag').show();
                            el.removeClass('label-success');
                            el.removeClass('label-danger');
                          });
                        } //

                        //============================================================
                        //
                        //============================================================
                        function getBagScope(container) {

                          if (container.attr('id') === 'unscheduled-side-events')
                            return $scope.sideEvents;
                          else {
                            var room = _.find($scope.options.rooms, {
                              '_id': container.attr('room-index')
                            });
                            if (!room) throw "Error: room id mismatch when finding bag scope.";
                            return room.bookings[container.attr('slot-index')].tiers[container.attr('tier-index')].bag;
                          }
                        }
                        $scope.getBagScope=getBagScope;


                        //============================================================
                        //
                        //============================================================
                        function removeDropIndicators(){

                          $timeout.cancel(cancelDropIdicators);
                          _.each($scope.rooms,function(room){
                                _.each(slotElements[room._id],function(el){
                                    angular.element(el).removeClass('label-danger-light');
                                    angular.element(el).removeClass('label-success-light');
                                });
                          });
                        }// removeDropIndicators

                        //============================================================
                        // Load select with users choices of prefered date times
                        //============================================================
                        function initPreferences() {
                          $scope.options.preferences=[];
                          _.each($scope.days,function(day){
                            _.each(day.tiers,function(tier){
                                $scope.options.preferences.push({'timeValue':tier.title,'dateValue':moment.utc(day.date).format('YYYY/MM/DD'),'title':moment.utc(day.date).format('YYYY-MM-DD')+' '+tier.title,'value':moment(day.date).add(tier.seconds,'seconds').format()});
                            });
                          });
                        }//initPreferences()

                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.searchOrgFilter = function(se) {
                              if (!$scope.searchOrg || $scope.searchOrg == ' ') return true;
                              var temp = JSON.stringify(se.sideEvent.orgs);

                              return (temp.toLowerCase().indexOf($scope.searchOrg.toLowerCase()) >= 0);
                        };
                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.searchReqFilter = function(se) {
                              if (!$scope.searchReq || $scope.searchReq== ' ') return true;

                              var temp = JSON.stringify(se.sideEvent.requirements);
                              if(temp)
                                return (temp.toLowerCase().indexOf($scope.searchReq.toLowerCase()) >= 0);

                              return false;
                        };
                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.searchPrefFilter = function(se) {
                              if (!$scope.preferenceSearch || $scope.preferenceSearch == ' ') return true;
                              $scope.prefObj = _.find($scope.options.preferences,{'value':$scope.preferenceSearch});

                              var match = false;
                              _.each(se.sideEvent.prefDate,function(p,key){
                                    if(p===$scope.prefObj.dateValue  && se.sideEvent.prefDateTime[key].toLowerCase()===$scope.prefObj.timeValue.toLowerCase())
                                      match =  true;
                              });

                              return match;
                        };
                        //============================================================
                        //
                        //
                        //============================================================
                        $scope.clearFilters= function() {
                              $scope.preferenceSearch='';
                              $scope.searchReq='';
                              $scope.searchOrg='';


                        };
                }, //link
                controller: function($scope) {

                        init();
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
                          if (_.isArray($scope.getBagScope(target)) && $scope.getBagScope(target).length !== 0 && target.attr('id') !== 'unscheduled-side-events')
                            return false;
                          else
                            return true;
                        }
                        //============================================================
                        //
                        //============================================================
                        function init() {

                              //console.log('init unscheduled controller');
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function sync () {
                            $scope.syncLoading = 1;
                            mongoStorage.syncSideEvents($scope.conference._id).then(function(res) {
                              $scope.changeMeeting();
                              $rootScope.$broadcast("showInfo",res.data.count+" side events successfully synced for "+ $scope.conference.schedule.title);
                            }).then(function() {
                              $scope.syncLoading = 0;
                            });
                        }//sync
                        this.sync=sync;


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

                        //============================================================
                        //
                        //============================================================
                        function load(meeting) {
                          var allOrgs;
                          $scope.sideEvent=[];
                          return mongoStorage.getUnscheduledSideEvents(meeting).then(function(res) {
                            $scope.sideEvents = res.data;
                          }).then(
                            function() {
                              return mongoStorage.getAllOrgs('inde-orgs', 'published').then(function(orgs) {
                                allOrgs = orgs.data;

                              });

                            }
                          ).then(function() {
                            _.each($scope.sideEvents, function(res) {
                              res.sideEvent.orgs = [];
                              _.each(res.sideEvent.hostOrgs, function(org) {
                                res.sideEvent.orgs.push(_.find(allOrgs, {
                                  '_id': org
                                }));
                              });
                            }); // each
                          }).then(function() {
                            if (!$scope.seModels) $scope.seModels = [];
                            _.each($scope.sideEvents, function(se) {
                              $scope.seModels.push(se);
                            });
                          });
                        } //initMeeting
                        this.load=load;


                }, //link
        };//return
    }]);//directive
});//require