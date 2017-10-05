define(['app', 'lodash', 'text!./se-schedule-header.html', 'moment',
    'directives/date-picker',
], function(app, _, template, moment) {

    app.directive("seScheduleHeader", ['$timeout', '$document', 'mongoStorage','$rootScope','$q',
        function($timeout, $document, mongoStorage,$rootScope,$q) {
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

                        init();

                        //============================================================
                        //
                        //============================================================
                        function init() {
                            $scope.startDate = $scope.conference.startObj = moment.tz($scope.conference.StartDate,$scope.conference.timezone).startOf();
                            $scope.endDate = $scope.conference.endObj = moment.tz($scope.conference.EndDate,$scope.conference.timezone).startOf();

                            ctrl.generateDays();
                        } //init


                        //============================================================
                        //
                        //============================================================
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
                              room.hideRoomSearch=0;
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
                        }; //searchReservations

                        //============================================================
                        //
                        //============================================================
                        $scope.countReservations = function() {
                          var count =0;
                          _.each($scope.bagScopes,function(bag){
                              if(!bag.length) return;
                              count++;
                          });
                          return count;
                        }; //searchReservations
                }, //link
                controller: function($scope) {

                    //============================================================
                    //
                    //============================================================
                    function generateDays() {

                      var numDays = moment($scope.endDate).diff($scope.startDate,'days')+2;


                      $scope.conferenceDays=[];
                       for (var i = 0; i < numDays; i++) {
                           var date = moment.tz($scope.startDate,$scope.conference.timezone).add(i,'days');
                           //if(date.isSameOrBefore($scope.conference.endObj))
                              $scope.conferenceDays.push(date);
                       }

                      $scope.startDate = moment.tz($scope.conferenceDays[0],$scope.conference.timezone);
                      $scope.endDate = moment.tz($scope.conferenceDays[$scope.conferenceDays.length-1],$scope.conference.timezone);
                      $scope.startDateFormat = moment.tz($scope.conferenceDays[0],$scope.conference.timezone).format('dddd Do MMM');
                      $scope.endDateFormat = moment.tz($scope.conferenceDays[$scope.conferenceDays.length-1],$scope.conference.timezone).format('dddd Do MMM');
                    } //dateChangeEffect
                    this.generateDays=generateDays;





                }, //link
        };//return
    }]);//directive
});//require