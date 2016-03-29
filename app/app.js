define(['angular','dragula','toastr'], function(angular,angularDragula) { 'use strict';

    var deps = ['ngRoute',angularDragula(angular),'toastr'];

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
    app.config(['$httpProvider', function($httpProvider){

        $httpProvider.useApplyAsync(true);
        $httpProvider.interceptors.push('authenticationHttpIntercepter');
        $httpProvider.interceptors.push('realmHttpIntercepter');
    }]);

    app.factory('realmHttpIntercepter', ["realm", function(realm) {

		return {
			request: function(config) {
				var trusted = /^http:\/\/localhost\//i .test(config.url)||
                              /^https:\/\/api.cbd.int\//i .test(config.url) ||
							  /^\/api\//i                 .test(config.url);

                //exception if the APi call needs to be done for different realm
                if(trusted && realm && config.params && config.params.realm && config.params.realm != realm) {
                      config.headers = angular.extend(config.headers || {}, { realm : config.params.realm });
                }
                else if(trusted && realm ) {
                    config.headers = angular.extend(config.headers || {}, { realm : realm });
                }

                return config;
			}
		};
	}]);

    return app;
});