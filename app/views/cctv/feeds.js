define(['app', 'BM-date-picker'], function() {

    return ['$http', '$route', '$location', '$scope', 'eventGroup', function($http, $route, $location, $scope, eventGroup) {

        var _ctrl = this;

        _ctrl.edit   = edit;
        _ctrl.delete = del;

        load();

        return this;

        //==============================
        //
        //==============================
        function load() {

            $http.get('https://api.cbd.int/api/v2016/cctv-feeds', { params : { q : { eventGroup : eventGroup._id } }}).then(function (res) {

                _ctrl.feeds = res.data;

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function edit(id) {
            $location.url($location.path()+'/'+id);
        }

        //==============================
        //
        //==============================
        function del(id) {

            var query = {
                eventGroup: eventGroup._id,
                $or: [
                    { feeds : id },
                    { feeds: { $size: 0 } }
                ]
            };

            return $http.get('https://api.cbd.int/api/v2016/cctv-frames', { params: { q: query, c: 1 } }).then(function(res) {

                if(res.data.count) {
                    $scope.$emit('showWarning', "Feed cannot be deleted, it's not empty");
                    return;
                }

                if(!confirm("Delete this entry?"))
                    return;

                return $http.delete('https://api.cbd.int/api/v2016/cctv-feeds/'+id).then(function() {

                    $scope.$emit('showSuccess', 'Feed deleted');

                    load();
                });

            }).catch(errorHandler);
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
