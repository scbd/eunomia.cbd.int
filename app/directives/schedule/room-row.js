define(['app','lodash', 'text!./room-row.html','text!../forms/edit/room-dialog.html',
  'ngDialog',
  '../forms/edit/room',
], function(app,_, template,roomDialog) {

  app.directive("roomRow", ['ngDialog','mongoStorage','$rootScope',
    function(ngDialog,mongoStorage,$rootScope) {
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
            $scope.$watch('room.rowHeight',function(){
              if($scope.room.rowHeight)
                $element.css('height',$scope.room.rowHeight);
            });

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
                var dialog = ngDialog.open({
                  template: roomDialog,
                  className: 'ngdialog-theme-default',
                  closeByDocument: true,
                  plain: true,
                  scope: $scope
                });
                dialog.closePromise.then(function(ret) {
                      if (ret.value === 'save')  save($scope.editRoom).then(close);
                });
            };//$scope.roomDialog
            //============================================================
            //
            //============================================================
            function save (obj){
                return mongoStorage.save('venue-rooms', cleanDoc(obj),obj._id).then(function(){
                            $rootScope.$broadcast("showInfo","Room '"+obj.title+"' Successfully Updated.");
                }).catch(function(error){
                    console.log(error);
                    $rootScope.$broadcast("showError","There was an error saving your Room details: '"+obj.title+"' to the server.");
                });
            }//save

            //============================================================
            //
            //============================================================
            function cleanDoc(obj) {

              var objClone = _.clone(obj);
              delete(objClone.changed);
              delete(objClone.history);
              return objClone;
            } //triggerChanges
          } //link
      }; //return
    }
  ]);
});