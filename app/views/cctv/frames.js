define(['lodash', 'app'], function(_) {

    return ['$http', '$route', '$location', '$scope', '$q', function($http, $route, $location, $scope, $q) {

        var _ctrl = this;

        _ctrl.refresh = load;
        _ctrl.edit    = edit;
        _ctrl.delete  = del;
        _ctrl.buildSortKey = sortKey;

        init();

        return this;

        //==============================
        //
        //==============================
        function init() {

            var eventGroupId = $route.current.params.eventId;

            var qEvents = $http.get('/api/v2016/event-groups/'+eventGroupId, { cache : true });
            var qFeeds  = $http.get('/api/v2016/cctv-feeds', { params : { q : { eventGroup : eventGroupId } }});

            return $q.all([qEvents, qFeeds]).then(function(res) {

                var eventGroup = res[0].data;
                var feeds      = res[1].data;
                var feedsMap   = _.reduce(feeds, function(ret, feed) {
                    ret[feed._id] = feed;
                    return ret;
                }, {});

                var days = buildDates(eventGroup.StartDate, eventGroup.EndDate);
                var selectedDay = $route.current.params.day || "";

                _ctrl.eventGroup   = eventGroup;
                _ctrl.feeds        = feeds;
                _ctrl.feedsMap     = feedsMap;
                _ctrl.days         = days;
                _ctrl.selectedDay  = selectedDay;
                _ctrl.selectedFeed = '';

            }).then(function () {

                return load();

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function load() {

            var query = { eventGroup : $route.current.params.eventId };

            if(_ctrl.selectedDay) {
                query['schedule.startDay'] = { $lte: _ctrl.selectedDay };
                query['schedule.stopDay' ] = { $gte: _ctrl.selectedDay };
            }

            if(_ctrl.selectedFeed) {
                query.$or = [
                    { feeds : _ctrl.selectedFeed },
                    { feeds: { $size: 0 } }
                ];
            }

            return $http.get('/api/v2016/cctv-frames', { params : { q : query }}).then(function (res) {

                _ctrl.frames = res.data;

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function edit(id) {

            $location.url($location.path()+'/'+id);

            if(_ctrl.selectedDay)
                $location.search({day: _ctrl.selectedDay});
        }

        //==============================
        //
        //==============================
        function del(id) {

            if(!confirm("Delete this entry?"))
                return;

            return $http.delete('/api/v2016/cctv-frames/'+id).then(function() {

                $scope.$emit('showSuccess', 'Frame deleted');

                load();

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function sortKey(frame) {

            if(_ctrl.selectedDay) // when display a single day => sort by start time first
                return frame.schedule.startTime + frame.schedule.stopDay + frame.schedule.startDay + frame.schedule.stopTime;

            return frame.schedule.startDay + frame.schedule.startTime + frame.schedule.stopDay + frame.schedule.stopTime;

        }

        //==============================
        //
        //==============================
        function buildDates(startDate, endDate) {

            startDate = new Date(startDate);
            endDate   = new Date(endDate);

            var dates = [];
            var date  = new Date(startDate);

            while(date <= endDate) {

                dates.push(date.toISOString().substr(0,10));//just take the date part;
                date.setDate(date.getDate()+1);

                // detect infinit-loop
                if(dates.length>120)
                    throw "Loop detected";
            }

            return dates;
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
