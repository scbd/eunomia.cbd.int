define(['lodash', 'BM-date-picker'], function(_) {

    return ['$http', '$route', '$location', '$scope', 'eventGroup', function($http, $route, $location, $scope, eventGroup) {

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
                    eventGroup : eventGroup._id
                };

            }
            else {

                $http.get('https://api.cbd.int/api/v2016/cctv-feeds/'+id).then(function (res) {

                    _ctrl.feed = res.data;

                }).catch(errorHandler);
            }
        }

        //==============================
        //
        //==============================
        function save() {

            var id   = _ctrl.feed._id;
            var feed = id ? _.pick(_ctrl.feed, 'title', 'description') :
                            _.pick(_ctrl.feed, 'title', 'description', 'code', 'eventGroup');

            var savePromise = id ? $http.patch('https://api.cbd.int/api/v2016/cctv-feeds/'+id, feed):
                                   $http.post ('https://api.cbd.int/api/v2016/cctv-feeds',     feed);

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
            $location.path($location.path().replace(/(.*)\/[a-z0-9]*/i, '$1'));
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
