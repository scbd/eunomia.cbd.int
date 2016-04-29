define(['app', 'lodash'], function(app, _) {

    app.factory("mongoStorage", ['$http', function($http) {

        var clientOrg = 0; // means cbd

        //============================================================
        //
        //============================================================
        function saveRes(res) {
            var url = '/api/v2016/reservations';
            var doc = _.cloneDeep(res);
            delete(doc.sideEvent);
            var params = {};
            if (!doc.clientOrg) doc.clientOrg = clientOrg;
            if (doc.sideEvent) delete(doc.sideEvent);
            if (doc._id) {
                params.id = doc._id;
                url = url + '/' + doc._id;

                return $http.patch(url, doc, {
                    'params': params
                });
            } else {
                return $http.post(url, doc, params);
            } //create
        }

        //============================================================
        //
        //============================================================
        function save(schema, doc) {
            var url = '/api/v2016/' + schema;

            var params = {};
            if (!doc.clientOrg) doc.clientOrg = clientOrg;
            if (doc._id) {
                params.id = doc._id;
                url = url + '/' + doc._id;

                return $http.put(url, doc, params);
            } else {
                return $http.post(url, doc, params);
            } //create
        }

        //============================================================
        //
        //============================================================
        function getReservations(start, end, location, type) {

            var params = {};

            params = {
                q: {
                    'location.venue': location.venue,
                    'location.room': location.room,
                    '$and': [{
                        'start': {
                            '$gt': {
                                '$date': (start * 1000)
                            }
                        }
                    }, {
                        'end': {
                            '$lt': {
                                '$date': end * 1000
                            }
                        }
                    }],
                    'meta.status': {
                        $nin: ['archived', 'deleted']
                    },
                    'sideEvent.meta.status': {
                        $nin: ['archived', 'deleted']
                    }
                }
            };

            //TODO search if parent and if yes search for parent or children
            if (type && _.isString(type)){
              return getChildrenTypes(type).then(function(typeArr){
                      params.q.$and.push({
                          'type': {'$in':typeArr}
                      });
                    return $http.get('/api/v2016/reservations', {
                        'params': params
                    });
              });

            }else
            return $http.get('/api/v2016/reservations', {
                'params': params
            });
        } // getDocs

        //============================================================
        //
        //============================================================
        function getReservation(id) {

            var params = {};

            return $http.get('/api/v2016/reservations/' + id, {
                'params': params
            });
        } // getDocs

        //============================================================
        //
        //============================================================
        function getDocs(schema, status, cache) {
            if (!cache) cache = false;
            var params = {};
            if (!schema) throw "Error: failed to indicate schema loadOwnerDocs";
            if (!status) {
                params = {
                    q: {
                        'meta.status': {
                            $nin: ['archived', 'deleted']
                        }
                    },

                };
                return $http.get('/api/v2016/' + schema, {
                    'params': params,
                    'cache': cache
                });
            }
            if (!_.isArray(status)) {
                params = {
                    q: {
                        'meta.status': status
                    }
                };
                return $http.get('/api/v2016/' + schema, {
                    'params': params,
                    'cache': cache
                });
            } else {
                params = {
                    q: {
                        'meta.status': {
                            $in: status
                        }
                    }
                };
                return $http.get('/api/v2016/' + schema, {
                    'params': params,
                    'cache': cache
                });
            }
        } // getDocs

        //============================================================
        //
        //============================================================
        function getAllOrgs() {

            var params = {
                q: {
                    'meta.status': 'published'
                }
            };
            return $http.get('/api/v2016/inde-orgs', {
                'params': params,
                'cache': true
            });

        } // getDocs

        //=======================================================================
        //
        //=======================================================================
        function deleteDoc(schema, docObj, _id) {
            if (!docObj.meta) docObj.meta = {};
            docObj.meta.status = 'deleted';
            return save(schema, docObj, _id);
        }

        //============================================================
        //
        //============================================================
        function getConferenceRooms(id) {

            return $http.get('/api/v2016/conferences/' + id + '/rooms', {});
        } // getConferenceRooms


        //============================================================
        //
        //============================================================
        function getConferences() {

            var params = {};

            params = {
                q: {
                    'meta.status': {
                        $nin: ['archived', 'deleted']
                    }
                },
                s: {
                    'start': -1
                }
            };
            return $http.get('/api/v2016/conferences', {
                'params': params,
                'cache': true
            });
        }

        //============================================================
        //
        //============================================================
        function getUnscheduledSideEvents(meeting) {
            var params = {};
            params = {
                q: {
                    'link.meeting': meeting,
                    'sideEvent.meta.status': 'published',
                    'start': {
                        '$exists': 0
                    }
                }


            };
            return $http.get('/api/v2016/reservations', {
                'params': params
            });
        }


        //============================================================
        //
        //============================================================
        function getChildrenTypes(type) {
              var types = [];
              types.push(type);
              var     params = {
                    q: {
                      'parent': type
                    }
                  };
                  return $http.get('/api/v2016/reservation-types', {
                    'params': params
                  }).then(function(responce) {
                        _.each(responce.data,function(t){
                              types.push(t._id);
                        });
                        return types;
                  });

        }//loadSideEventTypes


        //============================================================
        //
        //============================================================
        function syncSideEvents(conferenceId) {
            if (!conferenceId) throw "Error no confrence selected to sync";
            return $http.get('/api/v2016/reservations/sync/side-events/' + conferenceId);
        }

        return {
            getReservation: getReservation,
            getConferences: getConferences,
            getAllOrgs: getAllOrgs,
            saveRes: saveRes,
            syncSideEvents: syncSideEvents,
            deleteDoc: deleteDoc,
            save: save,
            getConferenceRooms: getConferenceRooms,
            getUnscheduledSideEvents: getUnscheduledSideEvents,
            getReservations: getReservations,
            getDocs: getDocs,
        };
    }]);

});