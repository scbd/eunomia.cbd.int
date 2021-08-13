define(['lodash', 'moment-timezone', 'app', 'directives/date-picker', 'filters/moment'], function(_, moment) {

    return ['$http', '$route', '$location', '$scope', '$q', 'eventGroup','$window', function($http, $route, $location, $scope, $q, eventGroup,$window) {

        var _ctrl = this;

        _ctrl.eventGroup = eventGroup;
        _ctrl.refresh    = load;
        _ctrl.edit       = edit;
        _ctrl.delete     = del;
        _ctrl.buildSortKey = sortKey;
        _ctrl.getCctvUrl   = getCctvUrl;

        init();

        $scope.$watch(function() { return _ctrl.selectedType;      }, function(type){ $location.search('type', type||undefined); });
        $scope.$watch(function() { return $location.search().type; }, function(type){ _ctrl.selectedType =     type||undefined;  });

        $scope.$watch(function() { return _ctrl.selectedDay;      }, function(day){ $location.search('day', day||undefined); });
        $scope.$watch(function() { return $location.search().day; }, function(day){ _ctrl.selectedDay =     day||undefined;  });

        $scope.$watch(function() { return _ctrl.selectedFeed;      }, function(feed){ $location.search('feed', feed||undefined); });
        $scope.$watch(function() { return $location.search().feed; }, function(feed){ _ctrl.selectedFeed =     feed||undefined;  });

        return this;

        //==============================
        //
        //==============================
        function init() {

            _ctrl.selectedDay     = $location.search().day;
            _ctrl.selectedFeed    = $location.search().feed;
            _ctrl.selectedType    = $location.search().type;

            return $http.get('/api/v2016/cctv-feeds', { params : { q : { eventGroup : eventGroup._id } }}).then(function(res) {

                var feeds      = res.data || [];
                var feedsMap   = _.reduce(feeds, function(ret, feed) {
                    ret[feed._id] = feed;
                    return ret;
                }, {});

                _ctrl.feeds             = feeds;
                _ctrl.selectedFeedLink  =(feeds[0]||{}).code;
                _ctrl.feedsMap          = feedsMap;

            }).then(function () {

                return load();

            }).catch(errorHandler);
        }


        //==============================
        //
        //==============================
        function getCctvUrl(feed,day) {

            var url = 'https://www.cbd.int/cctv/help/event-information?streamId='+encodeURIComponent(feed);

            if(day)
                url+= '&datetime='+encodeURIComponent(moment(day).format('YYYY-MM-DDTHH:mm'));

            return url;

        }

        //==============================
        //
        //==============================
        function load() {

            var query = { eventGroup : eventGroup._id };

            if(_ctrl.selectedDay) {

                var startOfDay = moment(_ctrl.selectedDay);
                var endOfDay   = moment(_ctrl.selectedDay).add(1, 'days');

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

            if(_ctrl.selectedType) {
                query['content.type'] = _ctrl.selectedType;
            }

            return $http.get('/api/v2016/cctv-frames', { params : { q : query }}).then(function (res) {

                _ctrl.frames = res.data;

                _ctrl.frames.forEach(function(frame){

                    var start = moment(_.first(frame.schedules).start);
                    var end   = moment(_.last (frame.schedules).end);

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
                var start = moment(_.first(frame.schedules).start);
                var end   = moment(_.last (frame.schedules).end);

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
