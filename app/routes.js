define(['app', 'lodash', 'services/extended-route',  'services/authentication','services/dev-router'], function(app, _) { 'use strict';

    app.config(['extendedRouteProvider', '$locationProvider', function($routeProvider, $locationProvider) {

        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('!');

        $routeProvider.
            when('/',                                { redirectTo: '/schedule/conference' }).
            when('/schedule/conference',             { templateUrl: 'views/schedule/conference.html',  resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator','EunoUser']) }, menu:'schedule'}).
            when('/schedule/reservations',           { templateUrl: 'views/schedule/reservations.html',  resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator','EunoUser']) }, menu:'reservations'}).
            when('/schedule/side-events',            { templateUrl: 'views/schedule/side-events.html', resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator']) }, menu:'side-events'}).

            when('/cctv/frames',                     { templateUrl: 'views/cctv/frames.html',   resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator']) }, reloadOnSearch: false, menu:'cctv-frames'}).
            when('/cctv/frames/:id',                 { templateUrl: 'views/cctv/frame-id.html', resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator']) }, menu:'cctv-frames'}).

            when('/admin/rooms',                     { templateUrl: 'views/admin/rooms.html',             resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator']) }, menu:'admin'}).
            when('/admin/types/:schema',             { templateUrl: 'views/admin/types.html',             resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator']) }, menu:'admin'}).
            when('/admin/cctv/feeds',                { templateUrl: 'views/cctv/feeds.html' ,             resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator']) }, menu:'admin' }).
            when('/admin/cctv/feeds/:id',            { templateUrl: 'views/cctv/feed-id.html' ,           resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['Administrator','EunoAdministrator']) }, menu:'admin' }).

            when('/404', { templateUrl: 'views/404.html' }).
            when('/403', { templateUrl: 'views/403.html' }).
            otherwise({ redirectTo: '/404' });
        }]);

    //============================================================
    //
    //
    //============================================================
    function currentEventGroup() {
        return ['$rootScope', '$q', function ($rootScope, $q) {
            return $q.when($rootScope.eventGroup);
        }];
    }

    //============================================================
    //
    //
    //============================================================
    function securize(roles) {

        return ['$location', '$window', '$q','authentication','devRouter', function ($location, $window, $q, authentication,devRouter) {

            return authentication.getUser().then(function (user) {

                if (!user.isAuthenticated) {


                    var returnUrl   = $window.encodeURIComponent($window.location.href);

                    $window.location.href = devRouter.ACCOUNTS_URI+'/signin?returnUrl=' + returnUrl;

                    return $q(function () {});
                }
                else if (roles && !_.isEmpty(roles) && _.isEmpty(_.intersection(roles, user.roles))) {
                    $location.url('/403'); // not authorized
                }

                return user;
            });
        }];
    }
});
