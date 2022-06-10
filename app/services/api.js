/* jshint sub:true */

define(['app'], function(app) {
    'use strict';

    app.factory('apiRebase', ["$location", "apiUrl", function($location, apiUrl) {
        
        return {
            request: function(config) {

                var baseUrl = "";
                var url     = config.url;

                if(/^\/api\//i.test(url)) {
                    if(!baseUrl && apiUrl) baseUrl = apiUrl;
                }

                config.url = baseUrl + config.url;

                return config;
            }
        };
    }]);

});
