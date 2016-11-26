define(['angular', 'dragula', 'toastr', 'angular-sanitize','ui.select','hl.sticky'], function(angular, angularDragula) {
  'use strict';

  var deps = ['ngRoute', 'ngSanitize', angularDragula(angular), 'toastr', 'ngDialog', 'colorpicker.module','ui.select','hl.sticky'];

  angular.defineModules(deps);

  var app = angular.module('app', deps);

  app.config(['toastrConfig', '$httpProvider', function(toastrConfig, $httpProvider) {
    angular.extend(toastrConfig, {
      autoDismiss: true,
      containerId: 'toast-container',
      newestOnTop: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      iconClasses: {
        error: 'alert-danger',
        info: 't-info',
        success: 'alert-success',
        warning: 'alert-warning'
      },
      target: 'body',
      timeOut: 5000,
      progressBar: true,
    });

    $httpProvider.useApplyAsync(true);
    $httpProvider.interceptors.push('authenticationHttpIntercepter');
  }]);

  app.value('realm', 'EUNO');

  return app;
});