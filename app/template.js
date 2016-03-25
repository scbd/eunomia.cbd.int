define(['app', 'jquery',
      'css!font-awsome-css',

      'scbd-angularjs-services/authentication',
      'directives/portal/portal-nav',
      'scbd-branding/header/header',
      'scbd-branding/footer',
      'services/history',
      'bm',      'bm-rip',
'css!libs/bootstrap-material-design/dist/css/bootstrap-material-design.min.css',
'css!libs/bootstrap-material-design/dist/css/ripples.min.css',
      'css!app-css',
    ], function(app, $) {
      'use strict';

    app.controller('TemplateController', ['$scope', '$rootScope', '$window', '$location', 'authentication',  'realm','$q','$timeout','history','$document', function($scope, $rootScope, $window, $location, authentication,  realm,$q,$timeout,history,$document) {


        $scope.$root.pageTitle = { text: "" };
        $rootScope.placeholderRecords=[];
        $scope.routeLoaded = false;





     }]);
});
