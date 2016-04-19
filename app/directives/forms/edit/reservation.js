define(['app', 'lodash',
  'text!./reservation.html',
  '../../color-picker'
], function(app, _, template) {

  app.directive("reservation", ['$timeout','mongoStorage','$document',
    function($timeout,mongoStorage,$document) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {'doc':'=?','closeThisDialog':'&'},
        link: function($scope, $element) {
console.log($scope.doc);
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
          function initTypes() {
            return mongoStorage.getDocs('reservation-types', status).then(function(result) {
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

          //============================================================
          //
          //============================================================
          function init() {
              $scope.options={};
              $scope.tabs={'details':{'active':true},'resources':{'active':false},'compound':{'active':false}};
              initTypes();
              triggerChanges();
          }//init

          $document.ready(function() {
              $.material.init();
              $.material.input();
              $.material.ripples();



              $element.find('#start-time-filter').bootstrapMaterialDatePicker({
                  time:true,
                  date: false,
                  shortTime: true,
                  format: 'hh:mm a'
              });


          });

        } //link
      }; //return
    }
  ]);
});