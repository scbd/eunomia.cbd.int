define(['app', 'lodash', 'text!./time-unit-row.html','text!../forms/edit/reservation-dialog.html','moment','css!./time-unit-row.css',
 'ngDialog',
 '../forms/edit/reservation',
'./grid-reservation'
], function(app, _, template,resDialog,moment) {

  app.directive("timeUnitRow", ['ngDialog','$timeout','$document','$http','mongoStorage','$rootScope',
    function(ngDialog,$timeout,$document,$http,mongoStorage,$rootScope) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {
          'startTime':'=',
          'endTime':'=',
          'conferenceDays':'=',
          'room':'=',
          'rooms':'=?'
        },
        controller: function($scope, $element) {

            var timeUnit =900.025;//15 minutes in seconds
            var subIntervals,allOrgs ;// number on sub time intervals in a col, now a colomm is houw
            mongoStorage.getAllOrgs('inde-orgs', 'published').then(function(orgs) {
              allOrgs = orgs.data;

            });
            $scope.$watch('conferenceDays',function(){
                getReservations();
                initTimeIntervals();
            });
            $scope.$watch('startTime',function(){

                initTimeIntervals();
            });
            $scope.$watch('endTime',function(){

                initTimeIntervals();
            });
            $scope.$watch('room.rowHeight',function(){
              if($scope.room.rowHeight)
                $element.height($scope.room.rowHeight);
            });

            initTypes();

            //============================================================
            //
            //============================================================
            function initTimeIntervals(){
              if($scope.startTime.hours() && $scope.endTime.hours() && $scope.conferenceDays && !_.isEmpty($scope.conferenceDays) && !_.isEmpty($scope.conferenceDays)){

                  var hours = $scope.endTime.hours()-$scope.startTime.hours();
                  var subIntervals = 3600/timeUnit;
                  $scope.timeIntervals = [];
                  _.each($scope.conferenceDays,function(day){
                        var t = moment(day).add($scope.startTime.hours(),'hours').add($scope.startTime.minutes(),'minutes');

                        for(var  i=0; i< hours ; i++)
                        {
                              var intervalObj={};
                              intervalObj.subIntervals=[];
                              intervalObj.interval=moment.utc(t);
                              for(var  j=0; j< subIntervals ; j++)
                              {
                                 intervalObj.subIntervals.push({time:moment.utc(t).startOf('minute'),res:{}});
                                 t=t.add(timeUnit,'seconds');
                              }
                          $scope.timeIntervals.push(intervalObj);
                        }

                  });
                  initOuterGridWidth();
              }
            }//initTimeIntervals

            //============================================================
            //
            //============================================================
            function initOuterGridWidth() {
              var scrollGridEl;
                    $document.ready(function(){
                      $timeout(function(){
                        scrollGridEl=$document.find('#scroll-grid');

                        $scope.outerGridWidth=Number(scrollGridEl.width());

                        calcColWidths();
                        initIntervalWidth();
                      });
                    });
            }//initOuterGridWidth

            //============================================================
            //
            //============================================================
            function initIntervalWidth(){
                  $element.width($scope.outerGridWidth*$scope.conferenceDays.length);

            }//initDayWidth


            //============================================================
            //
            //============================================================
            function calcColWidths() {

                $scope.colWidth = Number($scope.outerGridWidth)/Number(($scope.timeIntervals.length/$scope.conferenceDays.length));
                initIntervalWidth();
            } //init
            var inProgress=false;

            //============================================================
            //
            //============================================================
            function initTypes() {
              $scope.options={};
              var parentObj;
              return mongoStorage.getDocs('reservation-types', status,true).then(function(result) {
                $scope.options.types = result.data;
              }).catch(function onerror(response) {
                $scope.onError(response);
              });
            }//initTypes()

            //============================================================
            //
            //============================================================
            function  getReservations(){

              if($scope.conferenceDays && !_.isEmpty($scope.conferenceDays) && !inProgress){
                    var start = moment($scope.conferenceDays[0]).startOf('day').format('X');
                    var end = moment($scope.conferenceDays[$scope.conferenceDays.length-1]).endOf('day').format('X');
                    inProgress=true;

                    var params={};

                      params = {
                                  q:{'location.room':$scope.room._id,
                                     'start':{'$gt':{'$date':(start*1000)}},
                                     'end':{'$lt':{'$date':end*1000}},
                                      'meta.status':{$nin:['archived','deleted']},
                                   }
                                };

                      return $http.get('/api/v2016/reservations',{'params':params}).then(
                        function(res){


                          $scope.reservations=res.data;

                          subIntervals = 3600/timeUnit;

                          initTypes().then(function(){

                                _.each($scope.reservations,function(res){
                                    var typeFound =  _.find($scope.options.types,{'_id':res.type});
                                    if(typeFound ){ res.typeObj=typeFound;}

                                    if(res.sideEvent  && _.isEmpty(res.sideEvent.orgs)){
                                          res.sideEvent.orgs = [];
                                          _.each(res.sideEvent.hostOrgs, function(org) {
                                            res.sideEvent.orgs.push(_.find(allOrgs, {
                                              '_id': org
                                            }));
                                          });
                                    }
                                      for(var  i=0; i< $scope.timeIntervals.length; i++)
                                      {
                                            for(var  j=0; j< subIntervals ; j++)
                                            {
                                                  var interval = $scope.timeIntervals[i].subIntervals[j];
                                                  var resStart = moment.utc(res.start).format('X');
                                                  var intervalStart = moment.utc(interval.time).format('X');
                                                  var intervalEnd = moment.utc(interval.time).add(timeUnit,'seconds').format('X');


                                                  if( resStart >= intervalStart && resStart < intervalEnd){
                                                    interval.res=res;
                                                    interval.res.resWidth=calcResWidth (res);
                                                  }else if(!_.isEmpty(interval.res) && interval.res.meta && interval.res.meta==='deleted'){
                                                    delete(interval.res);

                                                  }
                                            }
                                       }
                                });
                          });
                          inProgress=false;

                        }
                      );// http
              }// if
            }// getDocs
            //============================================================
            //
            //============================================================
            function calcResWidth (res) {
                  var resStart = moment.utc(res.start).format('X');
                  var resEnd = moment.utc(res.end).format('X');
                  var resWidth = Math.ceil((resEnd - resStart)/timeUnit)*($scope.colWidth/subIntervals);
                  return Number(resWidth);
            };//calcResWidth

            //============================================================
            //
            //============================================================
            $scope.save = function(obj){

                var objClone = _.cloneDeep(obj);

                delete(objClone.test);
                delete(objClone.startDisp);
                delete(objClone.endDisp);
                delete(objClone.typeObj);
                if(!objClone.location){
                    objClone.location={};
                    objClone.location.venue='56d76c787e893e40650e4170';
                    objClone.location.room=$scope.room._id;
                }
                return mongoStorage.save('reservations',objClone,objClone._id).then(function(res){
                    $timeout(function(){
                    if(objClone.meta && objClone.meta.status==='deleted'){
                        var deleted = _.indexOf(_.pluck($scope.reservations, '_id'), objClone._id);//_.findKey($scope.reservations,{'_.id':objClone._id});
                        delete($scope.reservations[deleted]);
                        if(deleted===0 || deleted) $scope.reservations.splice(deleted,1);
                    }
                    getReservations();},500);
                    $rootScope.$broadcast("showInfo","Reservation '"+objClone.title+"' Successfully Updated.");
                }).catch(function(error){
                    console.log(error);
                    $rootScope.$broadcast("showError","There was an error saving your Reservation: '"+objClone.title+"' to the server.");
                });
            }//save
            //============================================================
            //
            //============================================================
            $scope.resDialog = function(doc,start) {
                $scope.editRes = doc || {};
                $scope.editStart = start;
                var dialog = ngDialog.open({
                  template: resDialog,
                  className: 'ngdialog-theme-default',
                  closeByDocument: true,
                  plain: true,
                  scope: $scope
                });
                dialog.closePromise.then(function(ret) {
                      if (ret.value == 'save') $scope.save(doc).then($scope.close).catch(function onerror(response) {
                          $scope.onError(response);
                      });
                });
            };//$scope.roomDialog
          } //link
      }; //return
    }
  ]);
});