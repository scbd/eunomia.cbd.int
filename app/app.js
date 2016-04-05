define(['angular','dragula','toastr'], function(angular,angularDragula) { 'use strict';

    var deps = ['ngRoute',angularDragula(angular),'toastr','ngDialog','colorpicker.module'];

    angular.defineModules(deps);

    var app = angular.module('app', deps);

    app.config(function(toastrConfig) {
        angular.extend(toastrConfig, {
            autoDismiss: true,
            containerId: 'toast-container',
  //          maxOpened: 1,
            newestOnTop: true,
            closeButton: true,
            positionClass: 'toast-top-right',
  //          preventDuplicates: true,
  //          preventOpenDuplicates:false,
              iconClasses: {
              error: 'alert-danger',
              info: 't-info',
              success: 'alert-success',
              warning: 'alert-warning'
            },
            target: 'body',
            timeOut: 5000,
            progressBar:true,

            });
        });


    app.value('realm', 'EUNO');



    return app;
});