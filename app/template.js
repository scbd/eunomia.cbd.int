define(['app',
        'text!./toast.html',
        'services/authentication',
        'bm',
        'bm-rip'
], function(app,toastTemplate) {
    'use strict';

    app.controller('TemplateController', [ '$rootScope', 'toastr','$templateCache','$document', function($rootScope, toastr, $templateCache,$document) {

        var _ctrl = this;

        $templateCache.put("directives/toast/toast.html", toastTemplate);

        $rootScope.$on('$routeChangeSuccess', function(event,current){
            _ctrl.menu=current.$$route.menu;
            $document.ready(function() {
              $.material.init();
              $.material.input();
              $.material.ripples();
            });
        });

        $rootScope.$on("showInfo", function(evt, msg) {
            showInfo(msg);
        });
        $rootScope.$on("showWarning", function(evt, msg) {
            showWarning(msg);
        });
        $rootScope.$on("showSuccess", function(evt, msg) {
            showSuccess(msg);
        });
        $rootScope.$on("showError", function(evt, msg) {
            showError(msg);
        });

        function showInfo(msg) {
            toastr.info(msg);
        }

        function showWarning(msg) {
            toastr.warning(msg);
        }

        function showSuccess(msg) {
            toastr.success(msg);
        }

        function showError(msg) {
            toastr.error(msg);
        }



    }]);
});