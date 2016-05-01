define(['app', 'lodash', 'moment',
  'text!directives/forms/edit/room-dialog.html',
  'directives/date-picker',
  'css!libs/angular-dragula/dist/dragula.css',
  'services/mongo-storage',
  'directives/forms/edit/room',
  'directives/grid-reservation-se',
  'ngDialog',
  'directives/side-event'
], function(app, _, moment, roomDialog, resDialog) {

  app.controller("events", ['$scope', '$element',  '$document', 'dragulaService', 'mongoStorage', '$timeout', '$rootScope', 'ngDialog',
    function($scope, $element, $document, dragulaService, mongoStorage, $timeout, $rootScope, ngDialog) {

      var hoverArray = [];
      var slotElements ={};
      var cancelDropIdicators;
      $scope.sideEvents = [];
      $scope.days = [];
      $scope.meeting = 0;
      $scope.search = '';
      $scope.rooms={};
      $scope.syncLoading = 0;
      $scope.resizeDone=0;
      $scope.rowMinHeight=0;
      init();



      //============================================================
      //
      //============================================================
      function init() {
        $scope.options = {};

        initReq(); //load requirements
        initMeeting().then(function() { // load meetings
          generateDays();               // generate the days from meeting
            loadRooms().then(function(){
              initUnscheduledEvents($scope.meeting).then(function(){ // loads UnscheduleSideEvents
                  loadReservations().then(function(){ // scheduled events
                        resize();                     //resize grid, maximize view
                        initPreferences();
                  });
              });
            });
        });
      } //init

      //============================================================
      //
      //============================================================
      function initReq() {
        $scope.options.requirements = [{
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
      $scope.changeMeeting = function() {
        generateDays();
        loadRooms().then(function() {
            initUnscheduledEvents($scope.meeting);
        }).then(function() {
            loadReservations().then(function(){
                $scope.rowMinHeight=0;
                resize();
                initPreferences();
            });
        });
      }; //init

      //============================================================
      //
      //============================================================
      $scope.searchReservations = function(res) {
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
      }; //searchReservations

      //============================================================
      //
      //============================================================
      function resize(){
        $timeout(function(){
          _.each($scope.options.rooms,function(room) {
                var roomEl = $element.find('#'+room._id);
                slotElements[room._id]=[];
                roomEl.children().children().children().children().each(function(){
                    slotElements[room._id].push($(this));
                });
            });

        },100).then(function(){
            var roomHolder =$element.find('#room-holder');
            var seScroll = $element.find('div.se-scroll');
            var yLabels = $element.find('div.ng-binding.ng-scope');
            var numSlot =0;
            seScroll.css('height',roomHolder.height()-120);
            $scope.resized=0;
            var cancelHeight = setInterval(function(){
              if(!_.isEmpty(slotElements)){
                    _.each($scope.rooms,function(room,key){
                        if(!numSlot)
                            numSlot = room.bookings.length*room.bookings[0].tiers.length;
                        _.each(slotElements[key],function(slot){
                          if(slot.height()<(roomHolder.height()-47-(numSlot*3))/numSlot)
                              slot.css('height',(roomHolder.height()-47-(numSlot*3))/numSlot);
                        });
                    });
                    yLabels.each(function(){
                        $(this).css('height',(roomHolder.height()-47-(numSlot*3))/numSlot);
                    });
                    clearInterval(cancelHeight);
                    var roomWidth,numRooms=0,roomEl;
                    _.each($scope.options.rooms,function(room) {
                          if(!room.seHidden)
                            numRooms++;
                    });
                  _.each($scope.options.rooms,function(room) {
                          roomWidth = roomHolder.width()/numRooms;
                          if(roomWidth>100){
                            roomEl=$element.find('#'+room._id).css('max-width',roomWidth);
                             roomEl.children().children().children().children().find('grid-reservation-se').css('width',roomWidth);
                          }
                  });
                  $scope.resized=1;
              }
            },500);

              var cancelMinHeight = setInterval(function(){
                var labelEl = $element.find('div.tier-label.ng-binding.ng-scope');
                if($scope.resized && labelEl.height()){
                  clearInterval(cancelMinHeight);

                  if(labelEl.height())
                    $scope.rowMinHeight=labelEl.height();
                  $scope.resized=0;
                }
            },1000);
        });
      }

      //============================================================
      //
      //============================================================
      $scope.sync = function() {
        $scope.syncLoading = 1;
        var meeting=_.find($scope.options.conferences ,{'_id':$scope.meeting});
        mongoStorage.syncSideEvents($scope.meeting).then(function(res) {
          $scope.changeMeeting();
          $rootScope.$broadcast("showInfo",res.data.count+" side events successfully synced for "+ meeting.acronym);
        }).then(function() {
          $scope.syncLoading = 0;
        });
      };

      //============================================================
      //
      //============================================================
      function dateChangeEffect(id) {
        $element.find('#' + id).parent().addClass('is-focused');

        $timeout(function() {
          $element.find('#' + id).parent().removeClass('is-focused');
        }, 2000);
      } //init

      //============================================================
      //
      //============================================================
      $scope.dateChange = function(id) {
        var dayTS;
        var startDatTS = moment.utc($scope.startDate).format('X');
        var endDatTS = moment.utc($scope.endDate).format('X');

        if (id === 'start-filter') {
          _.each($scope.days, function(day, key) {
            dayTS = moment.utc(day.date).format('X');
            if (dayTS < startDatTS) {
              day.selected = false;
              _.each($scope.options.rooms, function(room) {
                room.bookings[key].selected = false;
              });
            } else {
              day.selected = true;
              _.each($scope.options.rooms, function(room) {
                room.bookings[key].selected = true;
              });
            }
          });
        }
        if (id === 'end-filter') {
        //  $element.find('#start-filter').bootstrapMaterialDatePicker('setMaxDate', $scope.endDate);
          _.each($scope.days, function(day, key) {
            dayTS = moment.utc(day.date).format('X');
            if (dayTS > endDatTS || dayTS < startDatTS) {
              day.selected = false;
              _.each($scope.options.rooms, function(room) {
                room.bookings[key].selected = false;
              });
            } else {
              day.selected = true;
              _.each($scope.options.rooms, function(room) {
                room.bookings[key].selected = true;
              });
            }
          });
        }
        //dateChangeEffect(id);
      }; //init

      //============================================================
      //
      //============================================================
      function initUnscheduledEvents(meeting) {
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
              res.sideEvent.orgs.push(_.findWhere(allOrgs, {
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

      //============================================================
      //
      //============================================================
      function initMeeting() {
        return mongoStorage.getConferences().then(function(confs) {
          $scope.options.conferences = confs.data;
          var lowestEnd = Math.round(new Date().getTime() / 1000);
          var chosenEnd = 0;
          var selectedKey = 0;
          _.each($scope.options.conferences, function(meet, key) {
            if (!chosenEnd) chosenEnd = meet.end;
            if (meet.end > lowestEnd && meet.end <= chosenEnd) {
              chosenEnd = meet.end;
              selectedKey = key;
            }
          });
          $scope.options.conferences[selectedKey].selected = true;
          $scope.meeting = $scope.meeting || $scope.options.conferences[selectedKey]._id;
        //  $timeout(function(){$scope.meeting = $scope.meeting || $scope.options.conferences[selectedKey]._id;});

        });
      } //initMeeting

      //============================================================
      //
      //============================================================
      function getBagScope(container) {

        if (container.attr('id') === 'unscheduled-side-events')
          return $scope.sideEvents;
        else {
          var room = _.findWhere($scope.options.rooms, {
            '_id': container.attr('room-index')
          });
          if (!room) throw "Error: room id mismatch when finding bag scope.";
          return room.bookings[container.attr('slot-index')].tiers[container.attr('tier-index')].bag;

          //return bagScope;
        }
      }

      //============================================================
      //
      //============================================================
      function loadReservations() {

        var meeting = _.findWhere($scope.options.conferences, {
          _id: $scope.meeting
        });
        var time, tier, allOrgs;
        $scope.venue = meeting.venue;
        return mongoStorage.getReservations(meeting.start, meeting.end, {venue:meeting.venue},"570fd0a52e3fa5cfa61d90ee").then(function(res) {
            $scope.reservations = res.data;
            //set ref to models
            if (!$scope.seModels) $scope.seModels = [];
            _.each($scope.reservations, function(res) {
              $scope.seModels.push(res);
            });
          })
          .then( // preload orgs not one by one
            function() {
              return mongoStorage.getAllOrgs('inde-orgs', 'published').then(function(orgs) {
                allOrgs = orgs.data;
              });
            }
          ).then(function() { // initialive each SE's orgs
            _.each($scope.reservations, function(res) {
              if (!res.sideEvent) throw 'side vent data not loaded for res';
              res.sideEvent.orgs = [];
              _.each(res.sideEvent.hostOrgs, function(org) {
                res.sideEvent.orgs.push(_.findWhere(allOrgs, {
                  '_id': org
                }));
              });
            }); // each
          })
        .then(function() {  // initialize times  set each room and times for reses
          var room;
          var dayIndex = -1;
          var cancelInterval = setInterval(function() { // hack for unresolved timming issue
            if ($scope.options.rooms && $scope.days) {
              clearInterval(cancelInterval);
              _.each($scope.reservations, function(res) {
                room = _.findWhere($scope.options.rooms, {
                  _id: res.location.room
                });
                dayIndex = _.findIndex($scope.days, {
                  date: moment.utc(moment(res.start).format('YYYY-MM-DD')).format()
                });

                if(dayIndex<0) throw 'Error: no day found from reservation.';
                time = moment.utc(res.start).format('X') - moment.utc($scope.days[dayIndex].date).format('X');

                tier = _.findWhere(room.bookings[dayIndex].tiers, {
                  'seconds': time
                });
                tier.bag=[];
                tier.bag.push(res);
              });

            }
          }, 100); //settime Interval
        });
      } //getRoomIndex


      //============================================================
      //
      //============================================================
      function generateDays() {
        $scope.days = [];
        var meeting = _.findWhere($scope.options.conferences, {
          _id: $scope.meeting
        });


        var numDays = Math.floor((Number(meeting.end) - Number(meeting.start)) / (24 * 60 * 60));
        var seconds = Number(meeting.start);
        var date = moment.utc(seconds*1000);

        $scope.startDate = date.format('YYYY-MM-DD');


        $element.find('#start-filter').bootstrapMaterialDatePicker('setMinDate', date);
        $element.find('#end-filter').bootstrapMaterialDatePicker('setMinDate', date);
        for (var i = 1; i <= numDays +1; i++) {
          if (i === numDays +1) {

            $element.find('#end-filter').bootstrapMaterialDatePicker('setMaxDate', date);
            $element.find('#start-filter').bootstrapMaterialDatePicker('setMaxDate', date);
            $scope.endDate = date.format('YYYY-MM-DD');

          }
          _.each(meeting.seTiers, function(tier) {
            tier.bag = [];
          });
          $scope.days.push({
            'selected': true,
            'date': moment.utc(date.format("YYYY-MM-DD")).format(),
            'month': date.format("MMM").toUpperCase(),
            'day': date.format("DD"),
            'tiers': _.cloneDeep(meeting.seTiers)
          });
          seconds = seconds + (24 * 60 * 60);
          date = moment.utc(seconds*1000);
        }
        $timeout(function() {
          dateChangeEffect('start-filter');
          dateChangeEffect('end-filter');
        }, 1500);

      } //generateDays

      //============================================================
      //
      //============================================================
      function loadRooms() {

        return mongoStorage.getConferenceRooms($scope.meeting).then(function(rooms) {
          $scope.options.rooms = rooms.data;

          _.each($scope.options.rooms, function(room) {
            room.bookings = _.cloneDeep($scope.days);
            $scope.rooms[room._id]=room;
          });
        });
      } //generateDays

      //============================================================
      //
      //============================================================
      function setTimes(res, container) {

        var startDate = Number(moment(container.attr('date')).format('X')); //.format('X')
        startDate = startDate + Number(container.attr('time'));
        if (container.attr('id') !== 'unscheduled-side-events') {
          res.start = startDate;
          res.end = startDate + 5400;
          if (!res.location) res.location = {};
          res.location.venue = getVenueId($scope.meeting);
          res.location.room = container.attr('room-index');
          res.meta.status= res.meta.status || 'request-non-blocking';
          delete(res.$unset);
        } else {
          delete(res.start);
          delete(res.end);
          delete(res.location);
          res.$unset = {
            'start': '',
            'end': ''
          };
        }
        return mongoStorage.saveRes(res);
      }

      //============================================================
      //
      //============================================================
      function getVenueId(meetingId) {

        return _.findWhere($scope.options.conferences, {
          _id: meetingId
        }).venue;

      } //generateDays

      //============================================================
      //
      //============================================================
      function sEBagAccepts(el, target) {

        target = angular.element(target);
        if (_.isArray(getBagScope(target)) && getBagScope(target).length !== 0 && target.attr('id') !== 'unscheduled-side-events')
          return false;
        else
          return true;
      }

      //============================================================
      //
      //============================================================
      function hoverCleanUp() {

        _.each(hoverArray, function(el) {
          el.find('span.empty-bag').show();
          el.removeClass('label-success');
          el.removeClass('label-danger');
        });
      } //generateDays

      //============================================================
      //
      //============================================================
      $scope.roomDialog = function(room) {
          $scope.editRoom = room;
          ngDialog.open({
            template: roomDialog,
            className: 'ngdialog-theme-default',
            closeByDocument: true,
            plain: true,
            scope: $scope
          });
      };//$scope.roomDialog


      //============================================================
      //
      //============================================================
      $scope.resDialog = function(res) {
          $scope.editRes = res;
          ngDialog.open({
            template: resDialog,
            className: 'ngdialog-theme-default',
            closeByDocument: true,
            plain: true,
            scope: $scope
          });
      };//$scope.roomDialog

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
      dragulaService.options($scope, 'rooms-bag', {
        moves: function(el, container, handle) {
          return handle.className === 'grabbible room-title ng-binding';
        },

      });

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
      //
      //============================================================
      $scope.$on('rooms-bag.drop-model', function(el, target) {
        target.parent().children().each(function() {
          var room = _.findWhere($scope.options.rooms, {
            '_id': $(this).attr('id')
          });
          room.sort = $(this).index();
          var roomClone = _.cloneDeep(room);
    //      delete(roomClone);
          return mongoStorage.save('venue-rooms', roomClone, roomClone._id).catch(function() {
            $rootScope.$broadcast("showError", "There was an error updating the server with the room order.");
          });
        });
        $rootScope.$broadcast("showInfo", "Room Sort Order Successfully Updated.");
      });

      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.drag', function(e, el) {

        var elModel = _.findWhere($scope.seModels, {
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
          res = _.findWhere($scope.sideEvents, {
            '_id': el.attr('res-id')
          });
        else
          res = getBagScope(source)[0];

        if (!(source.attr('id') === 'unscheduled-side-events' && container.attr('id') === 'unscheduled-side-events'))
          setTimes(res, container).then(
            function() {
              if($scope.searchReq || $scope.preferenceSearch || $scope.searchOrg || $scope.search)
              initUnscheduledEvents($scope.meeting).then(function(){
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
          var room = _.findWhere($scope.options.rooms, {
            '_id': target.attr('room-index')
          });
          var elModel = _.findWhere($scope.seModels, {
            '_id': el.attr('res-id')
          });

          if (elModel.sideEvent.expNumPart > room.capacity)
            $rootScope.$broadcast('showWarning', 'Warning: The expected number of participants (' + elModel.sideEvent.expNumPart + ') excceds room capacity (' + room.capacity + ').');
        }
      });

      //============================================================
      // Search function, search side events will result in color change
      //============================================================
      $scope.searchSe = function(se) {

        if (!$scope.search || $scope.search == ' ') return true;
        var temp = JSON.stringify(se);
        return (temp.toLowerCase().indexOf($scope.search.toLowerCase()) >= 0);
      };


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
            $scope.prefObj = _.findWhere($scope.options.preferences,{'value':$scope.preferenceSearch});

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

    }
  ]);

  app.filter('ucf', function()
  {
      return function(word)
      {
          return word.substring(0,1).toUpperCase() + word.slice(1);
      };
  });
});