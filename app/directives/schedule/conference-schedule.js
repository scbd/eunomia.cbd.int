define(['app', 'lodash', 'text!./conference-schedule.html','moment',
  'directives/date-picker',
  'ngDialog',
  'services/mongo-storage',
  './time-unit-row',
  './time-unit-row-header',
  './room-column',
  './scroll-grid'
], function(app, _, template,moment) {

  app.directive("conferenceSchedule", ['$timeout','$document','mongoStorage',
    function($timeout,$document,mongoStorage) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'day': '=',
          'startTime': '=',
          'endTime': '=',
          'search': '='
        },
        controller: function($scope,$element) {

            init();


            //============================================================
            //
            //============================================================
            this.resetSchedule = function() {

              initRowHeight();
              generateDays();
            }; //init

            //============================================================
            //
            //============================================================
            function init() {

              $scope.conferenceId = '';
              $scope.conference = '';
              $scope.conferences = [];
              $scope.changeConference = changeConference;
              $scope.rooms=[];

              $scope.startTime ='';//display
              $scope.endTime ='';//display
              $scope.startTimeObj='';
              $scope.endTimeObj='';

              $scope.changeDay=changeDay; // update times and effects on day change
              $scope.changeStartTime=changeStartTime;
              $scope.changeEndTime=changeEndTime;


              getConferences().then(function() {
                initDay();
                initDayTimeSelects();
                $scope.getRooms();
              });

              setStartTime();
              setEndTime();


              // visual effect only
              $timeout(function() {
                dateChangeEffect('end-time-filter');
                dateChangeEffect('start-time-filter');
                dateChangeEffect('day-filter');
                dateChangeEffect('search');
                dateChangeEffect('venue-select');
              }, 2500);
            } //init


            //============================================================
            //
            //============================================================
            function generateDays() {
              $scope.conferenceDays = [];
              var numDays = Math.floor((Number($scope.conference.end) - Number($scope.conference.start)) / (24 * 60 * 60));
              $scope.conference.endObj = moment.utc(Number($scope.conference.end)*1000).startOf('day');
              $scope.conference.startObj = moment.utc(Number($scope.conference.start)*1000).startOf('day');


              $scope.startDay = moment($scope.conference.startObj);
              $scope.endDay = moment($scope.conference.endObj);
              var date = moment($scope.conference.startObj);
              for (var i = 0; i <= numDays ; i++) {
                $scope.conferenceDays.push(moment(date));
                date.add(1,'day');
              }

            }//

            //============================================================
            //
            //============================================================
            function getConferences() {
              return mongoStorage.getConferences().then(function(confs) {
                $scope.conferences = confs.data;
                var lowestEnd = Math.round(new Date().getTime() / 1000);
                var chosenEnd = 0;
                var selectedKey = 0;
                //select the next confrence by default
                _.each($scope.conferences, function(meet, key) {
                  if (!chosenEnd) chosenEnd = meet.end;
                  if (meet.end > lowestEnd && meet.end <= chosenEnd) {
                    chosenEnd = meet.end;
                    selectedKey = key;
                  }
                });
                $scope.conference = $scope.conferences[selectedKey];
                $scope.conferences[selectedKey].selected = true;
                $scope.conferenceId=$scope.conference._id;
              });
            } //initMeeting




            //============================================================
            //
            //============================================================
            function initRowHeight() {
                    $document.ready(function(){
                      $timeout(function(){
                        var roomColumnEl;
                        roomColumnEl=$document.find('#room-col');
                        $scope.rowHeight=Math.floor(Number(roomColumnEl.height())/$scope.rooms.length);
                        if($scope.rowHeight<60)$scope.rowHeight=60;
                        _.each($scope.rooms,function(room){
                            room.rowHeight=$scope.rowHeight;
                        });
                      });
                    });
            }//initRooms
            //============================================================
            //
            //============================================================
            $scope.getRooms =function() {
                  return mongoStorage.getConferenceRooms($scope.conferenceId).then(function(res) {
                    $scope.rooms = res.data;
                  }).then(function(){
                            initRowHeight();
                            generateDays();
                  });
            };//initRooms
            //============================================================
            //
            //============================================================
            function changeConference() {

              $scope.conference = _.find($scope.conferences, {
                '_id': $scope.conferenceId
              });
              $scope.getRooms();

              $scope.conference.startObj=moment.utc($scope.conference.start*1000).startOf('day');
              $scope.conference.endObj=moment.utc($scope.conference.end*1000).startOf('day');
              $timeout(function(){
                $element.find('#day-filter').bootstrapMaterialDatePicker('setDate',moment.utc($scope.dayObj).startOf('day').hour(Number($scope.startTime.substring(0,2))));
                $scope.day=moment.utc($scope.dayObj).startOf('day').startOf('day').format('dddd YYYY-MM-DD');
              });


              $scope.dayObj = $scope.conference.startObj;

              dateChangeEffect('day-filter');
              dateChangeEffect('start-time-filter');
              dateChangeEffect('end-time-filter');
            } //changeVenue

            //============================================================
            //
            //============================================================
            function initDay() {
                  $scope.dayObj = moment.utc($scope.conference.start*1000).startOf('day');
            } //init

            //============================================================
            //
            //============================================================
            function dateChangeEffect(id) {
              var el =$element.find('#' + id);
              if(el.parent().hasClass('form-group')){
                  el.parent().addClass('is-focused');
                  $timeout(function() {
                    el.parent().removeClass('is-focused');
                  }, 2000);

              }else if(el.parent().parent().hasClass('form-group')){
                el.parent().parent().addClass('is-focused');
                $timeout(function() {
                  el.parent().parent().removeClass('is-focused');
                }, 2000);

              }
            } //init

            //============================================================
            //
            //============================================================
            $scope.nextDay = function () {
                  $scope.dayObj = $scope.dayObj.add(1,'day');

                  $timeout(function(){
                    $scope.dayObj = moment.utc($scope.dayObj);
                    $element.find('#day-filter').bootstrapMaterialDatePicker('setDate',$scope.dayObj);
                    $scope.day=moment.utc($scope.dayObj).startOf('day').startOf('day').format('dddd YYYY-MM-DD');
                  },100);
            }; //changeStartTime

            //============================================================
            //
            //============================================================
            $scope.prevDay = function () {
                  $scope.dayObj = $scope.dayObj.subtract(1,'day');

                  $timeout(function(){
                    $scope.dayObj = moment.utc($scope.dayObj);
                    $element.find('#day-filter').bootstrapMaterialDatePicker('setDate',$scope.dayObj);
                    $scope.day=moment.utc($scope.dayObj).startOf('day').startOf('day').format('dddd YYYY-MM-DD');
                  },100);
            }; //changeStartTime

            //============================================================
            //
            //============================================================
            function changeStartTime(id) {
              setStartTime();
              dateChangeEffect(id);
            } //changeStartTime

            //============================================================
            //
            //============================================================
            function changeEndTime(id) {
              setEndTime();
              dateChangeEffect(id);
            } //changeEndTime

            //============================================================
            //
            //============================================================
            function changeDay(id) {
              setDay();
              dateChangeEffect(id);
            } //changeEndTime

            //============================================================
            //
            //============================================================
            function initDayTimeSelects(){
                    $document.ready(function() {

                        $timeout(function(){

                          // $.material.init();
                          // $.material.input();
                          // $.material.ripples();

                          // $element.find('#day-filter').bootstrapMaterialDatePicker({
                          //   switchOnClick:true,
                          //   weekStart: 0,
                          //   time: false
                          // });

                          $element.find('#start-time-filter').bootstrapMaterialDatePicker({
                              time:true,
                              switchOnClick:true,
                              shortTime: false,
                              date: false,
                              format: 'hh:mm a'
                          });

                          $element.find('#end-time-filter').bootstrapMaterialDatePicker({
                            time:true,
                            switchOnClick:true,
                            shortTime: false,
                            date: false,
                            format: 'hh:mm a'
                          });

                          //$element.find('#day-filter').bootstrapMaterialDatePicker('setDate',moment($scope.dayObj).startOf('day').hour(8));
                          $scope.day=moment($scope.dayObj).startOf('day').format('dddd YYYY-MM-DD');


                          $element.find('#end-time-filter').bootstrapMaterialDatePicker('setDate',moment($scope.dayObj).startOf('day').hour(23));
                          $scope.endTime=moment($scope.dayObj).startOf('day').hour(23).format('hh:mm a');
                          setEndTime();

                          $element.find('#start-time-filter').bootstrapMaterialDatePicker('setDate',moment($scope.dayObj).startOf('day').hour(8));
                          $scope.startTime=moment($scope.dayObj).startOf('day').hour(8).format('hh:mm a');
                          setStartTime();

                        });
                    });
          }//initDayTimeSelects

          //============================================================
          //
          //============================================================
          function setStartTime() {
            if($scope.startTime)
            {
              var timeHours = Number($scope.startTime.substring(0,2));
              var timeMinutes = Number($scope.startTime.substring(3,5));
              var timeAMPM =    $scope.startTime.substring(6,8);
              if(timeAMPM==='pm' && timeHours!==12)timeHours+=12;

              if(timeAMPM==='am' && timeHours===12){
                $scope.startTimeObj=moment.duration({hours:0,minutes:timeMinutes,seconds:1});
                return;
              }
              $scope.startTimeObj=moment.duration({hours:timeHours,minutes:timeMinutes});
            }
          } //getStartTime

          //============================================================
          //
          //============================================================
          function setEndTime() {
            if($scope.endTime){
              var timeHours = Number($scope.endTime.substring(0,2));
              var timeMinutes = Number($scope.endTime.substring(3,5));
              var timeAMPM =    $scope.endTime.substring(6,8);
              if(timeAMPM==='pm' && timeHours!==12)timeHours+=12;
              if(timeAMPM==='am' && timeHours===12)timeHours=0;
              $scope.endTimeObj=moment.duration({hours:timeHours,minutes:timeMinutes});
            }
          } //getStartTime

          //============================================================
          //
          //============================================================
          function setDay() {
              $scope.dayObj=moment.utc($scope.day).startOf('day');
          } //getStartTime
          //============================================================
          //
          //============================================================
          $document.ready(function() {
            $.material.init();
            $.material.input();
            $.material.ripples();
          });

          } //controller
      }; //return
    }
  ]);
});