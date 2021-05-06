(function(document) {

const cdnHost     = 'https://cdn.jsdelivr.net'
//if(/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) { console.log = function(){}; }

require.config({
    waitSeconds: 120,
    baseUrl : '/app/',
    IESelectorLimit: true,
    paths: {
        'ng': cdnHost + '/npm/angular@1.8.2/angular.min',
        'angular'                  : cdnHost + '/gh/scbd/angular-flex/angular-flex.min',
        'angular-animate'          : cdnHost + '/npm/angular-animate@1.8/angular-animate.min',
        'ngRoute'                  : cdnHost + '/npm/angular-route@1.8/angular-route.min',// maybe 1.4.8
        'angular-sanitize'         : cdnHost + '/npm/angular-sanitize@1.8/angular-sanitize.min',
        'css'                      : cdnHost + '/npm//require-css@0.1.8/css.min',
        'bootstrap'                : cdnHost + '/npm/bootstrap@3.3.6/dist/js/bootstrap.min',
        'bs-colorpicker'           : cdnHost + '/npm/angular-bootstrap-colorpicker@3.0.25/js/bootstrap-colorpicker-module.min',
        'bs-colorpicker-css'       : cdnHost + '/npm/angular-bootstrap-colorpicker@3.0.25/css/colorpicker.min',
        'bm'                       : cdnHost + '/npm/bootstrap-material-design@0.5.10/dist/js/material.min',
        'bm-rip'                   : cdnHost + '/npm/bootstrap-material-design@0.5.10/dist/js/ripples.min',
        'BM-date-picker'           : cdnHost + '/npm/bootstrap-material-datetimepicker@2.7.1/js/bootstrap-material-datetimepicker',
        'dragula'                  : cdnHost + '/gh/scbd/angular-dragula@1.2.6/dist/angular-dragula.min',
        'jquery'                   : cdnHost + '/npm/jquery@2.2.0/dist/jquery.min',
        'lodash'                   : cdnHost + '/npm/lodash@3.9.3/index',
        'moment'                   : cdnHost + '/npm/moment@2.24.0/moment',
        'moment-timezone'          : cdnHost + '/npm/moment-timezone@0.5.3/builds/moment-timezone-with-data.min',
        'ngDialog'                 : cdnHost + '/npm/ng-dialog@1.4.0/js/ngDialog.min',
        'toastr'                   : cdnHost + '/npm/angular-toastr@1.7.0/dist/angular-toastr.tpls.min',
        'text'                     : cdnHost + '/npm/requirejs-text@2.0.16/text',
        'ui.select'                : cdnHost + '/npm/ui-select@0.19.6/dist/select.min',
        'hl.sticky'                : cdnHost + '/npm/angular-sticky-plugin@0.3.0/dist/angular-sticky',
    },
    shim: {
        'ng'      : { deps: ['jquery'] },
        'angular'                   : { deps: [cdnHost + '/npm/angular@1.8.2/angular.min.js',] },
        'ngRoute'                   : { deps: ['ng'] },
        'angular-sanitize'          : { deps: ['angular'] },
        'angular-animate'           : { deps: ['angular']},
        'bootstrap'                 : { deps: ['jquery']},
        'toastr'                    : { deps: ['angular']},
        'moment'                    : { deps: ['jquery']},
        'bm'                        : { deps: ['bootstrap']},
        'bm-rip'                    : { deps: ['bm']},
        'BM-date-picker'            : { deps: ['jquery','angular','moment-timezone']},
        'dragula'                   : { deps: ['angular','jquery'] },
        'ngRoute'                   : { deps: ['angular'] },
        'ui.select'                 : { deps: ['angular'] },
        'hl.sticky'                 : { deps: ['angular'] },
    },
    // urlArgs: 'v=' + gitVersion
});

// BOOT

require(['angular', 'moment', 'app', 'text', 'routes', 'template','bm', 'hl.sticky'], function(ng, moment,app) {

    ng.element(document).ready(function () {
        window.moment = moment;
        ng.bootstrap(document, [app.name]);
    });

});


})(document);

// Fix IE Console
(function(a){a.console||(a.console={});for(var c="log info warn error debug trace dir group groupCollapsed groupEnd time timeEnd profile profileEnd dirxml assert count markTimeline timeStamp clear".split(" "),d=function(){},b=0;b<c.length;b++)a.console[c[b]]||(a.console[c[b]]=d)})(window); //jshint ignore:line
