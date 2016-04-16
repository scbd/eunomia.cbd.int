define(['app', 'lodash',
  'text!./color-picker.html',
  'bs-colorpicker',
  'css!bs-colorpicker-css'
], function(app, _, template) {

  app.directive("colorPicker", ['$timeout',
    function($timeout) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {'binding':'=binding'},
        link: function($scope, $element,$attr) {
          init();

          if($attr.hasOwnProperty('floatLabel'))$scope.floatLabel=true;
          if(!$attr.hasOwnProperty('label'))
            $scope.label='Color';
          else
            $scope.label=$attr.label;
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
              $element.find('#colorChangerSquare').css('color',$scope.binding);
              $timeout(function(){$element.find('#colorChanger').trigger("change");});
          }//updateColorSquare
          $scope.updateColorSquare=updateColorSquare;

          //============================================================
          //
          //============================================================
          function init() {
              updateColorSquare();
        //  triggerChanges();
          }//init

        } //link
      }; //return
    }]); // directive
});//require