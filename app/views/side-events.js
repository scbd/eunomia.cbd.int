
define(['app', 'lodash','moment', 'BM-date-picker',
'css!libs/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css',
'css!libs/angular-dragula/dist/dragula.css','css!./side-events.css',
'../services/mongo-storage'


], function(app, _,moment) {

  app.controller("events", ['$scope','$element','$document','dragulaService','mongoStorage','$timeout','$rootScope',
    function($scope,$element,$document,dragulaService,mongoStorage,$timeout,$rootScope) {


// $scope.startFilter=0;
// $scope.endFilter=0;

$scope.rooms=[];
$scope.days=[];
$scope.meeting=0;
init();

//============================================================
//
//============================================================
function init(){
    $scope.options={};
    initMeeting().then(function(){generateDays();}).then(function(){loadRooms();}).then(function(){initSideEvents($scope.meeting);});

}//init
//============================================================
//
//============================================================
$scope.changeMeeting= function(){
    generateDays();
    loadRooms().then(function(){initSideEvents($scope.meeting);});

};//init

//============================================================
//
//============================================================
function dateChangeEffect (id){
    $element.find('#'+id).parent().addClass('is-focused');

    $timeout(function(){
      $element.find('#'+id).parent().removeClass('is-focused');
    },2000);
};//init

//============================================================
//
//============================================================
$scope.dateChange= function(id){
    var dayTS;
    var startDatTS = moment($scope.startDate).unix();
    var endDatTS = moment($scope.endDate).unix();

    if(id==='start-filter'){
        $element.find('#end-filter').bootstrapMaterialDatePicker('setMinDate', $scope.startDate);
          _.each($scope.days,function(day,key){
                dayTS = moment(day.date).unix();
                if(dayTS < startDatTS){
                    day.selected=false;
                    _.each($scope.options.rooms,function(room){
                        room.bookings[key].selected=false;
                    });
                }else {
                   day.selected=true;
                   _.each($scope.options.rooms,function(room){
                       room.bookings[key].selected=true;
                   });
                }
          });
    }
    if(id==='end-filter'){
        $element.find('#start-filter').bootstrapMaterialDatePicker('setMaxDate', $scope.endDate);
          _.each($scope.days,function(day,key){
                dayTS = moment(day.date).unix();
                if(dayTS > endDatTS || dayTS < startDatTS){
                    day.selected=false;
                    _.each($scope.options.rooms,function(room){
                        room.bookings[key].selected=false;
                    });
                }else {
                   day.selected=true;
                   _.each($scope.options.rooms,function(room){
                       room.bookings[key].selected=true;
                   });
                }
          });
    }
    dateChangeEffect(id);
};//init
//============================================================
//
//============================================================
function initSideEvents(meeting){
    return mongoStorage.loadUnscheduledSideEvents (meeting).then(function(res){
      $scope.sideEvents= res.data;

    }).then(
          function(){
        _.each($scope.sideEvents,function(res){
            mongoStorage.loadDoc('inde-side-events',res.link._id).then(
              function(se){
                res.sideEvent=se;

                res.sideEvent.orgs = [];
                _.each(res.sideEvent.hostOrgs, function(org) {
                  mongoStorage.loadDoc('inde-orgs', org).then(function(conf) {
                    res.sideEvent.orgs.push(conf);
                  });
                    });
              }
            );//load doc
        });// each
      }
    );//.then(function(){console.log($scope.sideEvents)})
}//initMeeting

//============================================================
//
//============================================================
function initMeeting(){
    return mongoStorage.loadConfrences ().then(function(confs){
      $scope.options.confrences=confs.data;
      var lowestEnd = Math.round(new Date().getTime()/1000);
      var chosenEnd = 0;
      var selectedKey=0;
      _.each($scope.options.confrences, function(meet,key){
            var date = moment.unix(meet.end);
            if(!chosenEnd)chosenEnd=meet.end;
            if(meet.end > lowestEnd && meet.end <= chosenEnd){
                chosenEnd = meet.end;
                selectedKey=key;
            }
      });
      $scope.options.confrences[selectedKey].selected=true;
      $scope.meeting=$scope.options.confrences[selectedKey]._id;
    });
}//initMeeting

//============================================================
//
//============================================================
function generateDays(){
  $scope.days=[];
  var meeting = _.findWhere($scope.options.confrences,{_id:$scope.meeting});


  var numDays = Math.round((Number(meeting.end)-Number(meeting.start))/(24*60*60));
  var seconds = Number(meeting.start);
  var date =moment.unix(seconds);
  console.log('meeting start',moment.unix(meeting.start).format("MMM DD"));
  console.log('meeting end',moment.unix(meeting.end).format("MMM DD"));

  $element.find('#start-filter').bootstrapMaterialDatePicker('setDate', date);
  $element.find('#start-filter').bootstrapMaterialDatePicker('setMinDate', date);
  $element.find('#end-filter').bootstrapMaterialDatePicker('setMinDate', date);
  for (var i = 1; i <= numDays+1; i++) {
        if(i===numDays+1){
            $element.find('#end-filter').bootstrapMaterialDatePicker('setMaxDate', date);
            $element.find('#start-filter').bootstrapMaterialDatePicker('setMaxDate', date);
            $element.find('#end-filter').bootstrapMaterialDatePicker('setDate', date);
        }

        $scope.days.push({'selected':true,'date':date.format("YYYY-MM-DD"),'month':date.format("MMM").toUpperCase(),'day':date.format("DD"),'lunch':[],'afternoon':[{'title':'sssssss'}]});
        seconds = seconds + (24*60*60);
        date = moment.unix(seconds);
  }
  $timeout(function(){
    dateChangeEffect('start-filter');
    dateChangeEffect('end-filter');
  },1500);

}//generateDays

//============================================================
//
//============================================================
function loadRooms(){
  var meeting = _.findWhere($scope.options.confrences,{_id:$scope.meeting});
  return mongoStorage.loadRooms(meeting.venue).then(function(rooms){
    $scope.options.rooms=rooms;
    _.each($scope.options.rooms,function(room){
      room.bookings=_.cloneDeep($scope.days);
    });
  });

}//generateDays

$scope.initSingleBag = function (el){


}

dragulaService.options($scope, 'se-bag', {
  mirrorAnchor: 'bottom'
});
//dragula test code
//$('#test').bootstrapMaterialDatePicker('setDate', moment());
dragulaService.options($scope, 'venue-bag', {
  moves: function (el, container, handle) {
    return handle.className === 'grabbible room-title ng-binding';
  },

});
$scope.$on('se-bag.drag', function (e, el,container) {
  //container.removeClass('grabbible');
  //el.addClass('gu-mirror');
//   var test =angular.element("<div>test</div>")
//   el=test;
// console.log(el);
});
$scope.$on('se-bag.cloned', function (e, mirror,shadow) {

mirror.children('div.panel.panel-default.se-panel').hide();
mirror.children('div.drag-view.text-center').show();
shadow.children('div.panel.panel-default.se-panel').hide();
shadow.children('div.drag-view.text-center').show();

mirror.height(20);
mirror.width(80);
shadow.height(20);
shadow.width(80);

});
$scope.$on('se-bag.shadow', function (e, el, container,source) {

    if( container[0].id==='unscheduled-side-events'){
      el.children('div.panel.panel-default.se-panel').show();
      el.children('div.drag-view.text-center').hide();
      el.height(185);
      el.width(260);
    }else{
      el.children('div.panel.panel-default.se-panel').hide();
      el.children('div.drag-view.text-center').show();
      el.height(20);
      el.width(80);
    }

});
$scope.$on('se-bag.drop', function (e, el,container) {
  //if source revert container
  //el.addClass('ex-moved');
 $rootScope.$broadcast("showInfo","Test info Title", "Test info message");
 // $rootScope.$broadcast("showWarning","Test warning title", "Test warning message");
 // $rootScope.$broadcast("showSuccess","Test info Title", "Test info message");
 // $rootScope.$broadcast("showError","Test warning title", "Test warning message");
});
//
 $scope.$on('se-bag.over', function (e, el, container) {


 });
 $scope.$on('se-bag.drop-model', function (el, target, source) {


 });
// $scope.$on('third-bag.out', function (e, el, container) {
//   container.removeClass('ex-test');
// });

$document.ready(function(){
  $.material.init();
  $.material.input();
  $.material.ripples();
  $element.find('#end-filter').bootstrapMaterialDatePicker({ weekStart : 0, time: false });
  $element.find('#start-filter').bootstrapMaterialDatePicker({ weekStart : 0, time: false });
});
    }
  ]);
});