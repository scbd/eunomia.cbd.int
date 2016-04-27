require.config({
    waitSeconds: 120,
    baseUrl : 'app/',
    IESelectorLimit: true,
    paths: {
            'authentication'      : 'services/authentication',
        'angular'                  : 'libs/angular-flex/angular-flex',
        'angular-animate'          : 'libs/angular-animate/angular-animate.min',
        'angular-loading-bar'      : 'libs/angular-loading-bar/src/loading-bar',
        'angular-route'            : 'libs/angular-route/angular-route',
        'angular-sanitize'         : 'libs/angular-sanitize/angular-sanitize.min',
        'angular-storage'          : 'libs/angular-local-storage/dist/angular-local-storage.min',
        'angular-messages'         : 'libs/angular-messages/angular-messages.min',
        'app-css'                  : 'css/main',
        'css'                      : 'libs/require-css/css.min',
        'bootstrap'                : 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',
        'bs-colorpicker'           : 'libs/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min',
        'bs-colorpicker-css'       : 'libs/angular-bootstrap-colorpicker/css/colorpicker.min',
        'bm'                       : 'libs/bootstrap-material-design/dist/js/material.min',
        'bm-rip'                   : 'libs/bootstrap-material-design/dist/js/ripples.min',
        'BM-date-picker-css'       : 'libs/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker',
        'BM-date-picker'           : 'libs/bootstrap-material-datetimepicker/js/bootstrap-material-datetimepicker',
        'dragula'                  : 'libs/angular-dragula/dist/angular-dragula',
        'flag-icon-css'            : 'libs/flag-icon-css/css/flag-icon.min',
        'font-awsome-css'          : 'libs/font-awesome/css/font-awesome.min',
        'iconate'                  : 'libs/iconate/dist/iconate',
        'iconateCSS'               : 'libs/iconate/dist/iconate.min',
        // 'ionsound'                 : 'libs/ionsound/js/ion.sound.min',
        'jquery'                   : 'libs/jquery/dist/jquery',
        'linqjs'                   : 'libs/linqjs/linq.min',
        'lodash'                   : 'libs/lodash/lodash',
        'moment'                   : 'libs/moment/moment',
        'moment-timezone'          : 'libs/moment-timezone/builds/moment-timezone-with-data.min',
        'ngRoute'             : 'libs/angular-route/angular-route.min',
        'ngDialog'                 : 'libs/ng-dialog/js/ngDialog',
        'ngDialog-css'             : 'libs/ng-dialog/css/ngDialog',
        'ngDialog-css-theme'       : 'libs/ng-dialog/css/ngDialog-theme-default.min',
        'shim'                     : 'libs/require-shim/src/shim',
        'toastr'                   : 'libs/angular-toastr/dist/angular-toastr.tpls.min',
        'toastr-css'               : 'libs/angular-toastr/dist/angular-toastr.min',
        'text'                     : 'libs/requirejs-text/text',
        'socket.io'                : 'libs/socket.io-1.4.5/index'

    },
    shim: {
        'libs/angular/angular'      : { deps: ['jquery'] },
        'angular'                   : { deps: ['libs/angular/angular'] },
        'angular-route'             : { deps: ['angular'] },
        'angular-sanitize'          : { deps: ['angular'] },
        'guid'                      : { exports: 'ui_guid_generator' },
        'angular-animate'           : { deps: ['angular']},
        'angular-loading-bar'       : { deps: ['angular'] },
        'bootstrap'                 : { deps:[ 'jquery']},
        'ng-file-upload'            : { deps:[ 'angular']},
        'ngSmoothScroll'            : { deps:[ 'angular','jquery']},
        'toastr'                    : { deps:[ 'angular']},
        'scroll-directive'          : { deps:[ 'angular']},
        'moment'                    : { deps:[ 'jquery']},
        'bm'                        : { deps:[ 'jquery']},
        'bm-rip'                    : { deps:[ 'bm']},
        'BM-date-picker'            : { deps:[ 'jquery','moment','css!BM-date-picker-css']},
        'dragula'                   : { deps: ['angular','jquery'] },
        'app-css'                   : { deps: ['toastr-css'] },
        'ngDialog'                  :{ deps: ['css!ngDialog-css','css!ngDialog-css-theme'] },
              'ngRoute'                  : { deps: ['angular'] },

        // 'text-angular'                  : { 'deps': ['text-angular-sanitize', 'angular'] },
        // 'text-angular-sanitize'         : { 'deps': ['angular', 'angular-sanitize']},
    }
    // packages: [
    //   // { name: 'scbd-angularjs-services', location : 'libs/scbd-angularjs-services/services' },
    //   // { name: 'scbd-branding', location : 'libs/scbd-branding/directives' },
    //   // { name: 'scbd-filters',  location : 'libs/scbd-filters/filters' },
    //   // { name: 'scbd-angularjs-filters',  location : 'libs/scbd-angularjs-services/filters' },
    //   // { name: 'scbd-angularjs-controls', location : 'libs/scbd-angularjs-controls/form-control-directives' },
    //
    // ]
});

// BOOT

require(['angular', 'app','moment', 'text', 'routes', 'template','bootstrap'], function(ng, app, moment) {

    ng.element(document).ready(function () {
         ng.bootstrap(document, [app.name]);
         window.moment = moment;
    });

});

// Fix IE Console
(function(a){a.console||(a.console={});for(var c="log info warn error debug trace dir group groupCollapsed groupEnd time timeEnd profile profileEnd dirxml assert count markTimeline timeStamp clear".split(" "),d=function(){},b=0;b<c.length;b++)a.console[c[b]]||(a.console[c[b]]=d)})(window); //jshint ignore:line
