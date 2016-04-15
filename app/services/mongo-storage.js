define(['app','lodash'], function (app,_) {

app.factory("mongoStorage", ['$http','authentication','$q','$location', function($http,authentication,$q,$location) {

        var user;
        authentication.getUser().then(function(u){
          user=u;

        });
        var clientOrg = 0; // means cbd

        var statuses=['draft','published','request','deleted','archived','canceled','rejected'];

        //============================================================
        //
        //============================================================
        function saveRes (res){
               var url        = '/api/v2016/reservations';
               var doc = _.cloneDeep(res);
               delete(doc.sideEvent);
               var params     = {};
                if(!doc.clientOrg)doc.clientOrg=clientOrg;
                if(doc.sideEvent) delete(doc.sideEvent);
                if(doc._id){
                    params.id = doc._id;
                    url=url+'/'+doc._id;

                    return $http.patch(url,doc,{'params':params});
                }
                else{
                    return $http.post(url,doc,params);
                }  //create
        }

        //============================================================
        //
        //============================================================
        function save (schema,doc){
               var url        = '/api/v2016/'+schema;

               var params     = {};
                if(!doc.clientOrg)doc.clientOrg=clientOrg;
                if(doc._id){
                    params.id = doc._id;
                    url=url+'/'+doc._id;

                    return $http.put(url,doc,params);
                }
                else{
                    return $http.post(url,doc,params);
                }  //create
        }

  //       //============================================================
  //       //
  //       //============================================================
  //       function loadDoc (schema,_id){
  //         //+'?q={"_id":{"$oid":"'+_id+'"},"clientOrganization":'+clientOrg+'}&f={"document":1}'
  // //console.log(schema);
  //           if(!schema) throw "Error: failed to indicate schema mongoStorageService.loadDocument";
  //           if(!_id) throw "Error: failed to indicate _id mongoStorageService.loadDocument"
  //           var params = {
  //                         'f':{'document':1}
  //                       };
  //           return $q.when( $http.get('/api/v2016/'+schema+'/'+_id))//}&f={"document":1}'))
  //                  .then(
  //
  //                       function(response){
  //                           if(!_.isEmpty(response.data)){
  //                               response.data.initialState=_.cloneDeep(response.data);
  //                               delete(response.data.initialState.history);
  //                               return  response.data;
  //                           }
  //                           else
  //                             return false;
  //                       }
  //                 );
  //       }

        //============================================================
        //
        //============================================================
        function  loadReservations(start,end,venue,type){

          var params={};

            params = {
                        q:{'location.venue':venue,
                           'start':{'$gt':{'$date':(start*1000)}},
                           'end':{'$lt':{'$date':end*1000}},
                           'type':type
                         }
                      };
            return $http.get('/api/v2016/reservations',{'params':params});


        }// loadDocs




        //============================================================
        //
        //============================================================
        function loadDocs (schema,status,cache){
            if(!cache)cache=false;
            var params={};
            if(!schema) throw "Error: failed to indicate schema loadOwnerDocs";
            if(!status){
              params = {
                          q:{'meta.status':{$nin:['archived','deleted']}
                            },

                        };
              return $http.get('/api/v2016/'+schema,{'params':params, 'cache':cache});
            }
            if(!_.isArray(status)){
              params = {
                          q:{'meta.status':status}
                        };
              return $http.get('/api/v2016/'+schema,{'params':params, 'cache':cache});
            }
            else {
                params = {
                            q:{'meta.status':{$in:status}}
                          };
              return $http.get('/api/v2016/'+schema,{'params':params, 'cache':cache});
            }
        }// loadDocs
        //============================================================
        //
        //============================================================
        function loadOrgs (){

              var params = {
                          q:{'meta.status':'published'}


                        };
              return $http.get('/api/v2016/inde-orgs',{'params':params, 'cache':true});

        }// loadDocs
        // //============================================================
        // //
        // //============================================================
        // function loadRoomsByVenue(venue){
        //
        //     var params={};
        //     params = {
        //                 q:{'meta.status':{$nin:['archived','deleted']},
        //                    'meta.v':{$ne:0},
        //                    'venue':{$ne:0},
        //                   },
        //               };
        //     return $http.get('/api/v2015/rooms',{'params':params});
        // }

        //=======================================================================
        //
        //=======================================================================
        function archiveDoc(schema,docObj,_id){

              docObj.meta.status='archived';
              return save(schema,docObj,_id);
        }
        //=======================================================================
        //
        //=======================================================================
        function deleteDoc(schema,docObj,_id){

              docObj.meta.status='deleted';
              return save(schema,docObj,_id);
        }

        //=======================================================================
        //
        //=======================================================================
        function unArchiveDoc(schema,docObj,_id){

              docObj.meta.status='draft';
              return save(schema,docObj,_id);
        }
        //============================================================
        //
        //============================================================
        function loadConferenceRooms(id){

              return $http.get('/api/v2016/conferences/'+id+'/rooms',{});
        }// loadConferenceRooms

        //============================================================
        //
        //============================================================
        function loadconferences (){

            var params={};

            if(!status){
              params = {
                          q:{'meta.status':{$nin:['archived','deleted']}},
                          s:{'start':-1}
                        };
              return $http.get('/api/v2016/conferences',{'params':params, 'cache':true});
            }

        }
        //============================================================
        //
        //============================================================
        function loadUnscheduledSideEvents (meeting){

            var params={};


              params = {
                          q:{'link.meeting':meeting,
                            'sideEvent.meta.status':'published',
                              'start':{'$exists':0}
                            }


                        };
              return $http.get('/api/v2016/reservations',{'params':params});


        }

        //============================================================
        //
        //============================================================
        function syncSideEvents (conferenceId){
              if(!conferenceId) throw "Error no confrence selected to sync";
              return $http.get('/api/v2016/reservations/sync/side-events/'+conferenceId);
        }




        return{
          loadOrgs: loadOrgs,
          saveRes: saveRes,
          syncSideEvents: syncSideEvents,
          deleteDoc: deleteDoc,
          //        loadDoc:loadDoc,
          save: save,
          loadConferenceRooms: loadConferenceRooms,
          loadUnscheduledSideEvents: loadUnscheduledSideEvents,
          archiveDoc: archiveDoc,
          loadReservations: loadReservations,
          loadDocs: loadDocs,
          loadconferences: loadconferences,
          unArchiveDoc: unArchiveDoc
        };
}]);

});