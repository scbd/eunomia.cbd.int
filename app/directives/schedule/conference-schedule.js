define(['app', 'lodash', 'text!./conference-schedule.html', 'moment',
    'directives/date-picker',
    'ngDialog',
    'services/mongo-storage',
    './time-unit-row',
    './time-unit-row-header',
    './room-row',
    'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css',
], function(app, _, template, moment) {

    app.directive("conferenceSchedule", ['$timeout', '$document', 'mongoStorage','$rootScope','$q','$location','$rootScope','$route',
        function($timeout, $document, mongoStorage,$rootScope,$q,$location, $rootScope, $route) {
            return {
                restrict  : 'E'                ,
                template  : template           ,
                replace   : true               ,
                transclude: false              ,
                require   : 'conferenceSchedule',
                scope     : { 'search': '=', 'conference':'=' },
                link: function($scope, $element,$attr,ctrl) {

                        init();

                        //============================================================
                        //
                        //============================================================
                        function init() {
                            getConferenceTiming()
                            getDateTime()
                            $scope.isLoading=isLoading;
                            $scope.reservations={};
                            $scope.rooms = [];
                            $scope.startTime = ''; //display
                            $scope.endTime = ''; //display
                            $scope.startTimeObj = '';
                            $scope.endTimeObj = '';
                            $scope.options={};
                            // $scope.changeDay = changeDay; // update times and effects on day change
                            $scope.changeStartTime = changeStartTime;
                            $scope.changeEndTime = changeEndTime;
                            $scope.loading ={};
                            $scope.loading.rooms=false;
                            $scope.loading.types=false;
                            $scope.loading.reservations=true;
                            $scope.hideEmptyRooms=true;


                            initTypes();
                            initDayTimeSelects();


                            setStartTime();
                            setEndTime();

                            initDay();

                        } //init
                        $scope.init= init

                        function loadReservation(){
                          const { edit } = $route.current.params

                          $element.find(`#res-el-${edit}`).click()
                        }

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
   
                                        $scope.resInRooms = reservations;
                                        toggleEmptyRooms();

                                        $timeout(()=>{
                                          $scope.loading.reservations=false;
                                          
                                        },500);
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

                        function getDateTime(){
                          const { day                  } = $route.current.params
                          const { timezone, start, end } = getConferenceTiming()
                          const   theDay                 = day? day : getToday().format()
                          const   searchDayIsValid       = moment(theDay).isValid() && isInConferenceDateRange(moment(theDay))
                          const   defaultDay             = isInConferenceDateRange(getToday())? getToday() : start
                          const   searchDay              = searchDayIsValid?  day : defaultDay.format()

                          const dateTime = moment.tz(searchDay, timezone)

                          $scope.dayObj  = dateTime
                          $scope.day     = dateTime.format('dddd YYYY-MM-DD');

                          return dateTime
                        }

                        function getToday(){
                          return moment.tz(moment(),$scope.conference.timezone)
                        }

                        function getConferenceTiming(){
                          const { schedule, timezone  } = $scope.conference
                          const   start                 = moment.tz(schedule.start, timezone).startOf('day')
                          const   end                   = moment.tz(schedule.end,   timezone).startOf('day').add(1,'day')

                          $scope.conference.endObj   = end
                          $scope.conference.startObj = start

                          return { timezone, start, end }
                        }

                        function isInConferenceDateRange(testDay = getToday()){
                          const   testDateTime = ensureMoment(testDay)
                          const { start, end } = getConferenceTiming()

                          return testDateTime.isAfter(start) && testDateTime.isBefore(end)
                        }
                        
                        function ensureMoment(testDateTime, tz = true){
                          const isMoment = moment.isMoment(testDateTime)

                          if(isMoment) return testDateTime

                          const { timezone } = getConferenceTiming()
                          const   aMoment    = tz? moment.tz(testDateTime, timezone) : moment(testDateTime)

                          if(!aMoment.isValid()) throw new Error(`ensureMoment: ${testDateTime} not a valid datetime`)

                          return aMoment

                        }

                        //============================================================
                        //
                        //============================================================
                        function initDay() {
                          const { timezone, start, end } = getConferenceTiming()

                          const searchDay        = getDateTime()



                          getRooms().then(() => $scope.reservations=getReservations())
                          .then(() => {
                            const elementIsHere = $element.find('#day-filter') && $element.find('#day-filter').bootstrapMaterialDatePicker
                            
                            $timeout(() => {
                              $element.find('#day-filter').bootstrapMaterialDatePicker({ switchOnClick: true, date: true, year: true, time: false,  format: 'dddd YYYY-MM-DD', clearButton: false, weekStart: 0 })
                              $element.find('#day-filter').bootstrapMaterialDatePicker('setDate', searchDay);
                              $element.find('#day-filter').bootstrapMaterialDatePicker('setMinDate', start);
                              $element.find('#day-filter').bootstrapMaterialDatePicker('setMaxDate', end);

                              $element.find('#day-filter').on('change', (e, date) => { $timeout(()=> $location.search('day',date.format()), 100) })

                              $element.find('#start-time-filter').bootstrapMaterialDatePicker({ switchOnClick: true, time: true, date: false, format: 'HH:mm', clearButton: false })
                              $element.find('#end-time-filter').bootstrapMaterialDatePicker({ switchOnClick: true, time: true, date: false, format: 'HH:mm', clearButton: false })
                              loadReservation()
                            }, elementIsHere? 10 : 1000)
                            prevNextRestrictions();
                          })

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
                            const endTime  = localStorage.getItem('endTime')?  localStorage.getItem('endTime') : $scope.dayObj.startOf('day').hour(23).format('HH:mm')

                            $scope.endTime = endTime
                            setEndTime(); // creates passes moment object for children directives

                            const startTime  = localStorage.getItem('startTime')?  localStorage.getItem('startTime') : $scope.dayObj.startOf('day').hour(6).format('HH:mm')

                            $scope.startTime = startTime
                            setStartTime(); // creates passes moment object for children directives

                        } //initDayTimeSelects

                        $scope.timeLine = function() {
                                const scrollGridEl = $document.find('#scroll-grid');

                                if (!scrollGridEl || !scrollGridEl.width || !$scope.endTime || !$scope.startTime) return;

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

                            setOuterGridWidth()
                            var colWidth = Number($scope.outerGridWidth) / Number(hours);

                            var posInterval = colWidth / 60;
                            var leftPosition = (((moment().hours() - $scope.startTimeObj.hours()) * 60) + moment().minutes()) * (posInterval - .1);//jshint ignore:line

                            return leftPosition;

                        } //

                        function setOuterGridWidth(){
                          const scrollGridEl = $document.find('#scroll-grid');

                          $scope.outerGridWidth = Number(scrollGridEl.width() - 1);
                        }


                        //============================================================
                        //
                        //============================================================
                        function changeStartTime() {

                            $timeout(setStartTime,10)
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
                            localStorage.setItem('startTime', $scope.startTime )
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
                            localStorage.setItem('endTime', $scope.endTime )
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

                            $scope.dayObj = moment($scope.dayObj).add(1, 'day');

                            $scope.$applyAsync(()=>$location.search('day',$scope.dayObj.format()))
                            // $scope.dayObj = moment.tz(moment($location.search().day),$scope.conference.timezone).startOf('day');

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
                               // 
                                ctrl.generateDays();
                                $scope.loading.rooms=false;
                                ctrl.initRowHeight();
                            });
                        } //initRooms


                    }, //link
                    controller: function($scope) {

$rootScope.$on('schedule-refresh', () => $timeout(this.resetSchedule,100) );

                      //============================================================
                      //used by child dir, timeRow
                      //============================================================
                      this.resetSchedule = function() {
                    
                        $scope.init()


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
                     function initRowHeight() {

                          // $document.ready(function() {
                              $timeout(function() {
                                  var roomColumnEl;
                                  roomColumnEl = $document.find('#room-col');
                                  if(!roomColumnEl?.height) return initRowHeight()
                                  $scope.rowHeight = Math.floor(Number(roomColumnEl.height()) / $scope.rooms.length);
                                  if ($scope.rowHeight < 60) $scope.rowHeight = 60;
                                  _.each($scope.rooms, function(room) {
                                      room.rowHeight = $scope.rowHeight;
                                  });
                                  $scope.gridHeight=(Number($scope.rowHeight)*$scope.rooms.length);

                              }, 1000);
                          // });
                      }; //this.initRowHeight
                      $scope.initRowHeight = initRowHeight;
                      this.initRowHeight = initRowHeight;

            } //return
        };
    }]);
});