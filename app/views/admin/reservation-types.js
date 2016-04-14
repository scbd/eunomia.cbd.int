define(['app', 'lodash', 'moment',
  'BM-date-picker',
  'css!libs/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css',
  '../../services/mongo-storage',
  'ngDialog',
  'css!libs/ng-dialog/css/ngDialog.css',
  'css!libs/ng-dialog/css/ngDialog-theme-default.min.css',
], function(app, _, moment, roomDialog) {

  app.controller("reservationType", ['$scope', '$element','scbdMenuService', '$document', 'dragulaService', 'mongoStorage', '$timeout', '$rootScope', 'ngDialog',
    function($scope, $element,scbdMenuService, $document, dragulaService, mongoStorage, $timeout, $rootScope, ngDialog) {


      // $scope.startFilter=0;
      // $scope.endFilter=0;
      $scope.sideEvents = [];
      $scope.days = [];
      $scope.meeting = 0;
      $scope.search = '';
      $scope.rooms={};
      var hoverArray = [];
      var slotElements ={};
      var cancelDropIdicators;

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


        $element.find('#end-filter').bootstrapMaterialDatePicker({
          weekStart: 0,
          time: false
        });
        $element.find('#start-filter').bootstrapMaterialDatePicker({
          weekStart: 0,
          time: false
        });
      });
    }
  ]);
  app.filter('ucf', function()
  {
      return function(word)
      {
          return word.substring(0,1).toUpperCase() + word.slice(1);
      };
  });
});