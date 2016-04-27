define(['app', 'jquery',
      'css!font-awsome-css',

      'services/authentication',
      'directives/portal/portal-nav',

      'services/history',
      'bm',      'bm-rip',
'css!libs/bootstrap-material-design/dist/css/bootstrap-material-design.min.css',
'css!libs/bootstrap-material-design/dist/css/ripples.min.css',
        'css!toastr-css',
      'css!app-css',

    ], function(app, $) {
      'use strict';

    app.controller('TemplateController', ['$scope', '$rootScope', '$window', '$location', 'authentication',  'realm','$q','$timeout','history','$document','toastr','$templateCache', function($scope, $rootScope, $window, $location, authentication,  realm,$q,$timeout,history,$document,toastr,$templateCache) {


        $scope.$root.pageTitle = { text: "" };
        $rootScope.placeholderRecords=[];
        $scope.routeLoaded = false;

        // $templateCache.put('directives/toast/toast.html',
        //   '<div class="alert alert-dismissible alert-success"> <button type="button" class="close" data-dismiss="alert">×</button> <strong>Well done!</strong> You successfully read<a href="javascript:void(0)" class="alert-link">this important alert message</a></div>'
        // );



$templateCache.put("directives/toast/toast.html","<div class=\"alert alert-dismissible  {{toastClass}} {{toastType}}\" ng-click=\"tapToast()\">\n  <div ng-switch on=\"allowHtml\">\n    <div ng-switch-default ng-if=\"title\" class=\"{{titleClass}}\" aria-label=\"{{title}}\">{{title}}</div>\n    <div ng-switch-default class=\"{{messageClass}}\" aria-label=\"{{message}}\">{{message}}</div>\n    <div ng-switch-when=\"true\" ng-if=\"title\" class=\"{{titleClass}}\" ng-bind-html=\"title\"></div>\n    <div ng-switch-when=\"true\" class=\"{{messageClass}}\" ng-bind-html=\"message\"></div>\n  </div>\n  <progress-bar ng-if=\"progressBar\"></progress-bar>\n</div>\n");
$rootScope.$on("showInfo", function(evt,msg) {
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
