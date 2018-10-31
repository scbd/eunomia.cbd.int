define(['app',
        'text!./toast.html',
        'lodash',
        'moment-timezone',
        'services/authentication',
        'services/mongo-storage',
        'bm',
        'bm-rip'
], function(app,toastTemplate, _, moment) {
    'use strict';

    app.controller('TemplateController', [ '$rootScope', 'toastr','$templateCache','$document', '$http', '$injector','mongoStorage',function($rootScope, toastr, $templateCache,$document, $http, $injector,mongoStorage) {

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

            //============================================================
            //
            //============================================================
            if(!$rootScope.user)$rootScope.user={}
            
            $rootScope.user.isAdmin = function() {

                return _.intersection($rootScope.user.roles, [ 'EunoAdministrator']).length > 0;
            };
            _ctrl.isAdmin=$rootScope.user.isAdmin;
        });

        //==============================
        //
        //==============================
        $rootScope.$on("showInfo", function(evt, msg) {
            showInfo(msg);
        });


        //==============================
        //
        //==============================
        $rootScope.$on("showWarning", function(evt, msg) {
            showWarning(msg);
        });

        //==============================
        //
        //==============================
        $rootScope.$on("showSuccess", function(evt, msg) {
            showSuccess(msg);
        });

        //==============================
        //
        //==============================
        $rootScope.$on("showError", function(evt, msg) {
            showError(msg);
        });

        //==============================
        //
        //==============================
        function showInfo(msg) {
            toastr.info(msg);
        }

        //==============================
        //
        //==============================
        function showWarning(msg) {
            toastr.warning(msg);
        }

        //==============================
        //
        //==============================
        function showSuccess(msg) {
            toastr.success(msg);
        }

        //==============================
        //
        //==============================
        function showError(msg) {
            toastr.error(msg);
        }

        //==============================
        //
        //==============================
        function initEventGroups() {

            return mongoStorage.loadConferences(true).then(function(res){
                  var now = moment(new Date());
                  var eventGroups = res;
                  var selectEventGroupId = 'TODO';

                  var bestMatch = _.find    (eventGroups, function(e) { return e._id==selectEventGroupId;    }) ||
                                  _.findLast(eventGroups, function(e) { return now.isBefore(e.EndDate); }) ||
                                  _.first   (eventGroups);
                  if(bestMatch)
                      selectEventGroupId = bestMatch._id;

                  _ctrl.eventGroups        = res;
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
