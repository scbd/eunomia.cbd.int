define(['app', 'lodash', 'moment', 'jquery',
    'services/mongo-storage',
    'directives/sorter',
    'filters/moment',
    'filters/propsFilter',
    'filters/htmlToPlaintext',
    'ngDialog',
    'ui.select',
    'services/when-element',
    'BM-date-picker'
], function (app, _, moment, $) {

    return ['$document', 'mongoStorage', 'eventGroup', '$location', '$q', 'whenElement', '$timeout', '$rootScope', '$http', 'user', '$scope', 'accountsUrl',
            function ($document, mongoStorage, conference, $location, $q, whenElement, $timeout, $rootScope, $http, user, $scope, accountsUrl) {
       
        const adminRoles = ['Administrator', 'EunoAdministrator', 'EunomiaYoutubeReadAccess'];    
        var _ctrl = this;
        var DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm'

        _ctrl.conference = conference;

        _ctrl.count = 0;
        _ctrl.options = {};
        _ctrl.sort = {
            'title': 1
        };
        _ctrl.venueId = conference.venueId;
        _ctrl.itemsPerPage = 50;
        _ctrl.currentPage = 0;
        _ctrl.pages = [];
        _ctrl.searchRoomChange = searchRoomChange;
        _ctrl.searchTypeChange = searchTypeChange;
        _ctrl.onPage = getReservations;
        // _ctrl.changeDate = changeDate;
        _ctrl.getRoom = getRoom;
        _ctrl.getType = getType;
        // _ctrl.toggleFields = toggleFields;
        // _ctrl.isFieldSelect = isFieldSelect;
        // _ctrl.getPrefix = getPrefix;
        _ctrl.hasDayChange = hasDayChange;
        _ctrl.hybridOnlyChange = hybridOnlyChange;
        _ctrl.searchText = '';
        _ctrl.searchType = [];
        _ctrl.searchRoom = [];
        _ctrl.getReservations = getReservations;
        _ctrl.showFields = true;
        _ctrl.sort = {
            'start': 1
        };
        _ctrl.selectFields = ['Date', 'Room', 'Title', 'Type','Interactio'];
        _ctrl.fields = [{
            title: 'Title'
        }, {
            title: 'Description'
        }, {
            title: 'Room'
        }, {
            title: 'Date'
        }, {
            title: 'Type'
        }, {
            title: 'Options'
        }, {
            title: 'Agenda Items'
        }, {
            title: 'CCTV Message'
        }, {
            title: 'Modified'
        }, {
            title: 'Interactio'
        }];
        _ctrl.isYoutube = isYoutube;
        _ctrl.showLinks = showLinks;
        _ctrl.copyToClipboard = copyToClipboard;
        
        _ctrl.canAccessKeys        = _.intersection(user.roles, adminRoles).length > 0;
        _ctrl.returnUrl = encodeURI(window.location.href);
        _ctrl.isSignedIn = user.isAuthenticated;
        _ctrl.accountsUrl = accountsUrl;
        init(true);

        return this;


        //============================================================
        //
        //============================================================
        function init() {
            const {
                schedule,
                timezone
            } = conference
            const {
                start,
                end
            } = schedule

            moment.tz.setDefault(timezone);

            _ctrl.conference.startObj = moment(start);
            _ctrl.conference.endObj = moment(end);

            const {
                start: urlStart,
                end: urlEnd,
                itemsPerPage
            } = $location.search()

            if(urlStart)
                _ctrl.startFilter = moment(urlStart).format('YYYY-MM-DD')+' 00:00'; 
            else if (moment(start) > moment())
                _ctrl.startFilter = moment(start).format('YYYY-MM-DD')+' 00:00';
            else 
                _ctrl.startFilter = moment().format('YYYY-MM-DD HH:mm');
                
            if(urlEnd)
                _ctrl.endFilter = moment(urlEnd).format('YYYY-MM-DD')+' 23:59' 
            else if (moment(_ctrl.startFilter) > moment())
                _ctrl.endFilter = moment(_ctrl.startFilter).add(1, 'days').format('YYYY-MM-DD')+' 23:59';
            else 
                _ctrl.endFilter = moment().add(1, 'days').format('YYYY-MM-DD')+' 23:59';
                
            
            if (_ctrl.startFilter)
                _ctrl.start = _ctrl.startFilter;

            if ( _ctrl.endFilter)
                _ctrl.end =  _ctrl.endFilter;    

            // if (!(urlStart && urlEnd)) changeDate();

            initStartDatePicker().then(initEndDatePicker)

            if ($location.search().itemsPerPage)
                _ctrl.itemsPerPage = $location.search().itemsPerPage;

            if ($location.search().searchType) {

                if (!_.isArray($location.search().searchType))
                    _ctrl.searchType = [$location.search().searchType];
                else
                    _ctrl.searchType = $location.search().searchType;

            }

            if ($location.search().searchRoom) {

                if (!_.isArray($location.search().searchRoom))
                    _ctrl.searchRoom = [$location.search().searchRoom];
                else
                    _ctrl.searchRoom = $location.search().searchRoom;

            }
            if ($location.search().isHybridOnly) {
                _ctrl.isHybridOnly = true;
            }

            $q.all([loadRooms(), loadTypes()]).then(function(){
                getReservations();
                $.material.init();
            });

        } //init

        function initStartDatePicker() {
            return whenElement('start-filter', $document).then(function($el){
                
                var urlStart = $location.search().start;

                var confTiming = getConferenceTiming();
                var timezone = confTiming.timezone
                var start = confTiming.start
                var end = confTiming.end

                var dateTimeObject = moment.tz(urlStart || start, timezone)

                $el.bootstrapMaterialDatePicker({
                    switchOnClick: true,
                    date: true,
                    year: true,
                    time: false,
                    format: DATE_TIME_FORMAT,
                    clearButton: false,
                    weekStart: 0
                });
                $el.bootstrapMaterialDatePicker('setDate', dateTimeObject);
                $el.bootstrapMaterialDatePicker('setMinDate', moment(start));
                $el.bootstrapMaterialDatePicker('setMaxDate', end);

                $el.on('change', (e, date) => $timeout(() => $location.search('start', date.format()), 100))
                
            })
        }

        async function initEndDatePicker() {
           return  whenElement('end-filter', $document).then(function($el){
               var endUrl = $location.search().end
               var urlStart = $location.search().start                
           
                var confTiming = getConferenceTiming();
                var timezone = confTiming.timezone
                var start = confTiming.start
                var end = confTiming.end

                var dateTimeObject = moment.tz(endUrl || end, timezone)

                $el.bootstrapMaterialDatePicker({
                    switchOnClick: true,
                    date: true,
                    year: true,
                    time: false,
                    format: 'dddd YYYY-MM-DD',
                    clearButton: false,
                    weekStart: 0
                });
                $el.bootstrapMaterialDatePicker('setDate', dateTimeObject);
                $el.bootstrapMaterialDatePicker('setMinDate', start);
                $el.bootstrapMaterialDatePicker('setMaxDate', end);

                $el.on('change', (e, date) => $timeout(() => $location.search('end', date.format()), 100))               
            })
        }

        function getConferenceTiming() {
            var timezone = conference.timezone
            var schedule = conference.schedule
            
            var start = moment(schedule.start).startOf('day')
            var end = moment(schedule.end).startOf('day').add(1, 'day')

            return {
                timezone,
                start,
                end
            }
        }

        // //============================================================
        // //
        // //============================================================
        // function getPrefix(item) {

        //     var meeting = _.find(conference.meetings, {
        //         EVT_CD: item.meeting
        //     });
        //     if (!meeting) return '';
        //     return meeting.agenda.prefix;
        // } //itemSelected

        // //============================================================
        // //
        // //============================================================
        // function updateFields() {
        //     localStorage.setItem('reservations-colums', JSON.stringify(_ctrl.selectFields));
        // } //itemSelected

        // //============================================================
        // //
        // //============================================================
        function hasDayChange(dayOne, dayTwo) {
            if (!dayTwo || !dayOne) return false;

            if (!moment(dayOne).startOf('day').isSame(moment(dayTwo).startOf('day')))
                return true;
        } //itemSelected

        // //============================================================
        // //
        // //============================================================
        function getReservations(pageIndex) {

            _ctrl.loading = true;
            if (!pageIndex || !Number(pageIndex)) pageIndex = 0;

            _ctrl.itemsPerPage = Number(_ctrl.itemsPerPage);
            var q = buildQuery(); //{'location.conference':conference._id};
            var f = {
                title: 1,
                start: 1,
                end: 1,
                location: 1,
                'sideEvent.title': 1,
                'sideEvent.id': 1,
                type: 1,
                agenda: 1,
                seriesId: 1,
                'meta.modifiedOn': 1,
                interactioEventId: 1,
                linksTemplate: 1,
                links:1,
                youtube:1
            };



            return mongoStorage.loadDocs('reservations', q, pageIndex, _ctrl.itemsPerPage, true, _ctrl.sort, f).then(
                function ({
                    count,
                    data
                }) {
                    console.log(count)
                    _ctrl.count = count;
                    _ctrl.docs = data;
                    refreshPager(pageIndex);
                    _ctrl.loading = false;
                    return data;
                }
            ); // mongoStorage.getReservations

        } // getReservations

        //=======================================================================
        //
        //=======================================================================
        function buildQuery() {
            var q = {};

            q.start = {
                '$exists': 1
            };
            q.start = {
                '$ne': null
            };
            //        if(_ctrl.conference) q['location.conference']=_ctrl.conference._id;


            if (_ctrl.searchType?.length) {
                q['type'] = {
                    '$in': _ctrl.searchType
                };
            }

            if (_ctrl.searchRoom?.length) {

                q['location.room'] = {
                    '$in': _ctrl.searchRoom
                };
            }

            if ($location.search().searchText) {
                _ctrl.searchText = $location.search().searchText;
                q['$text'] = {
                    '$search': '"' + _ctrl.searchText + '"'
                }; // jshint ignore:line
            }


            if (_ctrl.start && _ctrl.end)
                q['$and'] = [{
                    'start': {
                        '$gte': {
                            '$date': _ctrl.start
                        }
                    }
                }, {
                    'end': {
                        '$lt': {
                            '$date': _ctrl.end
                        }
                    }
                }];

            if(_ctrl.isHybridOnly)
                q.interactioEventId = { $exists : true}

            q['meta.status'] = {
                '$nin': ['deleted', 'archived']
            };
            //        q.type={'$in':_ctrl.seTypes};
            return q;
        }

        //======================================================
        //
        //
        //======================================================
        function refreshPager(currentPage) {
            currentPage = currentPage || 0;

            var pageCount = Math.ceil(Math.max(_ctrl.count || 0, 0) / Number(_ctrl.itemsPerPage)) - 1;

            var pages = [];
            var start = 0;
            var end = (pageCount < 5) ? pageCount : 5;

            if (currentPage > 0 && currentPage <= pageCount && (pageCount >= 5)) {
                start = currentPage - 2;
                end = currentPage + 2;
                if (end > pageCount)
                    end = pageCount;



                for (var i = start; i <= end; i++) {
                    pages.push({
                        index: i,
                        text: i + 1
                    });
                }
            } else {
                if (pageCount < 5) end++;
                for (var i = start; i < end; i++) { //jshint ignore:line
                    pages.push({
                        index: i,
                        text: i + 1
                    });
                }
            }

            _ctrl.currentPage = currentPage;
            _ctrl.pages = pages;
            _ctrl.pageCount = pageCount;
        }


        // //=====

        //============================================================
        //q, pageNumber,pageLength,count,sort
        //============================================================
        function loadRooms() {

            if (_ctrl.conference.rooms && !_.isEmpty(_ctrl.conference.rooms)) {
                return $q(function (resolve) {
                    resolve(true)
                });
            }
            var q = {
                'venue': _ctrl.venueId,
                'meta.status': {
                    '$nin': ['deleted', 'archived']
                }
            };
            return mongoStorage.loadDocs('venue-rooms', q, 0, 100000, false, _ctrl.sort).then(function (result) {

                _ctrl.conference.rooms = result.data;
            }).catch(onError);
        }
        // //============================================================
        // //
        // //============================================================
        // function isFieldSelect(field) {
        //     return (_ctrl.selectFields.indexOf(field) > -1);
        // }

        // //============================================================
        // //
        // //============================================================
        // function toggleFields() {

        //     _ctrl.showFields = !_ctrl.showFields;
        // }
        // //============================================================
        // //q, pageNumber,pageLength,count,sort
        //============================================================
        function getRoom(id, property) {

            var room = _.find(_ctrl.conference.rooms, {
                _id: id
            });

            if (!room) return '';
            if (!property) return room;
            return room[property];
        }
        //============================================================
        //q, pageNumber,pageLength,count,sort
        //============================================================
        function getType(id, schema, property) {
            if (!_ctrl.conference.types) return '';
            var type = _.find(_ctrl.conference.types[schema], {
                _id: id
            });

            if (!type) return '';
            if (!property) return type;
            return type[property];
        }
        //============================================================
        //
        //============================================================
        function loadTypes() {

            if (_ctrl.conference.types && _ctrl.conference.types.reservation && !_.isEmpty(_ctrl.conference.types.reservation)) {
                return $q(function (resolve) {
                    resolve(true)
                });
            }
            var q = {
                schema: 'reservations'
            };
            return mongoStorage.loadDocs('types', q, 0, 100000, false).then(function (result) {
                _ctrl.conference.types = {};
                _ctrl.conference.types.reservation = result.data;

            }).catch(onError);
        } //triggerChanges


        // function updateQueryString(field, value){
        //     $location.search(field, value);
        // }

        function searchRoomChange(){
            $location.search('searchRoom', _ctrl.searchRoom);
        }
        function searchTypeChange(){
            $location.search('searchType', _ctrl.searchType);
        }

        function hybridOnlyChange(){
            if(_ctrl.isHybridOnly)
                $location.search('isHybridOnly', _ctrl.isHybridOnly);
            else 
                $location.search('isHybridOnly', undefined);
        }

        //============================================================
        //
        //============================================================
        function onError(res) {
            var status, error;
            status = "error";
            if (res.status === -1) {
                error = "The URI " + res.config.url + " could not be resolved.  This could be caused form a number of reasons.  The URI does not exist or is erroneous.  The server located at that URI is down.  Or lastly your internet connection stopped or stopped momentarily. ";
                if (res.data && res.data.message)
                    error += " Message Detail: " + res.data.message;
            }
            if (res.status == "notAuthorized") {
                error = "You are not authorized to perform this action: [Method:" + res.config.method + " URI:" + res.config.url + "]";
                if (res.data.message)
                    error += " Message Detail: " + res.data.message;
            } else if (res.status == 404) {
                error = "The server at URI: " + res.config.url + " has responded that the record was not found.";
                if (res.data.message)
                    error += " Message Detail: " + res.data.message;
            } else if (res.status == 500) {
                error = "The server at URI: " + res.config.url + " has responded with an internal server error message.";
                if (res.data.message)
                    error += " Message Detail: " + res.data.message;
            } else if (res.status == "badSchema") {
                error = "Record type is invalid meaning that the data being sent to the server is not in a  supported format.";
            } else if (res.data && res.data.Message)
                error = res.data.Message;
            else
                error = res.data;
        }

        function isYoutube(url) {
            return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url||'');
        }

        function showLinks(doc){
            doc.showLinks = !doc.showLinks;

            if(doc.showLinks){
                if(!doc.youtubeKeysLoaded && _ctrl.canAccessKeys){
                    doc.loadingKeys = true;

                    $http.get(`/api/v2016/reservations/${doc._id}/youtube-broadcast`)
                    .then((res)=>{
                        const youtubeDetails = res.data
                        youtubeDetails.forEach(element => {
                            
                            const link = doc.links.find(e=>{
                                ///{isYoutube(e.url) && e._id == `${doc._id}_${e.locale}`
                                if(isYoutube(e.url)){
                                    const urlCode = e.url.replace('https://youtu.be/', '');
                                    return urlCode == element.broadcast.id
                                } 
                            });
                            if(link){
                                link.broadcast = element.broadcast;
                                link.stream    = element.stream;
                                doc.youtubeKeysLoaded = true;
                            }
                        });
                    })
                    .finally(function(){
                        doc.loadingKeys = false;
                    })
                }

                if(doc.interactioEventId){
                    $http.get(`/api/v2022/interactio-events-map`, {params : {q : { interactioEventId :doc.interactioEventId }}})
                    .then (function(res) { return (res.data[0]||{}); })
                    .catch(function(err) { return null })
                    .then (function(evt) {doc.interactioEvent=evt});
                }
            }
        }

        function copyToClipboard(text) {
            if (window.clipboardData) { // Internet Explorer
                window.clipboardData.setData("Text", text);
            } else {
              navigator.clipboard.writeText(text);
            }
            $scope.$emit('showSuccess', `Successfully copied(${text.substr(0, 6)}...) to clipboard.`);
        }
    }];

});