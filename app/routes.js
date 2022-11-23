define(['app', 'lodash', 'services/extended-route',  'services/authentication'], function(app, _) { 'use strict';

    app.config(['extendedRouteProvider', '$locationProvider', function($routeProvider, $locationProvider) {

        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('!');

        $routeProvider.
            when('/',                                { redirectTo: '/schedule/xxx' }).
            
            when('/reservations',                    { templateUrl: 'views/reservations.html',  resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator','EunoUser']) }, menu:'reservations'}).
            when('/reservations/av',                 { templateUrl: 'views/audio-video/reservations.html',  resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize() }, menu:'reservations-for-interactio'}).

            when('/side-events',                     { templateUrl: 'views/side-events.html',  resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator','EunoUser']) }, menu:'side-events'}).

            when('/schedule/side-events',            { templateUrl: 'views/schedule/side-events.html', resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, menu:'side-events-schedule'}).

            when('/schedule/:code',                   { templateUrl: 'views/schedule/conference.html',  resolveController: true,  resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator','EunoUser']) }, menu:'schedule'}).


            when('/cctv/frames',                     { templateUrl: 'views/cctv/frames.html',   resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, reloadOnSearch: false, menu:'cctv-frames'}).
            when('/cctv/frames/:id',                 { templateUrl: 'views/cctv/frame-id.html', resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, menu:'cctv-frames'}).

            when('/admin/rooms',                     { templateUrl: 'views/admin/rooms.html',             resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, menu:'admin'}).
            when('/admin/types/:schema',             { templateUrl: 'views/admin/types.html',             resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, menu:'admin'}).
            when('/admin/types/:schema/:parent',     { templateUrl: 'views/admin/side-event-types.html',             resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, menu:'admin'}).
            when('/admin/cctv/feeds',                { templateUrl: 'views/cctv/feeds.html' ,             resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, menu:'admin' }).
            when('/admin/cctv/feeds/:id',            { templateUrl: 'views/cctv/feed-id.html' ,           resolveController: true, resolve : { eventGroup : currentEventGroup(), user : securize(['EunoAdministrator']) }, menu:'admin' }).

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

        return ['$location', '$window', 'authentication', 'accountsUrl', function ($location, $window, authentication, accountsUrl) {

            return authentication.getUser().then(function (user) {

                if (!user.isAuthenticated) {

                    const returnUrl   = $window.encodeURIComponent($window.location.href);

                    $window.location.href = `${accountsUrl}/signin?returnUrl=${returnUrl}`

                    return async () => ({})
                }
                else if (roles && !_.isEmpty(roles) && _.isEmpty(_.intersection(roles, user.roles)))
                    $location.url('/403'); // not authorized
                

                return user;
            });
        }];
    }
});
