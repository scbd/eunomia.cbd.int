/* jshint sub:true */

define(['app'], function(app) {
    'use strict';
    /***************************************************************************************
     * dev env variables
     ***************************************************************************************/
    app.factory('devRouter', [function() {

        const domain      = document.location.hostname.replace(/[^\.]+\./, '');
        const accountsUrl = (document && document.documentElement.attributes['accounts-url'].value)

        return {
            ACCOUNTS_URI: accountsUrl,
            DOMAIN: domain
        };
    }]);
});
