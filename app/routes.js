define(['app', 'lodash', 'scbd-angularjs-services/extended-route',  'scbd-angularjs-services/authentication'], function(app, _) { 'use strict';

    app.config(['extendedRouteProvider', '$locationProvider', function($routeProvider, $locationProvider) {

        $locationProvider.html5Mode(true);
        $locationProvider.hashPrefix('!');

        $routeProvider.
            when('/',                         { templateUrl: 'views/schedule/conference.html',                resolveController: true, resolveUser: true, resolve : { securized : securize(['Administrator','EunoAdministrator']) } }).
            when('/home',                     { redirectTo: '/' }).
            when('/cctv/feeds',               { templateUrl: 'views/cctv/feeds.html',                  resolveController: true, resolveUser: true, reloadOnSearch : false, resolve : { securized : securize(['Administrator','EunoAdministrator']) } }).
            when('/cctv/frames',              { templateUrl: 'views/cctv/frames.html',                 resolveController: true, resolveUser: true, reloadOnSearch : false, resolve : { securized : securize(['Administrator','EunoAdministrator']) } }).
            when('/schedule/location',        { templateUrl: 'views/schedule/location.html',           resolveController: true, resolveUser: true }).
            when('/schedule/conference',      { templateUrl: 'views/schedule/conference.html',         resolveController: true, resolveUser: true }).
            when('/side-events',              { templateUrl: 'views/side-events.html',                 resolveController: true, resolveUser: true, resolve : { securized : securize(['Administrator','EunoAdministrator']) } }).
            when('/admin/reservation/types',  { templateUrl: 'views/admin/reservation-types.html',     resolveController: true, resolveUser: true, resolve : { securized : securize(['Administrator','EunoAdministrator']) } }).
            when('/404',                      { templateUrl: 'views/404.html',                         resolveUser: true }).
            otherwise({ redirectTo: '/404' });
    }]);

    //============================================================
    //
    //
    //============================================================
    function securize(roles) {

        return ['$location', '$window', '$q','authentication', function ($location, $window, $q, authentication) {
            //return true; // TEMPORARY DISABLED SECURIZE TO PREVENT LOOPING
            return authentication.getUser().then(function (user) {

                if (!user.isAuthenticated) {
                    var returnUrl = $window.encodeURIComponent($window.location.href);
                    $window.location.href = 'https://accounts.cbd.int/signin?returnUrl=' + returnUrl; // force sign in
                    return $q(function () {});
                }
                else if (roles && !_.isEmpty(roles) && _.isEmpty(_.intersection(roles, user.roles))) {
                    $location.url('/help/403'); // not authorized
                }

                return user;
            });
        }];
    }
});
