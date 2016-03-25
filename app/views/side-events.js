
define(['app', 'lodash', 'BM-date-picker',
'css!libs/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css',
'css!libs/angular-dragula/dist/dragula.css','css!./side-events.css'


], function(app, _) {

  app.controller("events", ['$scope','$element','$document','dragulaService',
    function($scope,$element,$document,dragulaService) {

$scope.many2=['ssssss','aaaaaaa','bbbbbbbbb','ccccccc','dddddddddd','eeeeeeee'];
// $scope.startFilter=0;
// $scope.endFilter=0;

$scope.rooms=[];
$scope.days=[];





//dragula test code
//$('#test').bootstrapMaterialDatePicker('setDate', moment());
$scope.$on('third-bag.drag', function (e, el) {
  el.removeClass('ex-moved');

});

$scope.$on('third-bag.drop', function (e, el) {
  el.addClass('ex-moved');
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