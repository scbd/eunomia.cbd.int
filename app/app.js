define(['angular', 'dragula', 'toastr', 'angular-sanitize','ui.select'], function(angular, angularDragula) {
  'use strict';

  var deps = ['ngRoute', 'ngSanitize', angularDragula(angular), 'toastr', 'ngDialog', 'colorpicker.module','ui.select'];

  angular.defineModules(deps);

  var app = angular.module('app', deps);

  app.config(['toastrConfig', '$httpProvider', config ]);

  const accountsUrl = document.documentElement.attributes['accounts-url'].value  
  const apiUrl      = document.documentElement.attributes['api-url'].value  

  app.value('accountsUrl', accountsUrl);
  app.value('apiUrl', apiUrl);

  return app;
});

function config(toastrConfig, $httpProvider) {
  angular.extend(toastrConfig, {
    autoDismiss: true,
    containerId: 'toast-container',
    newestOnTop: true,
    closeButton: true,
    positionClass: 'toast-top-right',
    iconClasses: {
      error  : 'alert-danger' ,
      info   : 't-info'       ,
      success: 'alert-success',
      warning: 'alert-warning'
    },
    target     : 'body',
    timeOut    : 5000  ,
    progressBar: true  ,
  });

  $httpProvider.useApplyAsync(true);
  $httpProvider.interceptors.push('authenticationHttpIntercepter');
}