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
        link: function($scope) {

            $scope.room.reqCode = getCode($scope.room);
            
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

            function getCode(room){
              let code ='';

              if(room.hybrid) code += 'H';
              if(room.interpretationRemote) code += 'R';
              if(room.interpretationOnSite) code += 'O';
              if(room.interpretationBooths) code += `${room.interpretationBooths}`;

              return code? `${code}`:'';
            }
          } //link
      }; //return
    }
  ]);
});