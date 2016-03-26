
define(['app', 'lodash','moment', 'BM-date-picker',
'css!libs/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css',
'css!libs/angular-dragula/dist/dragula.css','css!./side-events.css',
'../services/mongo-storage'


], function(app, _,moment) {

  app.controller("events", ['$scope','$element','$document','dragulaService','mongoStorage',
    function($scope,$element,$document,dragulaService,mongoStorage) {

$scope.many2=['ssssss','aaaaaaa','bbbbbbbbb','ccccccc','dddddddddd','eeeeeeee'];
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
    initMeeting().then(function(){generateDays();}).then(function(){loadRooms();});
}//init

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
}//generateDays

//============================================================
//
//============================================================
function generateDays(){
  var meeting = _.findWhere($scope.options.confrences,{_id:$scope.meeting});
  var numDays = Math.round((Number(meeting.end)-Number(meeting.start))/(24*60*60));
  var seconds = Number(meeting.start);
  var date =moment.unix(seconds);

  for (var i = 1; i <= numDays+1; i++) {
        $scope.days.push({'date':seconds,'month':date.format("MMM").toUpperCase(),'day':date.format("DD"),'lunch':['0'],'afternoon':['0']});
        seconds = seconds + (24*60*60);
        date = moment.unix(seconds);
  }
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

$scope.initSingleBage = function (el){


}


//dragula test code
//$('#test').bootstrapMaterialDatePicker('setDate', moment());
dragulaService.options($scope, 'venue-bag', {
  moves: function (el, container, handle) {
    return handle.className === 'grabbible room-title ng-binding';
  }
});
$scope.$on('se-bag.drag', function (e, el,container) {
  //container.removeClass('grabbible');
  //el.addClass('gu-mirror');
console.log(container);
});

$scope.$on('se-bag.drop', function (e, el,container) {
  el.addClass('ex-moved');
  console.log(container);
});

$scope.$on('third-bag.over', function (e, el, container) {
  container.addClass('ex-test');

});

$scope.$on('third-bag.out', function (e, el, container) {
  container.removeClass('ex-test');
});
dragulaService.options($scope, 'third-bag', {
  removeOnSpill: true
});
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