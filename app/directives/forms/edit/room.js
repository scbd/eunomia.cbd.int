define(['app', 'lodash',
  'text!./room.html',
  'moment',
  'bs-colorpicker',
  'css!bs-colorpicker-css'


], function(app, _, template, moment) { //'scbd-services/utilities',

  app.directive("room", ['$timeout','mongoStorage','$rootScope',//"$http", "$filter", "Thesaurus",
    function($timeout,mongoStorage,$rootScope) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {'doc':'=?','venue':'=?','closeThisDialog':'&'},
        link: function($scope, $element) { //, $http, $filter, Thesaurus
$scope.options={};
init();
console.log($scope.closeThisDialog);
console.log($scope.venue);

$scope.tabs={'details':{'active':true},'resources':{'active':false},'compound':{'active':false}};
            //============================================================
            //
            //============================================================
            function triggerChanges (){

                 $element.find('input').trigger("change");

            }//triggerChanges

          //============================================================
          //
          //============================================================
          function updateColorSquare (){
              $element.find('#roomColorDSquare').css('color',$scope.doc.color);
              $timeout(function(){$element.find('#roomColorD').trigger("change");});
          }//updateColorSquare
          $scope.updateColorSquare=updateColorSquare;
          //============================================================
          //
          //============================================================
          function initVenues(){
              return mongoStorage.loadDocs('venues').then(function(venues){
                $scope.options.venues=venues.data;
                _.each($scope.options.venues,function(ven){
                      if(ven._id === $scope.venue._id)
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
          function init() {
              updateColorSquare();
              triggerChanges();
              if(!$scope.doc.location)$scope.doc.location=$scope.venue._id;
              initVenues();
              $timeout(function(){$element.find('#roomNameD').focus();},500);


          }//triggerChanges

        } //link
      }; //return
    }
  ]);
});