define(['app', 'lodash'], function(app, _) {

    app.factory("mongoStorage", ['$http','$rootScope','$q','$timeout','$filter', function($http,$rootScope,$q,$timeout,$filter) {

        var clientOrg = 0; // means cbd


        //============================================================
        //
        //============================================================
        function save(schema, doc) {
            var url = '/api/v2016/' + schema;

            var params = {};
            if (!doc.meta) doc.meta ={};
            if (!doc.meta.clientOrg) doc.meta.clientOrg = clientOrg;
            if (!doc.clientOrg) doc.clientOrg = clientOrg;
            if (doc._id) {
                params.id = doc._id;
                url = url + '/' + doc._id;

                return $http.patch(url, doc, params);
            } else {
                return $http.post(url, doc, params);
            } //create
        }


        //============================================================
        //
        //============================================================
        async function loadDoc(schema, _id) {
          try{
            const { data } = await $http.get(`/api/v2016/${schema}/${_id}`)

            return _.isEmpty(data)? false : data
          }catch(e){
            console.error('mongo-storage.loadDoc',e.data)
          }
        }

        //============================================================
        //
        //============================================================
        function getReservations(start, end, location, type,fields) {

            var params = {};

            params = {
                q: {
                    'location.room': location.room,
                    '$and': [{
                        'start': {
                            '$gte': {
                                '$date': start
                            }
                        }
                    }, {
                        'end': {
                            '$lt': {
                                '$date': end
                            }
                        }
                    }],
                    'meta.status': {
                        $nin: ['archived', 'deleted']
                    },


                },
                'f':fields
            };
            if(type)params.q.type=type;
            //TODO search if parent and if yes search for parent or children
            if (type && _.isString(type)) {
                return getChildrenTypes(type).then(function(typeArr) {
                    params.q.$and.push({
                        'type': {
                            '$in': typeArr
                        }
                    });
                    return $http.get('/api/v2016/reservations', {
                        'params': params
                    });
                });
            } else
                return $http.get('/api/v2016/reservations', {
                    'params': params
                });
        } // getDocs


        //============================================================
        //
        //============================================================
        function getRecurrences(seriesId) {

            var params = {};
            if(!parent) throw "Error: no parent id passed to getReccurences.";
            params ={ q: {
                'meta.status': {
                    $nin: ['archived', 'deleted']
                },
                //
            },s:{'start':1}};

            params.q.seriesId=seriesId;

            return   $http.get('/api/v2016/reservations/', {
                  'params': params
              });
        } // getReccurences

        //============================================================
        //
        //============================================================
        function loadDocs(schema,q, pageNumber,pageLength,count,sort,fields) {

            var params = {};
            if(!sort)
              sort={'meta.modifiedOn':-1};

            if (!schema) throw "Error: failed to indicate schema loadDocs";

            params = {
                q: q,
                sk: pageNumber,
                l: pageLength,
                s:sort,//{'meta':{'modifiedOn':1}}//{'meta.modifiedOn':1},
                f:fields,
                rp:'primary'
            };


           if(!count)
              return $http.get('/api/v2016/' + schema, {'params': params});
           else
              return injectCount(schema,params);
        }

        //============================================================
        //
        //============================================================
        function injectCount(schema,params) {

            var promises=[];

            promises[0]=$http.get('/api/v2016/' + schema, {'params':_.clone(params)});
            params.c=1;
            promises[1]=$http.get('/api/v2016/' + schema, {'params': params});

           if(!params.q['meta.status'] || _.isObject(params.q['meta.status']))
              _.each(['draft','request','published','canceled','rejected','archived'], function(status) {
                  var tempP = _.cloneDeep(params);
                  tempP.q['meta.status']=status;
                  promises.push($http.get('/api/v2016/' + schema, {'params': tempP}));
              });

            return $q.all(promises).then(function(res){
                 res[0].count=res[1].data.count;
                 res[0].facits={all:res[1].data.count};
                  var count=2;
                  if(!params.q['meta.status'] || _.isObject(params.q['meta.status']))
                    _.each(['draft','request','published','canceled','rejected','archived'], function(status) {
                        res[0].facits[status]=res[count].data.count;
                        count++;
                    });
                  else
                    res[0].facits[params.q['meta.status']]=res[1].data.count;

                  return res[0];
            });
        }
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
            const cache  = true
            const q      = { 'meta.status': 'published' }
            const params = { q }

            try{
              return $http.get('/api/v2016/inde-orgs', { params, cache });
            }catch(e){
              console.error('mongo-storage.getAllOrgs',e)
            }

        } // getDocs

        var loadOrgsInProgress=null;
        var allOrgs = [];
        //============================================================
        //
        //============================================================
        async function loadOrgs(force) {

            if(loadOrgsInProgress) return loadOrgsInProgress;

            const hasBeenModified   = await isModified('inde-orgs')
            const notInLocalStorage = !localStorage.getItem('allOrgs')
            const loadFromApi       = force || hasBeenModified || notInLocalStorage
            const cache             = true
            const q                 = { 'meta.status': 'published' } 
            const params            = { q }

            

            if(loadFromApi) {
              try{
              const promises = [ countries(), $http.get('/api/v2016/inde-orgs', { params, cache })]//

              return loadOrgsInProgress = $q.all(promises).then((data) =>{
                        const orgsAndParties = _.union(data[0], data[1].data);

                        allOrgs = orgsAndParties
                        localStorage.setItem('allOrgs', JSON.stringify(orgsAndParties));
                        return orgsAndParties;
                    });
              }catch(e){
                console.error('mongo-storage.loadOrgs', e)
              }
            }

          loadOrgsInProgress = null
            if(_.isEmpty(allOrgs))
              allOrgs = JSON.parse(localStorage.getItem('allOrgs'));

            return allOrgs;

        } // loadDocs

        var countriesData;
        //============================================================
        //
        //============================================================
        function countries() {
            if (countriesData) return $q(function(resolve) {
                return resolve(countriesData);
            });

            if (!localStorage.getItem('countries'))
                return $http.get('/api/v2015/countries', {
                    cache: true
                }).then(function(o) {
                    var countries = $filter("orderBy")(o.data, "name.en");

                    _.each(countries, function(c) {
                        c.title = c.name.en;
                        c.identifier = c.code.toLowerCase();
                        c._id = c.identifier;
                    });
                    countriesData =countries;
                    localStorage.setItem('countries', JSON.stringify(countries));
                    return countries;
                });
            else
                return $q(function(resolve) {
                    return resolve(JSON.parse(localStorage.getItem('countries')));
                });
        }

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
        function getChildrenTypes(type) {
            var types = [];
            types.push(type);
            var params = {
                q: {
                    'parent': type
                }
            };
            return $http.get('/api/v2016/types', {
                'params': params
            }).then(function(responce) {
                _.each(responce.data, function(t) {
                    types.push(t._id);
                });
                return types;
            });

        } //loadSideEventTypes

        //============================================================
        //
        //============================================================
        function syncSideEvents(conferenceId) {
            if (!conferenceId) throw "Error no confrence selected to sync";
            return $http.get('/api/v2016/reservations/sync/side-events/' + conferenceId);
        }

        var conferences = [];
        //============================================================
        //
        //============================================================
        function loadConferences(force, institution = 'CBD') {
            var allPromises = [];
            var numPromises= 1;
            var modified = true;

            allPromises[0] = isModified('conferences').then(
                function(isModified) {
                    modified = (!localStorage.getItem('allConferences') || isModified || force);
                    var params = {};
                    if (modified) {
                        params = {
                            q: {
                                  institution,
                                  timezone: { $exists: true },
                                  venueId:  { $exists: true } // TMP for compatibility with coference collection;
                            },
                             s : { StartDate : -1 },
                             f : {institution:1, Title:1,MajorEventIDs:1,StartDate:1,EndDate:1,timezone:1,schedule:1,venueId:1,seTiers:1,"conference.streamId":1, code:1, 'conference.youtubeEvents':1}
                          };
                        numPromises++;
                        allPromises[1]= $http.get('/api/v2016/conferences', {
                            'params': params
                        }).then(function(res) {
                              var oidArray = [];
                              conferences=res.data;
                              numPromises+=conferences.length;
                              _.each(conferences,function(conf){
                                oidArray=[];
                                      _.each(conf.MajorEventIDs, function(id) {
                                          oidArray.push({
                                              '$oid': id
                                          });
                                      });

                                      allPromises.push($http.get("/api/v2016/meetings", {
                                          params: {
                                              q: {
                                                  _id: {
                                                      $in: oidArray
                                                  }
                                              },
                                  //             f : {EVT_REG_MTG_CD:1,agenda:1}
                                          }
                                      }).then(function(m) {

                                          conf.meetings = m.data;
                                      }));
                              });

                          });

                    } else{
                            if(_.isEmpty(conferences))
                              conferences=JSON.parse(localStorage.getItem('allConferences'));
                            numPromises++;
                            allPromises.push($q(function(resolve) {resolve(conferences);}));
                    }
                });
                return $q(function(resolve, reject) {
                    var timeOut = setInterval(function() {
                        if ((allPromises.length === 2 && !modified) || (modified && numPromises === allPromises.length && allPromises.length > 2) )
                            $q.all(allPromises).then(function(res) {

                                clearInterval(timeOut);
                                if(modified)
                                  localStorage.setItem('allConferences', JSON.stringify(conferences));
                                resolve(conferences);
                            });

                    }, 100);
                    $timeout(function(){
                      clearInterval(timeOut);
                      reject('Error: getting conferences timed out 5 seconds');
                    },5000);
                });
        } // loadDocs


        var types = {};
        //============================================================
        //
        //============================================================
        function loadTypes(schema) {
                        var params = {
                            q: {'schema':schema,'meta.status':{'$nin':['deleted','archived']}},
                            f:{parent:1,title:1,color:1}
                          };

                        return $http.get('/api/v2016/types', {
                            'params': params
                        }).then(function(res) {

                              types[schema]=res.data;
                              _.each(types[schema], function(type, key) {
                                  type.showChildren = true;
                                  if (type.parent) {
                                      var parentObj = _.find(types[schema], {'_id': type.parent});

                                      if (!parentObj) throw "error ref to parent res type not found.";

                                      if (!parentObj.children) parentObj.children = [];
                                      parentObj.children.push(type);
                                      delete(types[schema][key]);
                                  }
                              });
                              return types[schema];
                        });
        } // loadTypes

        var isModifiedInProgress = {};
        //=======================================================================
        //
        //=======================================================================
        function isModified(schema) {

            if(!isModifiedInProgress)isModifiedInProgress = {};
            if(isModifiedInProgress && isModifiedInProgress[schema])
                return isModifiedInProgress[schema];

            var isModified      = true;
            var modifiedSchemas = localStorage.getItem('modifiedSchemas');

            if (modifiedSchemas)
                modifiedSchemas = JSON.parse(modifiedSchemas);

            isModifiedInProgress[schema]= $q(function(resolve, reject) {

                $http.get('/api/v2016/' + schema + '/last-modified').then(function(lastModified) {

                    if (!lastModified.data) reject('Error: no date returned');

                    if (!modifiedSchemas || lastModified.data !== modifiedSchemas[schema]) {
                        if (!modifiedSchemas) modifiedSchemas = {};

                        modifiedSchemas[schema] = lastModified.data;
                        localStorage.setItem('modifiedSchemas', JSON.stringify(modifiedSchemas));
                        isModifiedInProgress=null;
                        resolve(isModified);
                    } else {

                        isModified = false;
                        isModifiedInProgress=null;
                        resolve(isModified);

                    }
                }).catch(function(err) {
                    isModifiedInProgress=null;
                    reject(err);
                });

            });

            return isModifiedInProgress[schema];
        }

        async function getInstitutions(){
            params = {
                q: {
                      institution: { $exists: true },
                      timezone: { $exists: true },
                      venueId:  { $exists: true } // TMP for compatibility with coference collection;
                },
                 f : { institution: 1 }
              };
              
            const { data } = await $http.get('/api/v2016/conferences', { params })

            return Array.from(new Set(data.map(({ institution }) => institution ).filter((x)=> x!=='DISABLED')))
        }

        return { getInstitutions, 
            loadTypes:loadTypes,
            loadConferences:loadConferences,
            getRecurrences:getRecurrences,
            getConferences: getConferences,
            getAllOrgs: getAllOrgs,
            syncSideEvents: syncSideEvents,
            deleteDoc: deleteDoc,
            save: save,
            getConferenceRooms: getConferenceRooms,

            getReservations: getReservations,
            getDocs: getDocs,
            loadDocs:loadDocs,
            loadOrgs:loadOrgs,
            loadDoc:loadDoc
        }; //return
    }]); //factory
}); //require