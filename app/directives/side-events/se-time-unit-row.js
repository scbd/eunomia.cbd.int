define(['app',
    'lodash',
    'text!./se-time-unit-row.html',
    'moment',
    '../forms/edit/reservation',
    'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css',
    'filters/moment',
    './se-grid-reservation',
], function(app, _, template,  moment) {

    app.directive("seTimeUnitRow", [
        function( ) {
            return {
                restrict  : 'E'             ,
                template  : template        ,
                replace   : true            ,
                transclude: false           ,
                require   : ['^side-events'],

                link: function($scope, $element) {

                        var timeUnit = 900.025; //15 minutes in seconds
                        var intervalDuration; // number on sub time intervals in a col, now a colomm is houw
                        intervalDuration = 3600 / timeUnit;
                        var initialized = false;

                        const { tz } = $scope.conference.timeObjects

                        $scope.tz = tz;

                        initTimeIntervals()

                        async function initTimeIntervals() {

                          initialized=true;

                          const { tz, days, startDate, endDate, sideEventTimeIntervals } = $scope.conference.timeObjects

                          if(!_.isObject($scope.bagScopes)) $scope.bagScopes = {};

                          $scope.timezone = tz;

                          if(!days || !days.length) return 


                          $scope.firstDay = startDate;
                          $scope.lastDay  = endDate;

                          $scope.timeIntervals=[];


                          for (const tierDatTime of sideEventTimeIntervals) {
                            const { room } = $scope
                            const dayTier  = tierDatTime
                            const id       = `${room._id}${tierDatTime.format('YYYYMMDDTHHmm')}`
                            const drag     = false
                            const bag      = []
                            const cell     = { dayTier, id, drag, room, bag }

                            $scope.timeIntervals.push(cell);
                            $scope.bagScopes[cell.id] = cell.bag;
                          }

                          $scope.room.timeIntervals = $scope.timeIntervals;


                          const killW = $scope.$watch('reservations', function() {

                            if(_.isEmpty($scope.reservations)) return

                            if(!$scope.slotElements)$scope.slotElements = {};
                            if(!$scope.slotElements[$scope.room._id]) $scope.slotElements[$scope.room._id] = [];

                            $scope.getReservations();
                            killW();
                          });



                        } //initTimeIntervals


                        $scope.getReservations = function () {
                              _.each($scope.collisions[$scope.room._id], function(res) {
                                embedTypeInRes(res);
                                loadCollisions(res);
                            });

                              _.each($scope.reservations[$scope.room._id], function(res) {
                                embedTypeInRes(res);
                                loadReservationsInRow(res);
                              });

                        }; // getReservations


                        function loadReservationsInRow(res) {

                            for (var i = 0; i < $scope.timeIntervals.length; i++) {

                                    var interval = $scope.timeIntervals[i];

                                    if (isResInTimeInterval(interval.dayTier, res))
                                        interval.bag.push(res);


                            } //for
                        } //loadReservationInRow

                        
                        function loadCollisions(res) {

                            for (var i = 0; i < $scope.timeIntervals.length; i++) {

                                    var interval = $scope.timeIntervals[i];

                                  if (isblockedTimeInterval(interval.dayTier, res)){
                                        if(res.subType)
                                          interval.bag.push(res);
                                        else
                                          $scope.timeIntervals[i].collision=true;

                                    }
                            } //for
                        } //loadReservationInRow


                        function isblockedTimeInterval(timeInterval, res) {
                            return  ((moment.tz(res.start,tz).isSameOrAfter(timeInterval) &&
                                    moment.tz(res.start,tz).isBefore(moment.tz(timeInterval,tz).add(90,'minutes'))) ||

                                    (moment.tz(res.end,tz).isSameOrAfter(timeInterval) &&
                                            moment.tz(res.end,tz).isBefore(moment.tz(timeInterval,tz).add(90,'minutes')))||

                                    (moment.tz(res.start,tz).isBefore(timeInterval) &&
                                            moment.tz(res.end,tz).isAfter(moment.tz(timeInterval,tz).add(90,'minutes')))
                                  );

                        } //isResInInterval


                        function isResInTimeInterval(timeInterval, res) {
                            return  moment.tz(res.start,tz).isSameOrAfter(timeInterval) &&
                                    moment.tz(res.start,tz).isBefore(moment.tz(timeInterval,tz).add(90,'minutes'));

                        } //isResInInterval


                        var typeFound;
                        function embedTypeInRes(res) {

                          if(!typeFound)
                            typeFound = _.find($scope.options.types, {
                                '_id': res.type
                            });
                          if(!typeFound) return;

                            if(typeFound && typeFound.children)
                            var subFound = _.find(typeFound.children, {
                                '_id': res.subType
                            });

                            if (subFound ) {
                                res.subTypeObj = subFound;
                            }
                        } //embedTypeInRes

                    }, //link


            }; //return
        }
    ]);
});