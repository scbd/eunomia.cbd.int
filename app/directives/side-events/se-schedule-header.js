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

                            $timeout(function(){
                              dateChangeEffect('end-filter');
                              dateChangeEffect('start-filter');
                            },550);
                        } //init

                        //============================================================
                        //
                        //============================================================
                        function isPrevDay() {
                            if(!moment($scope.startDate).subtract(7,'days').isSameOrAfter($scope.conference.startObj))
                              return true;
                            else
                              return false;
                        } //disPrevDay
                        $scope.isPrevDay=isPrevDay;

                        //============================================================
                        //
                        //============================================================
                        function isNextDay() {
                            if(! moment($scope.startDate).add(8,'days').isSameOrBefore($scope.conference.endObj))
                              return true;
                            else
                              return false;
                        } //disPrevDay
                        $scope.isNextDay=isNextDay;

                        //============================================================
                        //
                        //============================================================
                        function nextDay() {
                          $scope.startDate = moment.tz($scope.startDateFormat,'dddd Do MMM',$scope.conference.timezone).add(7,'days');
                          dateChangeEffect('start-filter');
                          $scope.endDate = moment.tz($scope.endDateFormat,'dddd Do MMM',$scope.conference.timezone).add(8,'days');
                          dateChangeEffect('end-filter');
                          ctrl.generateDays();
                        } //disPrevDay
                        $scope.nextDay=nextDay;
                        //============================================================
                        //
                        //============================================================
                        function prevDay() {
                          $scope.startDate = moment.tz($scope.startDateFormat,'dddd Do MMM',$scope.conference.timezone).subtract(7,'days');
                          dateChangeEffect('start-filter');
                          $scope.endDate = moment.tz($scope.endDateFormat,'dddd Do MMM',$scope.conference.timezone).subtract(5,'days');
                          dateChangeEffect('end-filter');
                          ctrl.generateDays();
                        } //disPrevDay
                        $scope.prevDay=prevDay;
                        //============================================================
                        //
                        //============================================================
                        function dateChangeEffect(id) {

                            $element.find('#' + id).parent().addClass('is-focused');

                            $timeout(function() {
                              $element.find('#' + id).parent().removeClass('is-focused');
                            }, 2000);
                        } //dateChangeEffect
                        //============================================================
                        //
                        //============================================================
                        $scope.dateChangeStart = function() {

                          // var startDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);
                          // var endDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);
                          $scope.startDate = moment($scope.startDateFormat,'dddd Do MMM').startOf();

                          dateChangeEffect('start-filter');
                          ctrl.generateDays();
                        }; //dateChangeStart

                        //============================================================
                        //
                        //============================================================
                        $scope.dateChangeEnd= function() {

                          // var startDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);
                          // var endDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);
                          $scope.endDate = moment($scope.endDateFormat,'dddd Do MMM').add(1,'day').startOf();
                          dateChangeEffect('end-filter');
                          ctrl.generateDays();
                        }; //dateChangeEnd

                        //============================================================
                        //
                        //============================================================
                        $scope.searchReservations = function() {
                            if (!$scope.search || $scope.searchsearchRes === ' '){
                              _.each($scope.bagScopes,function(bag){
                                  if(!bag.length) return;
                                    bag[0].searchFound=false;
                              });
                              return false;
                            }

                          _.each($scope.bagScopes,function(bag){
                              if(!bag.length) return;
                              var temp = JSON.stringify(bag[0]);
                              if(temp.toLowerCase().indexOf($scope.search.toLowerCase()) >= 0){
                                bag[0].searchFound=true;
                                return true;
                              }else{
                                bag[0].searchFound=false;
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

                      var numDays = moment.tz($scope.endDate,$scope.conference.timezone).diff($scope.startDate,'days');

                      if(numDays >7) numDays =7;

                      $scope.conferenceDays=[];
                       for (var i = 0; i < numDays; i++) {
                           var date = moment.tz($scope.startDate,$scope.conference.timezone).add(i,'days');
                           if(date.isoWeekday()<6 && date.isSameOrBefore($scope.conference.endObj))
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