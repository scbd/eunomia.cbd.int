define(['require', 'lodash', 'angular', 'moment-timezone', 'app', 'directives/date-picker', 'filters/moment', 'services/when-element',
        'directives/cctv/frames/schedule', 'directives/cctv/frames/announcement', 'directives/cctv/frames/news',
       ], function(require, _, ng, moment) {

    return ['$http', '$route', '$location', '$scope', '$q', '$compile', 'eventGroup','$document', 'whenElement', function($http, $route, $location, $scope, $q, $compile, eventGroup, $document, whenElement ) {

        var _ctrl = this;

        _ctrl.save   = save;
        _ctrl.cancel = close;
        _ctrl.updateFeeds = updateFeeds;
        _ctrl.eventGroup  = eventGroup;

        _ctrl.dateChanged  = function(field) {

            var start = moment(_ctrl.start);
            var end   = moment(_ctrl.end  );

            if(start.isAfter(end)) {
                if(field=='start') end   = moment(start).add( 1, 'hours');
                else               start = moment(end)  .add(-1, 'hours');
            }

            _ctrl.start = moment(start).format("YYYY-MM-DD HH:mm");
            _ctrl.end   = moment(end  ).format("YYYY-MM-DD HH:mm");

            updateSchedules()
        };

        init();

        return this;

        //==============================
        //
        //==============================
        function init() {

            return $http.get('/api/v2016/cctv-feeds', { params : { q : { eventGroup : eventGroup._id } }}).then(function(res) {

                _ctrl.feeds = res.data;

            }).then(function () {

                return load();

            }).catch(errorHandler);
        }

        //==============================
        //
        //==============================
        function load() {

            $q.when($route.current.params.id).then(function(frameId) {

                if(frameId=='new') {

                    var day;
                    var minDay = moment(eventGroup.schedule.start);

                    day = moment.tz($route.current.params.day || new Date(), eventGroup.timezone);

                    if(!day.isValid() || day.isBefore(minDay))
                        day = new moment(minDay);

                    var start = moment(day).startOf('day').toDate(); //  0:00
                    var end   = moment(day).startOf('day').hour(23).minute(55).toDate(); // 23:55
                    
                    var streamId = (eventGroup.conference||{}).streamId;
                    var selectdFeeds = _(_ctrl.feeds)
                        .filter(function(f) { return streamId && streamId == f.code; })
                        .map   (function(f) { return f._id; })
                        .value()

                    return {
                        eventGroup : _ctrl.eventGroup._id,
                        content: { type: 'announcement' },
                        scheduleType : 'continuous',
                        schedules : buildDailySchedules(start, end, 'continuous'),
                        feeds : selectdFeeds
                    };
                }
                else {

                    return $http.get('/api/v2016/cctv-frames/'+frameId).then(function (res) {
                        res.data.scheduleType = res.data.scheduleType || 'daily'; // TMP patch
                        return res.data;
                    });
                }

            }).then(async function(frame){

                _ctrl.frame = frame;

                _ctrl.start = moment(_.first(frame.schedules).start).format("YYYY-MM-DD HH:mm");
                _ctrl.end   = moment(_.last (frame.schedules).end  ).format("YYYY-MM-DD HH:mm");

                _ctrl.selectedFeeds = _.reduce(frame.feeds, function(ret, id){
                    ret[id] = true;
                    return ret;
                }, {});


                const $startEl = await whenElement('start', $document)
            
                $startEl.bootstrapMaterialDatePicker({ switchOnClick: true, time: true, date: true, format: "YYYY-MM-DD HH:mm", clearButton: false, weekStart: 0 })
                $startEl.bootstrapMaterialDatePicker('start', moment(_.first(frame.schedules).start).format("YYYY-MM-DD HH:mm"));

                const $endEl = await whenElement('end', $document)
            
                $endEl.bootstrapMaterialDatePicker({ switchOnClick: true, time: true, date: true, format: "YYYY-MM-DD HH:mm", clearButton: false, weekStart: 0 })
                $endEl.bootstrapMaterialDatePicker('end', moment(_.last (frame.schedules).end  ).format("YYYY-MM-DD HH:mm"));
            });
        }

        //==============================
        //
        //==============================
        function save() {

            var frame = _ctrl.frame;
            var id    = _ctrl.frame._id;

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
        function updateSchedules() {

            var start = moment(_ctrl.start).toDate();
            var end   = moment(_ctrl.end  ).toDate();

            _ctrl.frame.schedules = buildDailySchedules(start, end, _ctrl.frame.scheduleType);
        }

        //==============================
        //
        //==============================
        function buildDailySchedules(start, end, scheduleType) {

            start = moment(start).utc();
            end   = moment(end)  .utc();

            if(end.isBefore(start))
                throw "bad schedule dates";

            var schedules = [];

            if(scheduleType=="continuous") {

                schedules.push({
                    start : start.toDate(),
                    end   : end  .toDate()
                });

            }
            else if(scheduleType=="daily") {

                var loopGuard=64;

                while(start.isSameOrBefore(end)) {

                    var dailyStart = moment(start).utc();
                    var dailyEnd   = moment(start).utc().hour(end.hour()).minute(end.minute());

                    if(dailyEnd.isBefore(dailyStart))
                        dailyEnd.add(1, 'days');

                    schedules.push({
                        start : dailyStart.toDate(),
                        end   : dailyEnd  .toDate()
                    });

                    start = start.add(1, 'days');

                    if(--loopGuard<0) throw "loop detected";
                }
            }
            else {
                throw "Unknown scheduleType: " + scheduleType;

            }

            return schedules;
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
