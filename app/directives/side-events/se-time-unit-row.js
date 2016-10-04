define(['app',
    'lodash',
    'text!./se-time-unit-row.html',
    'text!../forms/edit/reservation-dialog.html',
    'moment',
    'ngDialog',
    '../forms/edit/reservation',
    'css!libs/angular-dragula/dist/dragula.css',
    'filters/moment'
    // './grid-reservation'
], function(app, _, template, resDialog, moment) {

    app.directive("seTimeUnitRow", ['ngDialog', '$timeout', '$document', '$http', 'mongoStorage', '$rootScope', '$q',
        function(ngDialog, $timeout, $document, $http, mongoStorage, $rootScope, $q) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                require: ['^side-events'],
                link: function($scope, $element, $attr, schedule) {

                        $scope.schedule = schedule[0];

                        var timeUnit = 900.025; //15 minutes in seconds
                        var intervalDuration; // number on sub time intervals in a col, now a colomm is houw
                        intervalDuration = 3600 / timeUnit;
                        var initialized = false;
                        var allOrgs;

                          initTypes();

                        mongoStorage.loadOrgs().then(function(orgs) {
                            allOrgs = orgs;
                        });

                        // ============================================================
                        //
                        // ============================================================
                        $scope.$watch('conferenceDays', function() {
                          if(!_.isEmpty($scope.conferenceDays) && !$scope.room.initialized)
                            initTimeIntervals();
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('isOpen', function() {
                          initOuterGridWidth().then(function() {
                              calcColWidths();
                          });
                        });

                        //============================================================
                        //
                        //============================================================
                        $scope.$watch('room.rowHeight', function() {
                            if ($scope.room.rowHeight){
                                $element.css('height',$scope.room.rowHeight);
                                $scope.cellHeight = $scope.room.rowHeight;
                            }
                        });


                        //============================================================
                        //
                        //============================================================
                        function initTimeIntervals() {

                          initialized=true;

                          if(!_.isObject($scope.bagScopes))
                            $scope.bagScopes = {};

                          $scope.timezone=$scope.conference.timezone;

                          if ($scope.conferenceDays && !_.isEmpty($scope.conferenceDays)) {
                                $scope.firstDay = moment.tz($scope.conferenceDays[0],$scope.conference.timezone).startOf('day');
                                $scope.lastDay =moment.tz($scope.conferenceDays[$scope.conferenceDays.length-1],$scope.conference.timezone).startOf('day');

                                $scope.timeIntervals=[];
                                if($scope.conferenceDays && $scope.conferenceDays.length)
                                  $scope.conferenceDays.forEach(function(item){
                                    $scope.conference.seTiers.forEach(function(tier){
                                        var cell ={};
                                        cell.dayTier = moment.tz(item,$scope.conference.timezone).startOf('day').add(tier.seconds,'seconds');
                                        cell.id =$scope.room._id+cell.dayTier.format('YYYYMMDDTHHmm');
                                        cell.room = $scope.room;
                                        cell.drag = false;
                                        cell.bag=[];

                                        if(cell.dayTier.isoWeekday()<6)
                                            $scope.timeIntervals.push(cell);


                                        $scope.bagScopes[cell.id]=cell.bag;
                                    });
                                  });
                                $scope.room.timeIntervals = $scope.timeIntervals;

                                initOuterGridWidth().then(function() {
                                    calcColWidths();
                                    if(!$scope.slotElements)$scope.slotElements={};
                                    if(!$scope.slotElements[$scope.room._id])$scope.slotElements[$scope.room._id]=[];
                                    _.each($scope.bagScopes,function(v,k){

                                      var elId ='#'+k;
                                      var el =  $element.find(elId);
                                      $scope.slotElements[$scope.room._id].push(el);

                                    });

                                    $scope.getReservations();

                                });
                            }
                        } //initTimeIntervals

                        //=======================================================================
                        // import created by and modified by adta for admins
                        //=======================================================================
                        function injectUserData(docs) { //jshint ignore:line

                            if(!$scope.users) $scope.users=[];
                              _.each(docs, function(doc) {
                                 if(doc.sideEvent && doc.sideEvent.meta){
                                  $scope.users.push(doc.sideEvent.meta.createdBy);
                                  $scope.users.push(doc.sideEvent.meta.modifiedBy);
                                }
                              });

                            $scope.users=_.uniq($scope.users);

                            if(!_.isEmpty($scope.users))
                              return $http.get('/api/v2013/userinfos?query='+JSON.stringify({userIDs:$scope.users})).then(function(res){
                                  _.each(docs, function(doc) {
                                       if(!_.find(res.data,{userID:doc.sideEvent.meta.createdBy})) throw 'User not found : '+doc.sideEvent.meta.createdBy;
                                       doc.sideEvent.meta.createdByObj=_.find(res.data,{userID:doc.sideEvent.meta.createdBy});

                                       if(!_.find(res.data,{userID:doc.sideEvent.meta.modifiedBy})) throw 'User not found : '+doc.sideEvent.meta.modifiedBy;
                                       doc.sideEvent.meta.modifiedByObj=_.find(res.data,{userID:doc.sideEvent.meta.modifiedBy});
                                 });
                              });

                        } //importUserData


                        //============================================================
                        //
                        //============================================================
                        function initOuterGridWidth() {
                            var scrollGridEl;
                            var deferred = $q.defer();
                            var countInterval = 0;

                            var cancInterval = setInterval(function() {
                                $document.ready(function() {
                                    scrollGridEl = $document.find('#scroll-grid');
                                    $scope.outerGridWidth = Number(scrollGridEl.width() - 1);

                                    countInterval++;

                                    if ($scope.outerGridWidth && countInterval < 25) {
                                        clearInterval(cancInterval);
                                        deferred.resolve(scrollGridEl);
                                    } else {
                                        clearInterval(cancInterval);
                                        deferred.reject('time out');
                                    }
                                    if (countInterval > 24) {
                                        deferred.reject('time out');
                                        clearInterval(cancInterval);
                                    }
                                });
                            }, 100);

                            return deferred.promise;
                        } //initOuterGridWidth

                        //============================================================
                        //
                        //============================================================
                        function initIntervalWidth() {
                            $element.css('width',$scope.outerGridWidth);
                        } //initDayWidth

                        //============================================================
                        //
                        //============================================================
                        function calcColWidths() {
                            $scope.colWidth = Number($scope.outerGridWidth) / Number($scope.timeIntervals.length);
                            initIntervalWidth();
                        } //init
                        var inProgress = false;

                        //============================================================
                        //
                        //============================================================
                        function initTypes() {
                            if(_.isEmpty($scope.options.types)) return $q(function(resolve){resolve(true);});
                            return mongoStorage.loadTypes('reservations').then(function(result) {
                                if(!$scope.options)$scope.options={};
                                $scope.options.types = result;
                            });
                        } //initTypes()

                        //============================================================
                        //
                        //============================================================
                        $scope.getReservations = function () {

                            if (!_.isEmpty($scope.conferenceDays) && !inProgress) {

                                inProgress = true;
                                var start = moment($scope.conferenceDays[0]).startOf('day');
                                var end = moment($scope.conferenceDays[$scope.conferenceDays.length - 1]).endOf('day');
                                var reservations = [];
                                mongoStorage.getReservations(start, end, {
                                    room: $scope.room._id
                                },'570fd0a52e3fa5cfa61d90ee').then(
                                    function(responce) {
                                      //injectUserData(responce.data);
                                      reservations = responce.data;
                                        initTypes().then(function() {

                                            _.each(reservations, function(res) {
                                                embedTypeInRes(res);
                                                embedOrgsSideEvent(res);
                                                loadReservationsInRow(res);
                                                addModels(reservations);
                                            });

                                        });
                                        inProgress = false;
                                    }
                                ); // mongoStorage.getReservations
                            } // if
                        }; // getReservations

                        //============================================================
                        //
                        //============================================================
                        function addModels(reservations) {
                            if (!$scope.seModels) $scope.seModels = [];
                            _.each(reservations, function(se) {
                              $scope.seModels.push(se);
                            });

                        } //loadReservationInRow
                        //============================================================
                        //
                        //============================================================
                        function loadReservationsInRow(res) {

                            for (var i = 0; i < $scope.timeIntervals.length; i++) {

                                    var interval = $scope.timeIntervals[i];
                                    if (isResInTimeInterval(interval.dayTier, res))
                                        interval.bag.push(res);
                                    // else if (!_.isEmpty(interval.res) && isResDeleted(interval.res))
                                    //     delete(interval.res);

                            } //for
                        } //loadReservationInRow

                        //============================================================
                        //
                        //============================================================
                        function isResInTimeInterval(timeInterval, res) {
                            return  moment.tz(res.start,$scope.conference.timezone).isSameOrAfter(timeInterval) &&
                                    moment.tz(res.start,$scope.conference.timezone).isBefore(moment.tz(timeInterval,$scope.conference.timezone).add(45,'minutes'));

                        } //isResInInterval


                        //============================================================
                        //
                        //===========================================================
                        function embedOrgsSideEvent(res) {
                            if (res.sideEvent && _.isEmpty(res.sideEvent.orgs)) {
                                res.sideEvent.orgs = [];
                                _.each(res.sideEvent.hostOrgs, function(org) {
                                    res.sideEvent.orgs.push(_.find(allOrgs, {
                                        '_id': org
                                    }));
                                });
                            }
                        } //embedOrgsSideEvent

                        //============================================================
                        //
                        //===========================================================
                        function embedTypeInRes(res) {
                            var typeFound = _.find($scope.options.types, {
                                '_id': res.type
                            });
                            var subFound = _.find($scope.options.types, {
                                '_id': res.subType
                            });
                            if (typeFound) {
                                res.typeObj = typeFound;
                            }
                            if (subFound ) {
                                res.subTypeObj = subFound;
                            }
                        } //embedTypeInRes

                    }, //link


            }; //return
        }
    ]);
});