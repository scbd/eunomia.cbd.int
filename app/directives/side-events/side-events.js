define(['app', 'lodash', 'text!./side-events.html', 'moment',
    'directives/date-picker',
    'ngDialog',
    'services/mongo-storage',
    './se-time-unit-row',
    './tier-row-header',
    './se-room-row',
    'css!libs/angular-dragula/dist/dragula.css',
], function(app, _, template, moment) {

    app.directive("sideEvents", ['$timeout', '$document', 'mongoStorage','$rootScope','$q','dragulaService',
        function($timeout, $document, mongoStorage,$rootScope,$q,dragulaService) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                require:'sideEvents',
                link: function($scope, $element,$attr,ctrl) {

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('conference',function(){
                            if($scope.conference)
                              changeConference();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$parent.$on('all-rooms-bag.drop-model', function() {
                              $timeout(moveRoom,1000);
                        });

                        init();

                        //============================================================
                        //
                        //============================================================
                        function init() {
                              $scope.rooms = [];
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function moveRoom() {
                            var allP=[];
                            if(!_.isEmpty($scope.rooms)){
                                _.each( $scope.rooms,function(item,index){
                                  item.sort=index;
                                  allP.push(mongoStorage.save('venue-rooms',{'_id':item._id,'sort':item.sort,'venue':item.venue}));
                                });
                            }
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function changeConference() {

                            getRooms();

                            $scope.conference.endObj = moment.tz($scope.conference.EndDate,$scope.conference.timezone).add(1,'day').startOf('day');
                            $scope.conference.startObj = moment.tz($scope.conference.StartDate,$scope.conference.timezone).startOf('day');
                        } //changeConference

                        //============================================================
                        //
                        //============================================================
                        function getRooms() {

                            return mongoStorage.getConferenceRooms($scope.conference._id).then(function(res) {
                                $scope.rooms = res.data;
                                // $scope.rooms=[];
                                // res.data.forEach(function(r){
                                //   if(r.isSideEvent)
                                //     $scope.rooms.push(r);
                                // });
                            }).then(function() {
                                ctrl.initRowHeight();
                            });
                        } //getRooms

                        //============================================================
                        //
                        //============================================================
                        dragulaService.options($scope, 'rooms-bag', {
                          moves: function(el, container, handle) {
                            return handle.className === 'grabbible room-title ng-binding';
                          },

                        });// rooms-bag

                        //============================================================
                        //
                        //============================================================
                        $scope.$on('rooms-bag.drop-model', function(el, target) {
                          target.parent().children().each(function() {
                            var room = _.find($scope.options.rooms, {
                              '_id': $(this).attr('id')
                            });
                            room.sort = $(this).index();
                            var roomClone = _.cloneDeep(room);

                            return mongoStorage.save('venue-rooms', roomClone, roomClone._id).catch(function() {
                              $rootScope.$broadcast("showError", "There was an error updating the server with the room order.");
                            });
                          });
                          $rootScope.$broadcast("showInfo", "Room Sort Order Successfully Updated.");
                        });// rooms-bag.drop-model

                        //============================================================
                        // Search function, search side events will result in color change
                        //============================================================
                        $scope.searchSe = function(se) {

                          if (!$scope.search || $scope.search == ' ') return true;
                          var temp = JSON.stringify(se);
                          return (temp.toLowerCase().indexOf($scope.search.toLowerCase()) >= 0);
                        }; // searchSe

                    }, //link
                    controller: function($scope) {

                      //============================================================
                      // used by child dir, timeRow
                      //============================================================
                      this.resetSchedule = function() {

                          this.initRowHeight();
                          this.generateDays();
                      }; //this.resetSchedule

                      //============================================================
                      //
                      //============================================================
                      this.initRowHeight = function() {

                          $document.ready(function() {
                              $timeout(function() {
                                  var roomColumnEl;
                                  roomColumnEl = $document.find('#room-col');
                                  $scope.rowHeight = Math.floor(Number(roomColumnEl.height()) / $scope.rooms.length);
                                  if ($scope.rowHeight < 60) $scope.rowHeight = 60;
                                  _.each($scope.rooms, function(room) {
                                      room.rowHeight = $scope.rowHeight;
                                  });
                              });
                          });
                      }; //this.initRowHeight
            } //return
        };
    }]);
});