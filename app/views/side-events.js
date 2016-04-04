define(['app', 'lodash', 'moment',
  'text!directives/forms/edit/room-dialog.html',
  'BM-date-picker',
  'css!libs/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css',
  'css!libs/angular-dragula/dist/dragula.css', 'css!./side-events.css',
  '../services/mongo-storage',
  '../directives/forms/edit/room',
  'ngDialog',
  'css!libs/ng-dialog/css/ngDialog.css',
  'css!libs/ng-dialog/css/ngDialog-theme-default.min.css',

], function(app, _, moment, roomDialog) {

  app.controller("events", ['$scope', '$element', '$document', 'dragulaService', 'mongoStorage', '$timeout', '$rootScope', 'ngDialog',
    function($scope, $element, $document, dragulaService, mongoStorage, $timeout, $rootScope, ngDialog) {


      // $scope.startFilter=0;
      // $scope.endFilter=0;
      $scope.sideEvents = ['1'];
      $scope.rooms = [];
      $scope.days = [];
      $scope.meeting = 0;
      var hoverArray = [];

      init();

      //============================================================
      //
      //============================================================
      function init() {
        $scope.options = {};
        initMeeting().then(function() {
          generateDays();
        }).then(function() {
          loadRooms();
        }).then(function() {
          initSideEvents($scope.meeting);
        }).then(function() {
          loadReservations();
        });
      } //init
      //============================================================
      //
      //============================================================
      $scope.changeMeeting = function() {
        generateDays();
        loadRooms().then(function() {
          initSideEvents($scope.meeting);
        }).then(function() {
          loadReservations();
        });

        // $scope.dateChange('end-filter');
        // $scope.dateChange('start-filter');
      }; //init

      //============================================================
      //
      //============================================================
      function dateChangeEffect(id) {
        $element.find('#' + id).parent().addClass('is-focused');

        $timeout(function() {
          $element.find('#' + id).parent().removeClass('is-focused');
        }, 2000);
      }; //init

      //============================================================
      //
      //============================================================
      $scope.dateChange = function(id) {
        var dayTS;
        var startDatTS = moment($scope.startDate).unix();
        var endDatTS = moment($scope.endDate).unix();

        if (id === 'start-filter') {
          $element.find('#end-filter').bootstrapMaterialDatePicker('setMinDate', $scope.startDate);
          _.each($scope.days, function(day, key) {
            dayTS = moment(day.date).unix();
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
          $element.find('#start-filter').bootstrapMaterialDatePicker('setMaxDate', $scope.endDate);
          _.each($scope.days, function(day, key) {
            dayTS = moment(day.date).unix();
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
        dateChangeEffect(id);
      }; //init
      //============================================================
      //
      //============================================================
      function initSideEvents(meeting) {
        var allOrgs;
        return mongoStorage.syncSideEvents().then(function(r) {
          mongoStorage.loadUnscheduledSideEvents(meeting).then(function(res) {
            $scope.sideEvents = res.data;
          }).then(
            function() {
              return mongoStorage.loadOrgs('inde-orgs', 'published').then(function(orgs) {
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
          });
        }); // sync side events
      } //initMeeting

      //============================================================
      //
      //============================================================
      function initMeeting() {
        return mongoStorage.loadconferences().then(function(confs) {
          $scope.options.conferences = confs.data;
          var lowestEnd = Math.round(new Date().getTime() / 1000);
          var chosenEnd = 0;
          var selectedKey = 0;
          _.each($scope.options.conferences, function(meet, key) {
            var date = moment.unix(meet.end);
            if (!chosenEnd) chosenEnd = meet.end;
            if (meet.end > lowestEnd && meet.end <= chosenEnd) {
              chosenEnd = meet.end;
              selectedKey = key;
            }
          });
          $scope.options.conferences[selectedKey].selected = true;
          $scope.meeting = $scope.options.conferences[selectedKey]._id;
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
        var time, tier;
        $scope.venue = meeting.venue;
        return mongoStorage.loadReservations(meeting.start, meeting.end, meeting.venue).then(function(res) {
          $scope.reservations = res.data;
        }).then(function() {
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
                  date: moment(res.start * 1000).format('YYYY-MM-DD')
                });
                time = res.start - moment($scope.days[dayIndex].date).format('X');
                tier = _.findWhere(room.bookings[dayIndex].tiers, {
                  'seconds': time
                });
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


        var numDays = Math.round((Number(meeting.end) - Number(meeting.start)) / (24 * 60 * 60));
        var seconds = Number(meeting.start);
        var date = moment.unix(seconds);

        $scope.startDate = date.format('YYYY-MM-DD');


        $element.find('#start-filter').bootstrapMaterialDatePicker('setMinDate', date);
        $element.find('#end-filter').bootstrapMaterialDatePicker('setMinDate', date);
        for (var i = 1; i <= numDays + 1; i++) {
          if (i === numDays + 1) {
            $element.find('#end-filter').bootstrapMaterialDatePicker('setMaxDate', date);
            $element.find('#start-filter').bootstrapMaterialDatePicker('setMaxDate', date);
            $scope.endDate = date.format('YYYY-MM-DD');

          }
          _.each(meeting.seTiers, function(tier) {
            tier.bag = [];
          });
          $scope.days.push({
            'selected': true,
            'date': date.format("YYYY-MM-DD"),
            'month': date.format("MMM").toUpperCase(),
            'day': date.format("DD"),
            'tiers': _.cloneDeep(meeting.seTiers)
          });
          seconds = seconds + (24 * 60 * 60);
          date = moment.unix(seconds);
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

        return mongoStorage.loadConferenceRooms($scope.meeting).then(function(rooms) {
          $scope.options.rooms = rooms.data;

          _.each($scope.options.rooms, function(room) {
            room.bookings = _.cloneDeep($scope.days);
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
        } else {
          delete(res.start);
          delete(res.end);
          delete(res.location);
          res['$unset'] = {
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
      function sEBagAccepts(el, target, source, sibling) {

        target = angular.element(target);
        if (_.isArray(getBagScope(target)) && getBagScope(target).length !== 0 && target.attr('id') !== 'unscheduled-side-events')
          return false;
        else
          return true;
      }
      //============================================================
      //
      //============================================================
      $scope.test = function() {

          alert('test');
          console.log('test');

        } //generateDays

      var emptyEl = angular.element('<span class="empty-bag" >&nbsp;</span>');
      //============================================================
      //
      //============================================================
      function hoverCleanUp() {

        _.each(hoverArray, function(el) {
          el.find('span.empty-bag').show();
          el.removeClass('label-success');
        });
      } //generateDays

      //============================================================
      //
      //============================================================
      $scope.roomDialog = function(room) {
        $scope.editRoom = room;
        var dialog = ngDialog.open({
          template: roomDialog,
          className: 'ngdialog-theme-default',
          closeByDocument: true,
          plain: true,
          scope: $scope
        });

        dialog.closePromise.then(function(ret) {

          if (ret.value == 'draft') $scope.close();
          if (ret.value == 'publish') $scope.requestPublish().then($scope.close).catch(function onerror(response) {

            $scope.onError(response);

          });

        });
      };

      //============================================================
      //
      //============================================================
      dragulaService.options($scope, 'se-bag', {
        mirrorAnchor: 'bottom',
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
      $scope.$on('rooms-bag.drop-model', function(el, target, source, sibling) {
            target.parent().children().each(function(){

                  var room = _.findWhere($scope.options.rooms,{'_id':$(this).attr('id')});
                  room.sort=$(this).index();
                  var roomClone = _.cloneDeep(room);
                  delete(roomClone);
                  return mongoStorage.save('venue-rooms',roomClone,roomClone._id).catch(function(){
                              $rootScope.$broadcast("showError","There was an error updating the server with the room order.");
                  });
            });
            $rootScope.$broadcast("showInfo","Room Sort Order Successfully Updated.");

      });

      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.drag', function(e, el, container) {


      });

      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.cloned', function(e, mirror, shadow) {

        mirror.children('div.panel.panel-default.se-panel').hide();
        mirror.children('div.drag-view.text-center').show();
        shadow.children('div.panel.panel-default.se-panel').hide();
        shadow.children('div.drag-view.text-center').show();

        var siblings = $element.find('span.se-in-grid.ng-binding.ng-scope');

        mirror.height(15);
        mirror.width(40);
        // shadow.height(15);
        // shadow.width(40);
        //shadow.css('display','inline');

      });

      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.shadow', function(e, el, container, source) {
        var siblings;

        if (container[0].id === 'unscheduled-side-events') {
          if (source !== 'unscheduled-side-events') {
            el.children('div.panel.panel-default.se-panel').show();
            el.children('div.drag-view.text-center').hide();
            siblings = source.find('div.se-dragable-wrapper.grabbible.ng-scope');
            el.height(siblings.height());
            el.width(siblings.width());
          }
        } else {
          el.children('div.panel.panel-default.se-panel').hide();
          el.children('div.drag-view.text-center').show();
          siblings = $element.find('span.se-in-grid.ng-binding.ng-scope');

          el.height(siblings.height());
          el.width(siblings.width());
        }

      });

      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.drop-model', function(e, el, container, source) {
        hoverArray = [];
        container.removeClass('label-success');
        if ((source.attr('id') !== 'unscheduled-side-events' && container.attr('id') === 'unscheduled-side-events'))
          initSideEvents($scope.meeting);
      });


      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.drop', function(e, el, container, source) {

        var res;
        if (source.attr('id') === 'unscheduled-side-events') {
          res = $scope.sideEvents[el.attr('se-res-index')];

        } else
          res = getBagScope(source)[0];

        if (!(source.attr('id') === 'unscheduled-side-events' && container.attr('id') === 'unscheduled-side-events'))
          setTimes(res, container).then(
            function() {
              if (container.attr('id') !== 'unscheduled-side-events') {
                var meeting = _.findWhere($scope.options.conferences, {
                  _id: $scope.meeting
                });
                var tier = _.findWhere(meeting.seTiers, {
                  'seconds': Number(container.attr('time'))
                });

                $rootScope.$broadcast("showInfo", "Server successfully updated:  Side Event " + res.title + "'s reservation is set in room " + res.location.room + " on " + source.attr('date') + " at the " + tier.title + " tier.");

              }
            }

          ).catch(function(error) {

            $rootScope.$broadcast("showError", "There was an error updating the server, Please try your action again. ");
          });


        // $rootScope.$broadcast("showWarning","Test warning title", "Test warning message");
        // $rootScope.$broadcast("showSuccess","Test info Title", "Test info message");
        // $rootScope.$broadcast("showError","Test warning title", "Test warning message");
      });


      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.over', function(e, el, container) {
        hoverCleanUp();
        hoverArray.push(container);

        container.find('span.empty-bag').hide();
        container.addClass('label-success');


      });

      //============================================================
      //
      //============================================================
      $scope.$on('se-bag.drop-model', function(el, target, source) {


      });

      //============================================================
      //
      //============================================================
      $document.ready(function() {
        $.material.init();
        $.material.input();
        $.material.ripples();
        $element.find('#end-filter').bootstrapMaterialDatePicker({
          weekStart: 0,
          time: false
        });
        $element.find('#start-filter').bootstrapMaterialDatePicker({
          weekStart: 0,
          time: false
        });
      });
    }
  ]);

});