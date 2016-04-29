define(['app'], function() {

    return ['$http', '$route', '$location', '$scope',function($http, $route, $location, $scope) {

        var _ctrl = this;

        _ctrl.edit   = edit;
        _ctrl.delete = del;

        init();
        load();

        return this;

        //==============================
        //
        //==============================
        function init() {

            var eventGroupId = $route.current.params.eventId;

            $http.get('/api/v2016/event-groups/'+eventGroupId, { cache : true }).then(function(res) {

                _ctrl.eventGroup = res.data;

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function load() {

            var eventGroupId = $route.current.params.eventId;

            $http.get('/api/v2016/cctv-feeds', { params : { q : { eventGroup : eventGroupId } }}).then(function (res) {

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
                eventGroup: $route.current.params.eventId,
                $or: [
                    { feeds : id },
                    { feeds: { $size: 0 } }
                ]
            };

            return $http.get('/api/v2016/cctv-frames', { params: { q: query, c: 1 } }).then(function(res) {

                if(res.data.count) {
                    $scope.$emit('showWarning', "Feed cannot be deleted, it's not empty");
                    return;
                }

                if(!confirm("Delete this entry?"))
                    return;

                return $http.delete('/api/v2016/cctv-feeds/'+id).then(function() {

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
