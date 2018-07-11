(function(document) {

if(/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) { console.log = function(){}; }

var gitVersion = document.documentElement.attributes['git-version'].value;
require.config({
    waitSeconds: 120,
    baseUrl : 'app/',
    IESelectorLimit: true,
    paths: {
        'angular'                  : 'libs/angular-flex/angular-flex',
        'angular-animate'          : 'libs/angular-animate/angular-animate.min',
        'angular-loading-bar'      : 'libs/angular-loading-bar/src/loading-bar',
        'angular-messages'         : 'libs/angular-messages/angular-messages.min',
        'angular-route'            : 'libs/angular-route/angular-route',
        'angular-sanitize'         : 'libs/angular-sanitize/angular-sanitize.min',
        'angular-storage'          : 'libs/angular-local-storage/dist/angular-local-storage.min',
        'css'                      : 'libs/require-css/css.min',
        'bootstrap'                : 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',
        'bs-colorpicker'           : 'libs/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min',
        'bs-colorpicker-css'       : 'libs/angular-bootstrap-colorpicker/css/colorpicker.min',
        'bm'                       : 'libs/bootstrap-material-design/dist/js/material.min',
        'bm-rip'                   : 'libs/bootstrap-material-design/dist/js/ripples.min',
        'BM-date-picker'           : 'libs/bootstrap-material-datetimepicker/js/bootstrap-material-datetimepicker',
        'dragula'                  : 'libs/angular-dragula/dist/angular-dragula',
        'iconate'                  : 'libs/iconate/dist/iconate',
        'iconateCSS'               : 'libs/iconate/dist/iconate.min',
        'jquery'                   : 'libs/jquery/dist/jquery',
        'linqjs'                   : 'libs/linqjs/linq.min',
        'lodash'                   : 'libs/lodash/lodash',
        'moment'                   : 'libs/moment/moment',
        'moment-timezone'          : 'libs/moment-timezone/builds/moment-timezone-with-data.min',
        'ngRoute'                  : 'libs/angular-route/angular-route.min',
        'ngDialog'                 : 'libs/ng-dialog/js/ngDialog',
        'toastr'                   : 'libs/angular-toastr/dist/angular-toastr.tpls.min',
        'text'                     : 'libs/requirejs-text/text',
        'socket.io'                : 'libs/socket.io-1.4.5/index',
        'ui.select'                : 'libs/angular-ui-select/dist/select',
        'hl.sticky'                : 'libs/angular-sticky/dist/angular-sticky'
    },
    shim: {
        'libs/angular/angular'      : { deps: ['jquery'] },
        'angular'                   : { deps: ['libs/angular/angular'] },
        'angular-route'             : { deps: ['angular'] },
        'angular-sanitize'          : { deps: ['angular'] },
        'angular-animate'           : { deps: ['angular']},
        'bootstrap'                 : { deps: ['jquery']},
        'toastr'                    : { deps: ['angular']},
        'moment'                    : { deps: ['jquery']},
        'bm'                        : { deps: ['bootstrap']},
        'bm-rip'                    : { deps: ['bm']},
        'BM-date-picker'            : { deps: ['jquery','moment-timezone']},
        'dragula'                   : { deps: ['angular','jquery'] },
        'ngRoute'                   : { deps: ['angular'] },
        'ui.select'                 : { deps: ['angular'] },
        'hl.sticky'                 : { deps: ['angular'] },
    },
    urlArgs: 'v=' + gitVersion
});

// BOOT

require(['angular', 'app','moment', 'text', 'routes', 'template','bm'], function(ng, app, moment) {

    ng.element(document).ready(function () {
         ng.bootstrap(document, [app.name]);
         window.moment = moment;
    });

});

// Fix IE Console
(function(a){a.console||(a.console={});for(var c="log info warn error debug trace dir group groupCollapsed groupEnd time timeEnd profile profileEnd dirxml assert count markTimeline timeStamp clear".split(" "),d=function(){},b=0;b<c.length;b++)a.console[c[b]]||(a.console[c[b]]=d)})(window); //jshint ignore:line

})();
