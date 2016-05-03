define(['app',
        'text!./toast.html',
        'lodash',
        'moment-timezone',
        'services/authentication',
        'bm',
        'bm-rip'
], function(app,toastTemplate, _, moment) {
    'use strict';

    app.controller('TemplateController', [ '$rootScope', 'toastr','$templateCache','$document', '$http', '$injector', function($rootScope, toastr, $templateCache,$document, $http, $injector) {

        var _ctrl = this;

        _ctrl.eventGroupChange = eventGroupChange;

        $rootScope.eventGroup = initEventGroups();

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

        //==============================
        //
        //==============================
        function initEventGroups() {

            var query = {
                timezone: { $exists: true },
                venueId:  { $exists: true } // TMP for compatibility with coference collection;
            };
            return $http.get('/api/v2016/event-groups', { params : { q : query, s : { StartDate : -1 } } }).then(function(res){

                var now = moment(new Date());
                var eventGroups = res.data;
                var selectEventGroupId = 'TODO';

                var bestMatch = _.find    (eventGroups, function(e) { return e._id==selectEventGroupId;    }) ||
                                _.findLast(eventGroups, function(e) { return now.isBefore(e.EndDate); }) ||
                                _.first   (eventGroups);

                if(bestMatch)
                    selectEventGroupId = bestMatch._id;

                _ctrl.eventGroups        = res.data;
                _ctrl.selectEventGroupId = selectEventGroupId;

                return eventGroupChange(false);
            });
        }

        //==============================
        //
        //==============================
        function eventGroupChange(reloadRoute) {

            var eventGroup = _.find(_ctrl.eventGroups, function(e) {
                return e._id == _ctrl.selectEventGroupId;
            });

            moment.tz.setDefault(eventGroup.timezone);
            $rootScope.eventGroup = eventGroup;

            if(reloadRoute!==false) {
                $injector.invoke(['$route', function($route) {
                    $route.reload();
                }]);
            }

            return eventGroup;
        }
    }]);
});
