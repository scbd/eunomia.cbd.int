define(['app', 'lodash','moment',
  'BM-date-picker',
  'ngDialog',
  '../../directives/schedule/conference-schedule'
], function(app, _,moment) {

  app.controller('conference',['$scope','$document','$element','scbdMenuService','$timeout',
    function($scope,$document,$element,scbdMenuService,$timeout) {

initDayTimeSelects();
      init();

      //============================================================
      //
      //============================================================
      function init() {
        $scope.toggle = scbdMenuService.toggle;

        $scope.startTime ='';//display
        $scope.endTime ='';//display
        $scope.startTimeObj='';
        $scope.endTimeObj='';
        $scope.search='';
        $scope.changeDate=changeDate; // update times and effects on day change
        $scope.changeStartTime=changeStartTime;
        $scope.changeEndTime=changeEndTime;

        // scheduleService.getDay().then(function(day){
        //     $scope.day=day;
        //     initDayTimeSelects();
        // });

setStartTime();
setEndTime();

        // visual effect only
        $timeout(function() {
          dateChangeEffect('end-time-filter');
          dateChangeEffect('start-time-filter');
          dateChangeEffect('day-filter');
          dateChangeEffect('search');
          dateChangeEffect('venue-select');
        }, 1000);
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
      }; //init
      //============================================================
      //
      //============================================================
      function changeDate(id) {
        // $scope.startTimeObj=getStartTime();
        // $scope.endTimeObj=getEndTime();
        dateChangeEffect(id);
      } //changeDate

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
      function setStartTime() {
          var timeHours = Number($scope.startTime.substring(0,2));
          var timeMinutes = Number($scope.startTime.substring(3,5));
          var timeAMPM =    $scope.startTime.substring(6,8);
          if(timeAMPM==='pm')timeHours+=12;
          $scope.startTimeObj=moment.duration({hours:timeHours,minutes:timeMinutes});
      } //getStartTime

      //============================================================
      //
      //============================================================
      function setEndTime() {
          var timeHours = Number($scope.endTime.substring(0,2));
          var timeMinutes = Number($scope.endTime.substring(3,5));
          var timeAMPM =    $scope.endTime.substring(6,8);
          if(timeAMPM==='pm')timeHours+=12;
          $scope.endTimeObj=moment.duration({hours:timeHours,minutes:timeMinutes});

      }; //getStartTime

      //============================================================
      //
      //============================================================
      function initDayTimeSelects(){
              $document.ready(function() {
                  $.material.init();
                  $.material.input();
                  $.material.ripples();

                  $element.find('#day-filter').bootstrapMaterialDatePicker({
                    weekStart: 0,
                    time: false
                  });

                  $element.find('#start-time-filter').bootstrapMaterialDatePicker({
                      time:true,
                      date: false,
                      shortTime: true,
                      format: 'hh:mm a'
                  });
                  $timeout(function(){$element.find('#start-time-filter').bootstrapMaterialDatePicker('setDate',moment($scope.day).startOf('day').hour(8));
                        $scope.startTime=moment($scope.day).startOf('day').hour(8).format('hh:mm a');
                        setStartTime();
                      //  console.log('$scope.startTimeObj',$scope.startTimeObj.format());
                  });
                  $element.find('#end-time-filter').bootstrapMaterialDatePicker({
                    time:true,
                    date: false,
                    shortTime: true,
                    format: 'hh:mm a'
                  });
                  $timeout(function(){$element.find('#end-time-filter').bootstrapMaterialDatePicker('setDate',moment($scope.day).startOf('day').hour(20));
                        $scope.endTime=moment($scope.day).startOf('day').hour(20).format('hh:mm a');
                        setEndTime();
                  });
              });
    }//initDayTimeSelects
  }]);
});