define(['lodash', 'moment-timezone', 'app'], function(_, moment) {

    return ['$http', '$route', '$location', '$scope', '$q','scbdMenuService', function($http, $route, $location, $scope, $q,scbdMenuService) {

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
            $scope.toggle = scbdMenuService.toggle;
            
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
                _ctrl.days         = buildDates(eventGroup.StartDate, eventGroup.EndDate);
                _ctrl.selectedDay  = $route.current.params.day || "";
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
                    }
                });





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
        function buildDates(startDate, endDate) {

            var dates = [];
            var date  = moment.tz(startDate, _ctrl.eventGroup.timezone);

            while(date.isBefore(endDate)) {

                dates.push(date.format("YYYY-MM-DD"));//just take the date part;
                date.add(1, 'days');

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
