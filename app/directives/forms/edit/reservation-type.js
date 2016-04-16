define(['app', 'lodash',
  'text!./reservation-type.html',
  'moment',
  'bs-colorpicker',
  'css!bs-colorpicker-css',
], function(app, _, template, moment) {

  app.directive("reservationType", ['$timeout','mongoStorage','$rootScope',
    function($timeout,mongoStorage,$rootScope) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {'doc':'=?','venue':'=?','closeThisDialog':'&'},
        link: function($scope, $element) {
            $scope.options={};


            init();

            //============================================================
            //
            //============================================================
            function triggerChanges (){

                 $element.find('input').each(function(){
                      $(this).trigger('change');
                      if($(this).attr('id')!=='test')
                          isEmptyModel($(this));
                 });//jquery each
                 $element.find('select').each(function(){
                      $timeout(isEmptyModel($(this)));
                 });//jquery each
            }//triggerChanges

            //============================================================
            // adds isEmpty css if ngModel empty
            //============================================================
            function isEmptyModel (el){
              var ngModel,ngModelSub,$formGroup;
              ngModel= el.attr('ng-model');
              if(ngModel && ngModel!=='binding'){
                ngModelSub=ngModel.substring(ngModel.indexOf('.')+1,ngModel.length);
                   if(!$scope.doc[ngModelSub]){
                     $formGroup = el.closest(".form-group");
                      $formGroup.addClass("is-empty");
                    }//
              }//if(ngModel)
            }/// isEmptyModel
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
          function initTypes() {
            return mongoStorage.loadDocs('reservation-types', status).then(function(result) {
              $scope.options.types = result.data;
              _.each($scope.types,function(type){
                  type.showChildren=true;
                            _.each(type.children,function(child){
                                child.showChildren=true;
                            });
              });
            }).catch(function onerror(response) {
              $scope.onError(response);
            });
          }

          // //============================================================
          // //
          // //============================================================
          // $scope.save = function(){
          //     var room = _.cloneDeep($scope.doc);
          //     //_.each(venue.rooms, function(room){
          //         delete(room.bookings);
          //   //  });
          //     return mongoStorage.save('venue-rooms',room,room._id).then(function(){
          //                 $rootScope.$broadcast("showInfo","Room Successfully Updated.");
          //     }).catch(function(error){
          //         console.log(error);
          //         $rootScope.$broadcast("showError","There was an error saving your data to the server.");
          //     });
          // }//initVunues
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
            initTypes();

              triggerChanges();
              // if(!$scope.doc.location)$scope.doc.location=$scope.venue._id;
              // initVenues();
              // $timeout(function(){$element.find('#roomNameD').focus();},500);
              // initVal();
          }//triggerChanges

        } //link
      }; //return
    }
  ]);
});