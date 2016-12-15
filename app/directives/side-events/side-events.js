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
                        //============================================================
                        //
                        //============================================================
                        $scope.$on('se-bag.over', function(e, el, target,source) {

                          if(target.attr('id')!==source.attr('id') && target !=='unscheduled-side-events'){
                              el.find('#res-panel').hide();
                              el.find('#res-id-shadow').show();
                              el.find('#res-id-shadow').css('background-color','yellow');
                          }
                          if(target.attr('id') ==='unscheduled-side-events' ){
                            el.find('#res-panel').show();
                            el.find('#res-id-shadow').hide();
                            el.find('#res-id-shadow').css('background-color','none');
                          }

                        });
                        init();

                        //============================================================
                        //
                        //============================================================
                        function init() {
                              $scope.rooms = [];
                              $scope.colWidth=0;
                              $scope.loading ={};
                              $scope.collisions={};
                              $scope.loading.rooms=false;
                              $scope.loading.types=false;
                              $scope.loading.reservations=true;
                              initTypes();
                        } //init
                        //============================================================
                        //
                        //============================================================
                        function initTypes() {
                            if(!_.isEmpty($scope.options.types)) return $q(function(resolve){resolve(true);});
                            return $scope.options.typesProm = mongoStorage.loadTypes('reservations').then(function(result) {
                                if(!$scope.options)$scope.options={};
                                $scope.options.types = result;
                            });
                        } //initTypes()

                        //============================================================
                        //
                        //============================================================
                        function initRoomTypes() {
                            if(!_.isEmpty($scope.options.roomTypes)) return $q(function(resolve){resolve(true);});
                            return mongoStorage.loadTypes('venue-rooms').then(function(result) {
                                if(!$scope.options)$scope.options={};
                                $scope.options.roomTypes = result;

                            });
                        } //initTypes()
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

                            $q.all([getRooms(),initTypes(),initRoomTypes()]).then(function(){
                              getReservations();
                            });

                            $scope.conference.endObj = moment.tz($scope.conference.EndDate,$scope.conference.timezone).add(1,'day').startOf('day');
                            $scope.conference.startObj = moment.tz($scope.conference.StartDate,$scope.conference.timezone).startOf('day');
                        } //changeConference

                        //============================================================
                        //
                        //============================================================
                        function getRooms() {
                            $scope.loading.rooms=true;
                            return $q.when(initRoomTypes()).then(function(){return mongoStorage.getConferenceRooms($scope.conference._id).then(function(res) {
                                $scope.rooms = res.data;
                                $scope.rooms.forEach(function(r){
                                    var typeObj = _.find($scope.options.roomTypes,{'_id':r.type});
                                    r.typeObj=typeObj;
                                    r.hideRoomSearch='-1';
                                });
                            }).then(function() {
                                ctrl.initRowHeight();
                                $scope.loading.rooms=false;
                            });
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

                        function collisionQuery(roomIds){

                            $scope.collisions={};
                             _.each($scope.conferenceDays,function(day){
                                    var or =[];
                                    $scope.conference.seTiers.forEach(function(tier){
                                        var end;
                                        var start = moment.utc(moment.tz(day,$scope.conference.timezone).startOf('day')).add(tier.seconds,'seconds');
                                        if(moment(start).format('HH')==='13')
                                            end = moment.utc(moment.tz(day,$scope.conference.timezone).startOf('day')).add(tier.seconds,'seconds').add(90,'minutes');
                                        else
                                            end = moment.utc(moment.tz(day,$scope.conference.timezone).startOf('day')).add(tier.seconds,'seconds').add(75,'minutes');

                                        or.push(
                                          {'$and' :[
                                            {start :{'$gte':{'$date':start.format()}}},
                                            {start :{'$lt':{'$date':end.format()}}}
                                          ]});
                                        or.push(
                                            {'$and' :[
                                              {end  :{'$gte':{'$date':start.format()}}},
                                              {end  :{'$lt':{'$date':end.format()}}},
                                            ]});
                                        or.push(
                                            {'$and' :[
                                              {start  :{'$lt':{'$date':start.format()}}},
                                              {end  :{'$gte':{'$date':end.format()}}},
                                            ]});

                                    });


                                var f = {start:1,end:1,location:1,subType:1,type:1};
                                var sort ={'start':-1};
                                var q={
                                  'location.room':{'$in':roomIds},
                                  'location.conference':$scope.conference._id,
                                  'sideEvent':{'$exists':false},
                                  'meta.status': {
                                      $nin: ['archived', 'deleted']
                                  },
                                   '$or':or
                                };
                                mongoStorage.loadDocs('reservations',q, 0,1000000,false,sort,f).then(
                                    function(responce) {

                                          _.each($scope.rooms,function(r){
                                              if(!$scope.collisions[r._id])$scope.collisions[r._id]=[];

                                            _.each(responce.data,function(res){
                                                if(res.location.room===r._id)
                                                  $scope.collisions[r._id].push(res);
                                            });

                                        });

                                    return $scope.collisions;
                                    }
                                );
                             });
                        }
                        //============================================================
                        //
                        //============================================================
                      function getReservations() {
                          var roomIds=[];

                          $scope.loading.reservations=true;
                          _.each($scope.rooms,function(r){
                              roomIds.push(r._id);
                          });
                          collisionQuery(roomIds);
                          var start =   moment.tz($scope.conference.schedule.start,$scope.conference.timezone).startOf('day').format();
                          var end =    moment.tz($scope.conference.schedule.end,$scope.conference.timezone).endOf('day').format();
                          var f = {start:1,location:1,'sideEvent.id':1,type:1,subType:1};
                          var sort ={'start':-1};
                          var q={
                            'location.room':{'$in':roomIds},
                            'location.conference':$scope.conference._id,
                            'sideEvent':{'$exists':true},
                            '$and': [{
                                'start': {
                                    '$gte': {
                                        '$date': start
                                    }
                                }
                            }, {
                                'end': {
                                    '$lt': {
                                        '$date': end
                                    }
                                }
                            }],
                            'meta.status': {
                                $nin: ['archived', 'deleted']
                            }
                          };
                          return mongoStorage.loadDocs('reservations',q, 0,1000000,false,sort,f).then(
                              function(responce) {
                                    var reservations={};
                                    _.each($scope.rooms,function(r){

                                        reservations[r._id] = [];
                                      _.each(responce.data,function(res){
                                          if(res.location.room===r._id)
                                            reservations[r._id].push(res);
                                      });

                                  });
                                  $scope.reservations=reservations;

                              $timeout(function(){$scope.loading.reservations=false;});

                              return reservations;
                              }
                          ); // mongoStorage.getReservations

                        } // getReservations
                        $scope.getReservations = getReservations;

                    }, //link
                    controller: function($scope) {

                      //============================================================
                      // used by child dir, timeRow
                      //============================================================
                      this.resetSchedule = function() {

                          //this.initRowHeight();
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
                                  if ($scope.rowHeight < 20) $scope.rowHeight = 20;
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