define(['app', 'lodash', 'text!./se-schedule-header.html',
    'directives/date-picker',
], function(app, _, template) {

    app.directive("seScheduleHeader", [
        function() {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                require:'seScheduleHeader',
                scope: {
                    'bagScopes': '=',
                    'conference':'=',
                    'conferenceDays':'=',
                    'rooms':'='
                },
                link: function($scope, $element,$attr,ctrl) {


                        $scope.searchReservations = function() {
                            if (!$scope.search || $scope.searchsearchRes === ' '){
                              _.each($scope.rooms,function(room){
                                room.hideRoomSearch='-1';
                              });
                              _.each($scope.bagScopes,function(bag){
                                  if(!bag.length) return;
                                    bag[0].searchFound=false;
                                    bag[0].hide=false;
                              });
                              return false;
                            }

                            _.each($scope.rooms,function(room){
                              room.hideRoomSearch = 0;
                            });

                          _.each($scope.bagScopes,function(bag){
                              if(!bag.length) return;
                              var temp = JSON.stringify(bag[0]);
                              if(temp.toLowerCase().indexOf($scope.search.toLowerCase()) >= 0){
                                bag[0].searchFound=true;
                                var r = _.find($scope.rooms,{'_id':bag[0].location.room});
                                r.hideRoomSearch=1;
                                return true;
                              }else{
                                bag[0].searchFound=false;
                                bag[0].hide=true;
                                return true;
                              }
                          });
                        }; 

                        $scope.countReservations = () => {
                          let count = 0;

                          for (const bag in $scope.bagScopes)
                            if($scope.bagScopes[bag].length) count++;
                          
                          return count;
                        };
                },
                controller: function($scope) {


                }
        };//return
    }]);//directive
});//require