define(['app', 'lodash', 'text!./side-events.html', 'moment',
    'ngDialog',
    'services/mongo-storage',
    './se-time-unit-row',
    './tier-row-header',
    './se-room-row',
    'services/when-element' ,
    'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css',
], function(app, _, template, moment) {

    app.directive("sideEvents", ['$timeout', '$document', 'mongoStorage','$rootScope','$q','dragulaService', 'whenElement',
        function($timeout, $document, mongoStorage,$rootScope,$q,dragulaService, whenElement) {
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
                            if(!$scope.conference) return 

                            changeConference();
                            init();
                        });



                        function init() {

                          
                          $scope.rooms                       = [];
                          $scope.loading                     = {};
                          $scope.collisions                  = {};
                          $scope.loading       .rooms        = false;
                          $scope.loading       .types        = false;
                          $scope.loading       .reservations = true ;
                          $scope.outerGridWidth              = 0;
                          $scope.prefs                       = {};

                          initTypes();
                          ctrl.generateDays()
                        } //init

                        function initTypes() {
                            if(!_.isEmpty($scope.options.types)) return $q(function(resolve){resolve(true);});
                            return $scope.options.typesProm = mongoStorage.loadTypes('reservations').then(function(result) {
                                if(!$scope.options)$scope.options={};
                                $scope.options.types = result;
                            });
                        } //initTypes()

                        function initRoomTypes() {
                            if(!_.isEmpty($scope.options.roomTypes)) return $q(function(resolve){resolve(true);});
                            return mongoStorage.loadTypes('venue-rooms').then(function(result) {
                                if(!$scope.options)$scope.options={};
                                $scope.options.roomTypes = result;

                            });
                        } 

                        function changeConference() {

                            $q.all([getRooms(),initTypes(),initRoomTypes()]).then(function(){
                              this.reservations = getReservations();
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

                            const { days, sideEventTimeIntervals } = $scope.conference.timeObjects
                            const { seTiers } = $scope.conference.schedule.sideEvents
                            

                            $scope.collisions={};

                            for (const interval of sideEventTimeIntervals) {
                              const start = interval.clone()
                              const end   = (interval.clone()).add(90,'minutes');
                              const or = []

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

                              const f     = { start: 1, end: 1, location: 1, subType: 1, type: 1};
                              const sort  = { 'start': -1 };
                              const q     = {
                                    'location.room'       : { '$in': roomIds },
                                    'location.conference' : $scope.conference._id,
                                    'sideEvent'           : { '$exists': false },
                                    'meta.status'         : { $nin: ['archived', 'deleted'] },
                                    '$or'                 : or
                                  };
                                  mongoStorage.loadDocs('reservations',q, 0,1000000,false,sort,f).then(
                                      function({ data}) {
  
                                            _.each($scope.rooms,function(r){
                                                if(!$scope.collisions[r._id])$scope.collisions[r._id]=[];
  
                                              _.each(data,function(res){
                                                  if(res.location.room===r._id)
                                                    $scope.collisions[r._id].push(res);
                                              });
  
                                          });
  
                                      return $scope.collisions;
                                      }
                                  );
                            }

                            // _.each(days,function(day){
                            //         var or =[];
                            //         seTiers.forEach(function(tier){
                            //             var end;
                            //             var start = moment.utc(moment.tz(day,$scope.conference.timezone).startOf('day')).add(tier.seconds,'seconds');
                            //             if(moment(start).format('HH')==='13')
                            //                 end = moment.utc(moment.tz(day,$scope.conference.timezone).startOf('day')).add(tier.seconds,'seconds').add(90,'minutes');

                            //             or.push(
                            //               {'$and' :[
                            //                 {start :{'$gte':{'$date':start.format()}}},
                            //                 {start :{'$lt':{'$date':end.format()}}}
                            //               ]});
                            //             or.push(
                            //                 {'$and' :[
                            //                   {end  :{'$gte':{'$date':start.format()}}},
                            //                   {end  :{'$lt':{'$date':end.format()}}},
                            //                 ]});
                            //             or.push(
                            //                 {'$and' :[
                            //                   {start  :{'$lt':{'$date':start.format()}}},
                            //                   {end  :{'$gte':{'$date':end.format()}}},
                            //                 ]});

                            //         });



                            //  });
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
                          ); 

                        } // getReservations
                        $scope.getReservations = getReservations;

                    }, //link
                    controller: function($scope, $element) {

                      //============================================================
                      // used by child dir, timeRow
                      //============================================================
                      this.resetSchedule = function() {
                          this.generateDays();
                      }; //this.resetSchedule

                      //============================================================
                      //
                      //============================================================
                      this.initRowHeight = function() {

                          $document.ready(function() {
                              $timeout(async() => {
                                  const  roomColumnEl = await whenElement('room-col', $element)
                                  //roomColumnEl = $document.find('#room-col');
                                  $scope.rowHeight = Math.floor(Number(roomColumnEl.height()) / $scope.rooms.length);
                                  if ($scope.rowHeight < 20) $scope.rowHeight = 20;
                                  _.each($scope.rooms, function(room) {
                                      room.rowHeight = $scope.rowHeight;
                                  });
                              });
                          });
                      }; //this.initRowHeight




                      function generateDays() {
                        const { StartDate, EndDate, timezone, timezoneLink } = $scope.conference

                        const tz = timezoneLink || timezone

                        if(timezoneLink) moment.tz.link(`${timezone}|${timezoneLink}`)

                        const startDate = moment.utc(moment.tz(StartDate,tz)).startOf('day');
                        const endDate   = moment.utc(moment.tz(EndDate,tz))  .startOf('day');

                        const totalDays = moment(endDate).diff(startDate,'days')+1;

                        const days        = []
                        const timeObjects = { days, totalDays, endDate, startDate, tz }

                        for (let i = 0; i < totalDays; i++) {
              
                          const date = moment.utc(moment.tz(startDate,tz)).add(i,'days');

                          if(!isExcludedDay(date))
                            days.push(date);
                        }

                        $scope.conference.timeObjects = timeObjects

                        timeObjects.sideEventTimeIntervals = getSideEventTimeIntervals(timeObjects)

                        $document.ready(() => whenElement('scroll-grid', $element).then(getAndSetOuterGrid));

                      } 

                      this.generateDays = generateDays


                      function isExcludedDay(date){
                        const {  timezone, timezoneLink, schedule } = $scope.conference

                        const tz = timezoneLink || timezone

                        const excludedDays = (schedule?.sideEvents?.excludedDayTier || []).filter(({ tier })=> !tier)

                        for (const { day } of excludedDays) {
                          const theDay = moment.utc(moment.tz(day,tz)).startOf('day');

                          if(theDay.isSame(date, 'day')) return true
                        }
                        
                        return false
                      }

                      function getSideEventTimeIntervals({ tz, days }){
                        const { seTiers }              = $scope.conference.schedule.sideEvents
                        const   sideEventTimeIntervals = []

                        for (const day of days)
                          for (const tier of seTiers) {
                            const interval = moment.tz(day, tz).startOf('day').add(tier.seconds,'seconds')
                            const isM27    = moment.tz(day, tz).startOf('day').isSame('2022-03-27T00:00:00+01:00')

                            
                            if(isM27) interval.subtract(1, 'hour')

                            sideEventTimeIntervals.push(interval)
                            
                          }
                          
                        return sideEventTimeIntervals
                      }


                    function getAndSetOuterGrid(scrollGridEl) {
                      if (!scrollGridEl) throw "Error: outer grid width not found timing issue.";

                      const { timeObjects } = $scope.conference
                      const outerGridWidth =  Number(scrollGridEl.width() - 1);
                      const widthNumber = Math.round(Number(3000) / Number(timeObjects.sideEventTimeIntervals.length));

                      timeObjects.outerGridWidth =  outerGridWidth
                      $scope.colWidth = timeObjects.colWidth       = `${widthNumber}px`
                      $scope.$applyAsync()
                    };


            } //return
        };
    }]);
});