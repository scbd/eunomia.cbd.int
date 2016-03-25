define(['app', 'lodash', 'text!./portal-nav.html', 'css!./portal-nav',        './menu',


], function(app, _, template) {
  app.directive('portalNav', function() {
    return {
      restrict: 'E',
      replace: true,
      template: template,
      scope: {
        uid: '@',
      },
      controller: ['$scope','mainMenu', '$location', '$window', '$timeout', '$element', 'authentication','$rootScope',
        function($scope,mainMenu, $location, $window, $timeout, $element, authentication,$rootScope) {


                  $scope.toggle = mainMenu.toggle;
                  $scope.sections = mainMenu.getMenu('mainMenu');

          //$scope.$root.pageTitle = { text: "" };
          $scope.goTo = function(path) {
            return $location.url(path);
          };

          authentication.getUser().then(function(user) {
            $scope.isAuthenticated = user.isAuthenticated;
            $scope.isAdmin = (_.intersection(['Administrator', 'IndeAdministrator'], user.roles).length > 0);
          });

        }
      ]
    }; //end controller
  });
});