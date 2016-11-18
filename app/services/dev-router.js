/* jshint sub:true */

define(['app'], function(app) {
    'use strict';
    /***************************************************************************************
     * dev env variables
     ***************************************************************************************/
    app.factory('devRouter', [function() {

        var domain = document.location.hostname.replace(/[^\.]+\./, '');

        var ACCOUNTS_URI = 'https://accounts.' + domain;


        /***************************************************************************************
         *

         ***************************************************************************************/
        function isDev() {
          if((domain == 'localhost' || domain == 'houlahan.local' ||(domain.indexOf('cbddev.xyz') >= 0)) && !production)
            return true;
            else {
              return '';
            }
        }

        return {
            ACCOUNTS_URI: ACCOUNTS_URI,
            DOMAIN: domain,
            isDev: isDev
        };
    }]);
});