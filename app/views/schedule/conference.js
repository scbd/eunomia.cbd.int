define(['app', 'lodash',
  '../../directives/schedule/conference-schedule'
], function(app, _,moment) {

  app.controller('conference',['$scope','scbdMenuService','mongoStorage',
    function($scope,scbdMenuService,mongoStorage) {

      init();

      //============================================================
      //
      //============================================================
      function init() {
        mongoStorage.getAllOrgs('inde-orgs', 'published');// load cache
        $scope.toggle = scbdMenuService.toggle;
        $scope.search='';
      } //init

  }]);
});