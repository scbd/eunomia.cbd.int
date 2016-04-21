define(['app', 'lodash', 'text!./room-row.html','text!../forms/edit/room-dialog.html','css!./room-row.css',
  'ngDialog',
  '../forms/edit/room',
], function(app, _, template,roomDialog) {

  app.directive("roomRow", ['ngDialog',
    function(ngDialog) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'room': '='
        },
        controller: function($scope,$element) {

            $scope.$watch('room.rowHeight',function(){
              if($scope.room.rowHeight){
                $element.height($scope.room.rowHeight);
              }
            });

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

          } //link
      }; //return
    }
  ]);
});