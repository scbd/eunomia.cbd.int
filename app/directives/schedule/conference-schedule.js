define(['app', 'lodash', 'text!./conference-schedule.html', 'moment',
    'directives/date-picker',
    'ngDialog',
    'services/mongo-storage',
    './time-unit-row',
    './time-unit-row-header',
    './room-row',
    'css!libs/angular-dragula/dist/dragula.css',
], function(app, _, template, moment) {

    app.directive("conferenceSchedule", ['$timeout', '$document', 'mongoStorage','$rootScope','$q',
        function($timeout, $document, mongoStorage,$rootScope,$q) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                require:'conferenceSchedule',
                scope: {
                    'search': '=',
                    'conference':'='

                },
                link: function($scope, $element,$attr,ctrl) {

                        $scope.$watch('conference',function(){
                          if($scope.conference)
                            changeConference();
                        });
                        init();
                        $scope.$parent.$on('all-rooms-bag.drop-model', function() {
                          $timeout(moveRoom,1000);
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('startTimeObj', function(val,prevVal) {
                            if (val && val !==prevVal){
                                  if($scope.startTimeObj.as('seconds')>=$scope.endTimeObj.as('seconds')){


                                      $scope.endTime = moment($scope.dayObj).startOf('day').hour(23).format('HH:mm');
                                      setEndTime(); // creates passes moment object for children directives

                                      $scope.startTime = moment($scope.dayObj).startOf('day').hour(8).format('HH:mm');
                                      setStartTime(); // creates passes moment object for children directives
                                      $rootScope.$broadcast("showError", "Start time cannot be after or equal to the end time.");
                                  }
                            }
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('endTimeObj', function(val,prevVal) {

                          if (val && val !==prevVal){
                                if($scope.startTimeObj.as('seconds')>=$scope.endTimeObj.as('seconds')){
                                    $scope.endTime = moment($scope.dayObj).startOf('day').hour(23).format('HH:mm');
                                    setEndTime(); // creates passes moment object for children directives

                                    $scope.startTime = moment($scope.dayObj).startOf('day').hour(8).format('HH:mm');
                                    setStartTime(); // creates passes moment object for children directives
                                    $rootScope.$broadcast("showError", "End time cannot be  before or equal to the start time.");
                                }
                          }
                        });

                        //============================================================
                        //
                        //============================================================
                        function init() {

                            // $scope.changeConference = changeConference;
                            $scope.rooms = [];

                            $scope.startTime = ''; //display
                            $scope.endTime = ''; //display
                            $scope.startTimeObj = '';
                            $scope.endTimeObj = '';

                            $scope.changeDay = changeDay; // update times and effects on day change
                            $scope.changeStartTime = changeStartTime;
                            $scope.changeEndTime = changeEndTime;



                            initDayTimeSelects();
                            getRooms();
                            initDay();

                            setStartTime();
                            setEndTime();

                        } //init

                        //============================================================
                        //
                        //============================================================
                        function moveRoom() {
                            var allP=[];
                            if(!_.isEmpty($scope.rooms)){
                                _.each( $scope.rooms,function(item,index){
                                  item.sort=index;
                                  allP.push(mongoStorage.save('venue-rooms',{'_id':item._id,'sort':item.sort,'venue':item.venue}));
                                });
                            }
                            //$q.all(allP).then(getRooms);
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function initDay() {

                            var start =   moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day');
                            var end =    moment.tz($scope.conference.schedule.end,$scope.conference.timezone).startOf('day');

                            $scope.dayObj = moment.tz(moment(),$scope.conference.timezone).startOf('day');


                              $timeout(function() {
                                  if($scope.dayObj.isSameOrAfter(start) && $scope.dayObj.isSameOrBefore(end)){
                                      $scope.day= $scope.dayObj.format('dddd YYYY-MM-DD');
                                      $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj);
                                  }else {
                                      $scope.dayObj = moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day');
                                      $scope.day= $scope.dayObj.format('dddd YYYY-MM-DD');
                                      $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj);
                                  }

                                  $element.find('#day-filter').bootstrapMaterialDatePicker('setMaxDate', start);
                                  $element.find('#day-filter').bootstrapMaterialDatePicker('setMinDate', end);
                                  $scope.day = $scope.dayObj.startOf('day').startOf('day').format('dddd YYYY-MM-DD');
                                  prevNextRestrictions();
                              }, 1000);

                        } //init

                        //============================================================
                        //
                        //============================================================
                        function initDayTimeSelects() {

                            $scope.day = moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').format('dddd YYYY-MM-DD');

                            $scope.endTime = moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').hour(23).format('HH:mm');
                            setEndTime(); // creates passes moment object for children directives

                            $scope.startTime = moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').hour(8).format('HH:mm');
                            setStartTime(); // creates passes moment object for children directives
                            prevNextRestrictions();
                        } //initDayTimeSelects


                        //============================================================
                        //
                        //============================================================
                        function changeConference() {

                            getRooms();

                            $scope.conference.endObj = moment.tz($scope.conference.schedule.end,$scope.conference.timezone).add(1,'day').startOf('day');
                            $scope.conference.startObj = moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day');
//TODO
          $timeout(function() {

              $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj.startOf('day').hour(Number($scope.startTime.substring(0, 2))));
              $scope.day = $scope.dayObj.startOf('day').format('dddd YYYY-MM-DD');
          });
                            $scope.dayObj = $scope.conference.startObj;
                            $timeout(function(){prevNextRestrictions();},1000);
                        } //changeConference

                        //============================================================
                        //
                        //============================================================
                        function changeStartTime() {

                            setStartTime();
                            prevNextRestrictions();
                        } //changeStartTime

                        //============================================================
                        //
                        //============================================================
                        function changeEndTime() {

                            setEndTime();
                            prevNextRestrictions();
                        } //changeEndTime

                        //============================================================
                        //
                        //============================================================
                        function changeDay() {

                            setDay();
                            prevNextRestrictions();
                        } //changeEndTime

                        //============================================================
                        //
                        //============================================================
                        function setStartTime() {

                            if ($scope.startTime) {
                                var timeHours = Number($scope.startTime.substring(0, 2));
                                var timeMinutes = Number($scope.startTime.substring(3, 5));
                                var timeAMPM = $scope.startTime.substring(6, 8);
                                if (timeAMPM === 'pm' && timeHours !== 12) timeHours += 12;

                                $scope.startTimeObj = moment.duration({
                                    hours: timeHours,
                                    minutes: timeMinutes
                                });
                            }
                            prevNextRestrictions();
                        } //getStartTime

                        //============================================================
                        //
                        //============================================================
                        function setEndTime() {

                            if ($scope.endTime) {
                                var timeHours = Number($scope.endTime.substring(0, 2));
                                var timeMinutes = Number($scope.endTime.substring(3, 5));
                                var timeAMPM = $scope.endTime.substring(6, 8);
                                if (timeAMPM === 'pm' && timeHours !== 12) timeHours += 12;
                                if (timeAMPM === 'am' && timeHours === 12) timeHours = 0;
                                $scope.endTimeObj = moment.duration({
                                    hours: timeHours,
                                    minutes: timeMinutes
                                });
                            }
                            prevNextRestrictions();
                        } //getStartTime

                        //============================================================
                        //
                        //============================================================
                        function setDay() {

                            $scope.dayObj = moment.tz($scope.day,$scope.conference.timezone).startOf('day');
                            prevNextRestrictions();
                        } //getStartTime

                        //============================================================
                        //
                        //============================================================
                        function prevNextRestrictions() {

                            if(_.isEmpty($scope.conferenceDays) || !$scope.dayObj) return;

                            if($scope.dayObj.subtract(1, 'day').isBefore($scope.conferenceDays[0].startOf('day')))
                                $scope.isPrevDay = true;
                            else
                                $scope.isPrevDay = false;

                            if($scope.dayObj.add(1, 'day').isAfter($scope.conferenceDays[$scope.conferenceDays.length-1].startOf('day')))
                                $scope.isNextDay = true;
                            else
                                $scope.isNextDay = false;
                        } //getStartTime
                        $scope.prevNextRestrictions=prevNextRestrictions;
                        //============================================================
                        //
                        //============================================================
                        $scope.nextDay = function() {

                            $scope.dayObj = $scope.dayObj.add(1, 'day');


                            $timeout(function() {
                                $scope.dayObj = moment.tz($scope.dayObj,$scope.conference.timezone);
                                $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj);
                                $scope.day = $scope.dayObj.startOf('day').format('dddd YYYY-MM-DD');
                                prevNextRestrictions();
                            }, 100);
                        }; //changeStartTime

                        //============================================================
                        //
                        //============================================================
                        $scope.prevDay = function() {

                            $scope.dayObj = $scope.dayObj.subtract(1, 'day');

                            $timeout(function() {
                                $scope.dayObj = moment.tz($scope.dayObj,$scope.conference.timezone);
                                $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj);
                                $scope.day =$scope.dayObj.startOf('day').format('dddd YYYY-MM-DD');
                                prevNextRestrictions();
                            }, 100);
                        }; //changeStartTime

                        //============================================================
                        //
                        //============================================================
                        function getRooms() {

                            return mongoStorage.getConferenceRooms($scope.conference._id).then(function(res) {
                                $scope.rooms = res.data;
                            }).then(function() {
                                ctrl.initRowHeight();
                                ctrl.generateDays();
                            });
                        } //initRooms


                    }, //link
                    controller: function($scope) {
                      //============================================================
                      // used by child dir, timeRow
                      //============================================================
                      this.resetSchedule = function() {

                          this.initRowHeight();
                          this.generateDays();
                      }; //this.resetSchedule
                      //============================================================
                      // used by child dir, timeRow
                      //============================================================
                      this.setDay = function(day) {

                          $scope.dayObj = day;
                          $scope.day = moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').format('dddd YYYY-MM-DD');

                          $scope.prevNextRestrictions();
                      }; //this.resetSchedule
                      //============================================================
                      //
                      //============================================================
                      this.generateDays= function() {

                          $scope.conferenceDays = [];

                          var numDays = moment($scope.conference.schedule.end).diff($scope.conference.schedule.start,'days');//Math.floor((Number($scope.conference.schedule.end) - Number($scope.conference.start)) / (24 * 60 * 60));

                          $scope.conference.endObj = moment.tz($scope.conference.schedule.end,$scope.conference.timezone).add(1,'day').startOf('day');
                          $scope.conference.startObj = moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day');
                          $scope.startDay = $scope.conference.startObj;
                          $scope.endDay = $scope.conference.endObj;
                          var date = $scope.conference.startObj;
                          for (var i = 0; i <= numDays; i++) {
                              $scope.conferenceDays.push(moment.tz(date,$scope.conference.timezone));
                              date.add(1, 'day');
                          }
                          $scope.lastConfDay=moment.tz(date.add(1, 'day'),$scope.conference.timezone);
                      }; //generateDays

                      //============================================================
                      //
                      //============================================================
                      this.initRowHeight = function() {

                          $document.ready(function() {
                              $timeout(function() {
                                  var roomColumnEl;
                                  roomColumnEl = $document.find('#room-col');
                                  $scope.rowHeight = Math.floor(Number(roomColumnEl.height()) / $scope.rooms.length);
                                  if ($scope.rowHeight < 60) $scope.rowHeight = 60;
                                  _.each($scope.rooms, function(room) {
                                      room.rowHeight = $scope.rowHeight;
                                  });
                              });
                          });
                      }; //this.initRowHeight
            } //return
        };
    }]);
});