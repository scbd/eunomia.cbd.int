define(['lodash', 'moment-timezone', 'app', 'directives/date-picker'], function(_, moment) {

    return ['$http', '$route', '$location', '$scope', '$q', function($http, $route, $location, $scope, $q) {

        var _ctrl = this;

        _ctrl.refresh = load;
        _ctrl.edit    = edit;
        _ctrl.delete  = del;
        _ctrl.buildSortKey = sortKey;

        init();

        $scope.$watch(function() { return _ctrl.selectedDay;      }, function(day){ $location.search('day', day||undefined); });
        $scope.$watch(function() { return $location.search().day; }, function(day){ _ctrl.selectedDay =     day||undefined;  });

        $scope.$watch(function() { return _ctrl.selectedFeed;      }, function(feed){ $location.search('feed', feed||undefined); });
        $scope.$watch(function() { return $location.search().feed; }, function(feed){ _ctrl.selectedFeed =     feed||undefined;  });

        return this;

        //==============================
        //
        //==============================
        function init() {

            _ctrl.selectedDay  = $location.search().day;
            _ctrl.selectedFeed = $location.search().feed;

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

                _ctrl.eventGroup   = eventGroup;
                _ctrl.feeds        = feeds;
                _ctrl.feedsMap     = feedsMap;

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

                var startOfDay = moment.tz(_ctrl.selectedDay, _ctrl.eventGroup.timezone);
                var endOfDay   = moment.tz(_ctrl.selectedDay, _ctrl.eventGroup.timezone).add(1, 'days');

                query.schedules = {
                    $elemMatch : {
                        start: { $lt:  endOfDay  .toDate() },
                        end  : { $gt:  startOfDay.toDate() }
                    }
                };
            }

            if(_ctrl.selectedFeed) {
                query.$or = [
                    { feeds : _ctrl.selectedFeed },
                    { feeds: { $size: 0 } }
                ];
            }

            return $http.get('/api/v2016/cctv-frames', { params : { q : query }}).then(function (res) {

                _ctrl.frames = res.data;

                _ctrl.frames.forEach(function(frame){

                    var start = moment.tz(_.first(frame.schedules).start, _ctrl.eventGroup.timezone);
                    var end   = moment.tz(_.last (frame.schedules).end,   _ctrl.eventGroup.timezone);

                    frame.localSchedule = {
                        startDay  : start.format("YYYY-MM-DD"),
                        startTime : start.format("HH:mm"),
                        endDay    : end  .format("YYYY-MM-DD"),
                        endTime   : end  .format("HH:mm")
                    };
                });

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function edit(id) {

            $location.path($location.path()+'/'+id);

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

            if(_ctrl.selectedDay) {
                var start = moment.tz(_.first(frame.schedules).start, _ctrl.eventGroup.timezone);
                var end   = moment.tz(_.last (frame.schedules).end,   _ctrl.eventGroup.timezone);

                return start.format("HH:mm")      + end.format("YYYY-MM-DD") +
                       start.format("YYYY-MM-DD") + end.format("HH:mm");

            } // when display a single day => sort by start time first


            return _.first(frame.schedules).start + _.last(frame.schedules).end;

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
