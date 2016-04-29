define(['app'], function() {

    return ['$http', '$route', '$location', '$scope', function($http, $route, $location, $scope) {

        var _ctrl = this;

        _ctrl.save   = save;
        _ctrl.cancel = close;

        load();

        return this;

        //==============================
        //
        //==============================
        function load() {

            var id = $route.current.params.id;

            if(id=='new') {

                _ctrl.feed = {
                    code : genarateCode(),
                    title : '',
                    description : '',
                    eventGroup : $route.current.params.eventId
                };

            }
            else {

                $http.get('/api/v2016/cctv-feeds/'+id).then(function (res) {

                    _ctrl.feed = res.data;

                }).catch(errorHandler);
            }
        }

        //==============================
        //
        //==============================
        function save() {

            var feed = _ctrl.feed;
            var id   = _ctrl.feed._id;

            var savePromise = id ? $http.put ('/api/v2016/cctv-feeds/'+id, feed):
                                   $http.post('/api/v2016/cctv-feeds',     feed);

            return savePromise.then(function(res) {

                feed._id = res.data._id || feed._id;

                $scope.$emit('showSuccess', 'Feed "'+feed.title+'" saved');

                close();

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function close() {
            $location.url($location.path().replace(/(.*)\/[a-z0-9]*/i, '$1'));
        }

        //==============================
        //
        //==============================
        function genarateCode() {

            function s4() {
                return Math.floor((1 + Math.random()) * 10000).toString(10).substring(1);
            }

            return (s4() + s4() + s4() + s4()).substr(0,16);
        }

        //==============================
        //
        //==============================
        function errorHandler(err) {

            err = err         || "Unknow error";
            err = err.data    || err;
            err = err.message || err;

            $scope.$emit('showError', err);
        }
    }];
});
