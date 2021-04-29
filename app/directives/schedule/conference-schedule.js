define(['app', 'lodash', 'text!./conference-schedule.html', 'moment',
    'directives/date-picker',
    'ngDialog',
    'services/mongo-storage',
    './time-unit-row',
    './time-unit-row-header',
    './room-row',
    'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css',
], function(app, _, template, moment) {

    app.directive("conferenceSchedule", ['$timeout', '$document', 'mongoStorage','$rootScope','$q','$location','$rootScope',
        function($timeout, $document, mongoStorage,$rootScope,$q,$location, $rootScope) {
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


                        init();

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('conference',function(){
                          if($scope.conference)
                            changeConference();
                        });

                        //============================================================
                        //
                        //============================================================
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

                                      $scope.startTime = moment($scope.dayObj).startOf('day').hour(6).format('HH:mm');
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

                                      $scope.startTime = moment($scope.dayObj).startOf('day').hour(6).format('HH:mm');
                                      setStartTime(); // creates passes moment object for children directives
                                      $rootScope.$broadcast("showError", "End time cannot be  before or equal to the start time.");
                                  }
                            }
                        });

                        //============================================================
                        //
                        //============================================================
                        function init() {
                            $scope.isLoading=isLoading;
                            $scope.reservations={};
                            $scope.rooms = [];
                            $scope.startTime = ''; //display
                            $scope.endTime = ''; //display
                            $scope.startTimeObj = '';
                            $scope.endTimeObj = '';
                            $scope.options={};
                            $scope.changeDay = changeDay; // update times and effects on day change
                            $scope.changeStartTime = changeStartTime;
                            $scope.changeEndTime = changeEndTime;
                            $scope.loading ={};
                            $scope.loading.rooms=false;
                            $scope.loading.types=false;
                            $scope.loading.reservations=true;
                            $scope.hideEmptyRooms=true;
                            initTypes();
                            initDayTimeSelects();
                            //initDay();

                            setStartTime();
                            setEndTime();

                        } //init
                        //============================================================
                        //
                        //============================================================
                        function initTypes() {
                            $scope.loading.types=true;
                            if(!$scope.options || _.isEmpty($scope.options.types))
                              return mongoStorage.loadTypes('reservations').then(function(result) {
                                  if(!$scope.options)$scope.options={};
                                  $scope.options.types = result;
                                  $scope.loading.types=false;
                              });
                            else {
                              return $q(function(resolve){resolve(true);$scope.loading.types=false;});
                            }
                        } //initTypes()
                        //============================================================
                        //
                        //============================================================
                      function getReservations() {
                          var roomIds=[];
                          $scope.loading.reservations=true;
                          _.each($scope.rooms,function(r){
                              roomIds.push(r._id);
                          });
                          var q={
                            'location.room': {'$in':roomIds},
                            '$and': [{
                                'start': {
                                    '$gte': {
                                        '$date': moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').subtract(3,'hours').format()
                                    }
                                }
                            }, {
                                'end': {
                                    '$lt': {
                                        '$date': moment.tz($scope.dayObj,$scope.conference.timezone).endOf('day').add(3,'hours').format()
                                    }
                                }
                            }],
                            'meta.status': {
                                $nin: ['archived', 'deleted']
                            }
                          };

                          var f = {open:1,confirmed:1,title:1,start:1,end:1,location:1,'sideEvent.title':1,'sideEvent.hostOrgs':1,'sideEvent.id':1,type:1,video:1,agenda:1,seriesId:1};

                                return mongoStorage.loadDocs('reservations',q, 0,1000000,false,{},f).then(
                                    function(responce) {
                                          $scope.resList=responce.data;
                                          var reservations={};
                                          _.each($scope.rooms,function(r){

                                              reservations[r._id] = [];
                                            _.each(responce.data,function(res){
                                                if(res.location.room===r._id)
                                                  reservations[r._id].push(res);
                                            });

                                        });

                                    $timeout(function(){$scope.loading.reservations=false;},500);
                                    $scope.resInRooms = reservations;
                                    toggleEmptyRooms();
                                    return reservations;
                                    }
                                ); // mongoStorage.getReservations

                        } // getReservations
                        $scope.getReservations = getReservations;
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
                        } //init
                        //============================================================
                        //
                        //============================================================
                        function isLoading() {
                            var loading = false;
                            _.each($scope.loading,function(obj){
                                if(obj)
                                  loading=true;

                            });
                            return loading;
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function initDay() {

                          //  if($location.search('day')) console.log($location.search('day'));

                            var start =   moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day');
                            var end =    moment.tz($scope.conference.schedule.end,$scope.conference.timezone).startOf('day').add(1,'day');

                            if($location.search().day && moment($location.search().day).isValid()){
                                if( moment($location.search().day).isSameOrAfter(start) && moment($location.search().day).isSameOrBefore(end))
                                    $scope.dayObj = moment.tz(moment($location.search().day),$scope.conference.timezone).startOf('day');
                                else
                                  $location.search('day',start.format());

                                $timeout(function() {
                                    prevNextRestrictions();
                                }, 100);
                                getRooms().then(function(){
                                  $scope.reservations=getReservations();
                                });
                              }
                            else{
                              if(moment.tz(moment(),$scope.conference.timezone).isAfter(moment.tz(start,$scope.conference.timezone)))
                                  $location.search('day',moment.tz(moment(),$scope.conference.timezone).format());
                              else
                                  $location.search('day',moment.tz(start,$scope.conference.timezone).format());
                            }
                            $timeout(function() {

                                if($scope.dayObj.isSameOrAfter(start) && $scope.dayObj.isSameOrBefore(end)){
                                    $scope.day= $scope.dayObj.format('dddd YYYY-MM-DD');
                                    $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj);
                                }else {

                                    $scope.dayObj = moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day');
                                    $scope.day= $scope.dayObj.format('dddd YYYY-MM-DD');
                                    $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj);
                                }
                                $scope.day = $scope.dayObj.startOf('day').format('dddd YYYY-MM-DD');
                                prevNextRestrictions();
                                //$location.search('day',moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').format());
                            }, 500);
                        } //init
                        //============================================================
                        //
                        //============================================================
                        $scope.searchReservations = function() {

                            if (!$scope.search || $scope.searchsearchRes === ' '){
                              _.each($scope.rooms,function(room){
                                room.hideRoomSearch='-1';
                              });
                              _.each($scope.resList,function(res){
                                     res.searchFound=false;
                                     res.hide=false;
                              });
                              return false;
                            }

                            _.each($scope.rooms,function(room){
                              room.hideRoomSearch=0;
                            });

                          _.each($scope.resList,function(res){

                              var temp = JSON.stringify( res);
                              if(temp.toLowerCase().indexOf($scope.search.toLowerCase()) >= 0){
                                 res.searchFound=true;
                                var r = _.find($scope.rooms,{'_id': res.location.room});
                                r.hideRoomSearch=1;
                                return true;
                              }else{
                                 res.searchFound=false;
                                 res.hide=true;
                                return true;
                              }
                          });
                        }; //searchReservations
                        //============================================================
                        //
                        //============================================================
                        function initDayTimeSelects() {

                            $scope.day = moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').format('dddd YYYY-MM-DD');

                            $scope.endTime = moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').hour(23).format('HH:mm');
                            setEndTime(); // creates passes moment object for children directives

                            $scope.startTime = moment.tz($scope.dayObj,$scope.conference.timezone).startOf('day').hour(6).format('HH:mm');
                            setStartTime(); // creates passes moment object for children directives
                            prevNextRestrictions();
                        } //initDayTimeSelects

                        $scope.timeLine = function() {
                                if (!$scope.endTime || !$scope.startTime) return;

                                if($scope.dayObj && $scope.dayObj.startOf('day').isSame(moment().startOf('day')))
                                    return {
                                        'height': $scope.gridHeight,
                                        'position': 'absolute',
                                        'z-index': 100,
                                        'top': '40px',
                                        'border-color': 'red',
                                        'border-right-style': 'dashed',
                                        'border-right-width': 'thin',
                                        'left': leftPosition()
                                    };
                                else return {};
                            };
                            //============================================================
                            //
                            //============================================================
                        function leftPosition() {

                            var hours = $scope.endTimeObj.hours() - $scope.startTimeObj.hours();
                            $document.ready(function() {
                                var scrollGridEl = $document.find('#scroll-grid');
                                $scope.outerGridWidth = Number(scrollGridEl.width() - 1);
                            });
                            var colWidth = Number($scope.outerGridWidth) / Number(hours);

                            var posInterval = colWidth / 60;
                            var leftPosition = (((moment().hours() - $scope.startTimeObj.hours()) * 60) + moment().minutes()) * (posInterval - .1);//jshint ignore:line

                            return leftPosition;

                        } //

                        //============================================================
                        // $scope.changeConference
                        //============================================================
                        function changeConference() {

                            $scope.conference.endObj = moment.tz($scope.conference.schedule.end,$scope.conference.timezone).add(1,'day').startOf('day');
                            $scope.conference.startObj = moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day');

                            $timeout(function() {

                                $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', $scope.dayObj.startOf('day').hour(Number($scope.startTime.substring(0, 2))));
                                $scope.day = $scope.dayObj.startOf('day').format('dddd YYYY-MM-DD');
                            });
                            $scope.dayObj = $scope.conference.startObj;
                            initDay();
                            $timeout(function(){prevNextRestrictions();},1000);

                        } //changeConference
                        $scope.conference.changeConference = changeConference;

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
                        function changeDay(day,ui) {

                            setDay(day,ui);
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
                        function setDay(day,ui) {

                            if(day)$scope.day=day;
                            $scope.dayObj = moment($scope.day,'dddd YYYY-MM-DD').startOf('day');

                            if($scope.day===day && !ui)
                              $location.search('day',moment($location.search().day).add(1,'second').format());
                            else
                              $location.search('day',moment($scope.day,'dddd YYYY-MM-DD').startOf('day').format());
                            // prevNextRestrictions();
                        } //getStartTime

                        //============================================================
                        //
                        //============================================================
                        function prevNextRestrictions() {

                            if(_.isEmpty($scope.conferenceDays) || !$scope.dayObj) return;

                            if(moment.tz($scope.dayObj,$scope.conference.timezone).subtract(1, 'day').isBefore($scope.conferenceDays[0].startOf('day')))
                                $scope.isPrevDay = true;
                            else
                                $scope.isPrevDay = false;

                            if(moment.tz($scope.dayObj,$scope.conference.timezone).add(1, 'day').isAfter($scope.conference.endObj.startOf('day')))
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
                            $location.search('day',$scope.dayObj.format());
                            $scope.dayObj = moment.tz(moment($location.search().day),$scope.conference.timezone).startOf('day');

                        }; //nextDay

                        //============================================================
                        //
                        //============================================================
                        $scope.prevDay = function() {

                            $scope.dayObj = $scope.dayObj.subtract(1, 'day');
                            $location.search('day',$scope.dayObj.format());

                        }; //prevDay

                        //============================================================
                        //
                        //============================================================
                         function toggleEmptyRooms() {
                            $scope.hideEmptyRooms=!$scope.hideEmptyRooms;
                            _.each($scope.resInRooms,function(roomArr,index){
                                  if(!roomArr.length){
                                    var r = _.find($scope.rooms,{'_id':index});
                                    if($scope.hideEmptyRooms)
                                      r.hideRoomSearch=0;
                                    else
                                      r.hideRoomSearch='-1';
                                  }
                            });
                        }; //prevDay
                        $scope.toggleEmptyRooms = toggleEmptyRooms;

                        //============================================================
                        //
                        //============================================================
                        function getRooms() {
                            $scope.loading.rooms=true;
                            return mongoStorage.getConferenceRooms($scope.conference._id).then(function(res) {
                                $scope.rooms = res.data;
                                _.each($scope.rooms,function(r){
                                  r.hideRoomSearch='-1'
                                });
                            }).then(function() {
                                ctrl.initRowHeight();
                                ctrl.generateDays();
                                $scope.loading.rooms=false;
                            });
                        } //initRooms


                    }, //link
                    controller: function($scope) {

                      $rootScope.$on('schedule-refresh', () => $timeout(this.resetSchedule,100) );
                      //============================================================
                      // used by child dir, timeRow
                      //============================================================
                      this.resetSchedule = function() {
                          return $scope.changeDay($scope.day);


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

                          var numDays = moment($scope.conference.schedule.end).diff($scope.conference.schedule.start,'days')+1;//Math.floor((Number($scope.conference.schedule.end) - Number($scope.conference.start)) / (24 * 60 * 60));

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
                      $scope.generateDays=this.generateDays;

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
                                  $scope.gridHeight=(Number($scope.rowHeight)*$scope.rooms.length);

                              });
                          });
                      }; //this.initRowHeight
                      $scope.initRowHeight=this.initRowHeight;

            } //return
        };
    }]);
});