define(['app', 'text!./se-room-row.html','text!../forms/edit/room-dialog.html',
  'ngDialog',
  '../forms/edit/room',
], function(app, template,roomDialog) {

  app.directive("seRoomRow", ['ngDialog',
    function(ngDialog) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'room': '=',
          'index':'='
        },
        link: function($scope,$element) {

            //============================================================
            //
            //============================================================
            // $scope.$watch('room.rowHeight',function(){
            //   if($scope.room.rowHeight)
            //     $element.css('height',$scope.room.rowHeight);
            // });

            //============================================================
            //
            //============================================================
            $scope.$watch('index',function(){
              if($scope.index)
                $scope.room.sort=$scope.index;
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

            //============================================================
            //
            //============================================================
            $scope.shape = function(id) {
              //  console.log($scope.room);
            };//$scope.roomDialog

          } //link
      }; //return
    }
  ]);
});