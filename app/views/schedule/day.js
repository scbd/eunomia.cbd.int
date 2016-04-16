define(['app', 'lodash',
'BM-date-picker',
  'ngDialog',
  '../../services/mongo-storage',
  '../../directives/forms/edit/room',
], function(app, _) {

  app.controller('day',['$scope','$document','$element','scbdMenuService',
    function($scope,$document,$element,scbdMenuService) {


      init();

      //============================================================
      //
      //============================================================
      function init() {
        $scope.options = {};
        $scope.toggle = scbdMenuService.toggle;

      } //init

      //============================================================
      //
      //============================================================
      $document.ready(function() {

        $.material.init();
        $.material.input();
        $.material.ripples();

        $element.find('#day').bootstrapMaterialDatePicker({
          weekStart: 0,
          time: false
        });
        $element.find('#end-filter').bootstrapMaterialDatePicker({
          weekStart: 0,
          time: false
        });
        $element.find('#start-filter').bootstrapMaterialDatePicker({
          weekStart: 0,
          time: false
        });

      });
  }]);
});