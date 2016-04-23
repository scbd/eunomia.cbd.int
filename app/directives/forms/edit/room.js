define(['app', 'lodash',
  'text!./room.html',
  'moment',

  '../../color-picker'

], function(app, _, template, moment) { //'scbd-services/utilities',

  app.directive("room", ['$timeout','mongoStorage','$rootScope','$location',//"$http", "$filter", "Thesaurus",
    function($timeout,mongoStorage,$rootScope,$location) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {'doc':'=?','venue':'=?','closeThisDialog':'&'},
        controller: function($scope, $element) { //, $http, $filter, Thesaurus
            init();

            //============================================================
            //
            //============================================================
            function triggerChanges (){

                  $timeout(function(){$element.find('input').trigger("change");
$element.find('select').trigger("change");
                },100);


            }//triggerChanges

          // //============================================================
          // //
          // //============================================================
          // function updateColorSquare (){
          //     $element.find('#roomColorDSquare').css('color',$scope.doc.color);
          //     $timeout(function(){$element.find('#roomColorD').trigger("change");});
          // }//updateColorSquare
          // $scope.updateColorSquare=updateColorSquare;
          //============================================================
          //
          //============================================================
          function initVenues(){
              return mongoStorage.getDocs('venues').then(function(venues){
                $scope.options.venues=venues.data;
                _.each($scope.options.venues,function(ven){
                      if(ven._id === $scope.doc.venue)
                        ven.selected=true;

                });

              });
          }//initVunues
          //============================================================
          //
          //============================================================
          $scope.save = function(){
              var room = _.cloneDeep($scope.doc);
              //_.each(venue.rooms, function(room){
                  delete(room.bookings);
            //  });
              return mongoStorage.save('venue-rooms',room,room._id).then(function(){
                          $rootScope.$broadcast("showInfo","Room Successfully Updated.");
              }).catch(function(error){
                  console.log(error);
                  $rootScope.$broadcast("showError","There was an error saving your data to the server.");
              });
          }//initVunues
          //============================================================
          //
          //============================================================
          $scope.changeTab = function(tabName){
              _.each($scope.tabs,function(tab){
                  tab.active=false;
              });
              $scope.tabs[tabName].active=true;
          }//initVunues

          //============================================================
          //
          //============================================================
          function initVal (){
              $timeout(function(){
                $scope.doc.atTable = $scope.doc.atTable || 0;
                $scope.doc.capacity = $scope.doc.capacity || 0;
                $scope.doc.sort = $scope.doc.sort || 0;
                $timeout(function(){
                  $element.find('#roomAtTableD').trigger("change");
                  $element.find('#roomCapacityD').trigger("change");
                  $element.find('#roomSortD').trigger("change");
                });
              },200);

          }//initVunues
          //============================================================
          //
          //============================================================
          function init() {
            $scope.options={};


            $scope.tabs={'details':{'active':true},'resources':{'active':false},'compound':{'active':false}};
            $scope.isSideEvents=($location.path()==='/side-events');
              //updateColorSquare();
              triggerChanges();

              initVenues();
              $timeout(function(){$element.find('#roomNameD').focus();},500);
              initVal();
  ///if(!$scope.doc.location)$scope.doc.location=$scope.venue._id;
          }//triggerChanges

        } //link
      }; //return
    }
  ]);
});