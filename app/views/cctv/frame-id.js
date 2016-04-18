define(['lodash', 'app'], function(_) {

    return ['$http', '$route', '$location', '$scope', '$q', function($http, $route, $location, $scope, $q) {

        var _ctrl = this;

        _ctrl.save   = save;
        _ctrl.cancel = close;
        _ctrl.updateFeeds = updateFeeds;
        _ctrl.changedStartDay  = function() { if( _ctrl.frame.schedule.startDay  > _ctrl.frame.schedule.stopDay)  { _ctrl.frame.schedule.stopDay   = _ctrl.frame.schedule.startDay;  } };
        _ctrl.changedStopDay   = function() { if( _ctrl.frame.schedule.startDay  > _ctrl.frame.schedule.stopDay)  { _ctrl.frame.schedule.startDay  = _ctrl.frame.schedule.stopDay;   } };
        _ctrl.changedStartTime = function() { if( _ctrl.frame.schedule.startTime > _ctrl.frame.schedule.stopTime) { _ctrl.frame.schedule.stopTime  = _ctrl.frame.schedule.startTime; } };
        _ctrl.changedStopTime  = function() { if( _ctrl.frame.schedule.startTime > _ctrl.frame.schedule.stopTime) { _ctrl.frame.schedule.startTime = _ctrl.frame.schedule.stopTime;  } };

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
                var days       = buildDates(eventGroup.StartDate, eventGroup.EndDate);
                var times      = buildTimes();

                _ctrl.eventGroup   = eventGroup;
                _ctrl.feeds        = feeds;
                _ctrl.days         = days;
                _ctrl.times        = times;

            }).then(function () {

                return load();

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function load() {

            var id = $route.current.params.id;

            if(id=='new') {

                _ctrl.frame = {
                    eventGroup : $route.current.params.eventId,
                    feeds : [],
                    schedule : {
                        startDay : $route.current.params.day || _ctrl.eventGroup.StartDate.substr(0,10),
                        stopDay  : $route.current.params.day || _ctrl.eventGroup.StartDate.substr(0,10),
                        startTime: '08:00',
                        stopTime : '21:00'
                    },
                    content: {
                        type: 'news'
                    }
                };

                _ctrl.selectedFeeds = {};
            }
            else {

                $http.get('/api/v2016/cctv-frames/'+id).then(function (res) {

                    _ctrl.frame = res.data;
                    _ctrl.selectedFeeds = _.reduce(_ctrl.frame.feeds, function(ret, id){
                        ret[id] = true;
                        return ret;
                    }, {});

                }).catch(errorHandler);
            }
        }

        //==============================
        //
        //==============================
        function save() {

            var frame = _ctrl.frame;
            var id   = _ctrl.frame._id;

            var savePromise = id ? $http.put ('/api/v2016/cctv-frames/'+id, frame):
                                   $http.post('/api/v2016/cctv-frames',     frame);

            return savePromise.then(function(res) {

                frame._id = res.data._id || frame._id;

                $scope.$emit('showSuccess', 'CCTV Frame "'+frame.content.type+'" saved');

                close();

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function updateFeeds() {
            _ctrl.frame.feeds = [];

            _.forEach(_ctrl.selectedFeeds, function(selected, key) {
                if(selected)
                    _ctrl.frame.feeds.push(key);
            });
        }

        //==============================
        //
        //==============================
        function close() {

            $location.url($location.path().replace(/(.*)\/[a-z0-9]*/i, '$1'));
            $location.search({day: _ctrl.frame.schedule.startDay});

            if($route.current.params.day)
                $location.search({day: $route.current.params.day});
        }

        //==============================
        //
        //==============================
        function buildTimes() {

            var times = [];

            for(var h=0; h<24; ++h) {
                for(var m=0; m<60; m+=15){
                    var HH = ("0"+h).slice(-2);
                    var MM = ("0"+m).slice(-2);
                    times.push(HH+':'+MM);
                }
            }
            return times;
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
