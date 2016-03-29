define(['app','lodash','libs/js-sha256/build/sha256.min','scbd-angularjs-services/locale'], function (app,_) {

app.factory("mongoStorage", ['$http','authentication','$q','locale','$location', function($http,authentication,$q,locale,$location) {

        var user;
        authentication.getUser().then(function(u){
          user=u;

        });
        var clientOrg = 0; // means cbd

        var statuses=['draft','published','request','deleted','archived','canceled','rejected'];


        //============================================================
        //
        //============================================================
        function loadDoc (schema,_id){
          //+'?q={"_id":{"$oid":"'+_id+'"},"clientOrganization":'+clientOrg+'}&f={"document":1}'
            if(!schema) throw "Error: failed to indicate schema mongoStorageService.loadDocument";
            var params = {
                          q:{_id:{$oid:_id}}
                        };
            return $q.when( $http.get('/api/v2015/'+schema,{'params':params}))//}&f={"document":1}'))
                   .then(
                        function(response){
                            if(response.data.length)
                                return  response.data[0];
                            else
                              return false;
                        }
                  );
        }

        //============================================================
        //
        //============================================================
        function loadDocs (schema,status){
          //+'?q={"_id":{"$oid":"'+_id+'"},"clientOrganization":'+clientOrg+'}&f={"document":1}'

            var params={};
            if(!schema) throw "Error: failed to indicate schema loadOwnerDocs";
            if(!status){
              params = {
                          q:{'meta.status':{$nin:['archived','deleted']},
                              'meta.v':{$ne:0}
                            },

                        };
              return $http.get('/api/v2015/'+schema,{'params':params});
            }
            if(!_.isArray(status)){
              params = {
                          q:{'meta.status':status,
                          'meta.v':{$ne:0}
                            },

                        };
              return $http.get('/api/v2015/'+schema,{'params':params});
            }
            else {
                params = {
                            q:{'meta.status':{$in:status},
                            'meta.v':{$ne:0}
                              },

                          };
              return $http.get('/api/v2015/'+schema,{'params':params});
            }


        }


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
        function requestDoc(schema,docObj,_id){

              docObj.meta.status='request';
              return save(schema,docObj,_id);
        }
        //=======================================================================
        //
        //=======================================================================
        function approveDoc(schema,docObj,_id){

              docObj.meta.status='published';
              return save(schema,docObj,_id);
        }
        //=======================================================================
        //
        //=======================================================================
        function cancelDoc(schema,docObj,_id){

              docObj.meta.status='canceled';
              return save(schema,docObj,_id);
        }
        //=======================================================================
        //
        //=======================================================================
        function rejectDoc(schema,docObj,_id){

              docObj.meta.status='rejected';
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

        //=======================================================================
        //
        //=======================================================================
        function getStatusFacits(schema,statusFacits,statArry,stat){
              statusFacits.all=0;
              if(!statArry)
                statArry=statuses;
              if(stat){
                $http.get('/api/v2015/'+schema+'?c=1&q={"meta.status":"'+stat+'","meta.v":{"$ne":0}}').then(
                  function(res){

                    statusFacits[stat]=res.data.count;
                    statusFacits['all']+=res.data.count;
                  }
                );
              }
              else
              _.each(statArry,function(status){

                    $http.get('/api/v2015/'+schema+'?c=1&q={"meta.status":"'+status+'","meta.v":{"$ne":0}}').then(
                      function(res){
                        statusFacits[status]=res.data.count;
                        statusFacits['all']+=res.data.count;
                      }
                    );

              });
        }//getStatusFacits


        //============================================================
        //
        //============================================================
        function loadConfrences (){

            var params={};

            if(!status){
              params = {
                          q:{'meta.status':{$nin:['archived','deleted']},
                              'meta.v':{$ne:0}
                            },
                          s:{'start':-1}

                        };
              return $http.get('/api/v2015/confrences',{'params':params});
            }

        }
        //============================================================
        //
        //============================================================
        function loadUnscheduledSideEvents (meeting){

            var params={};


              params = {
                          q:{'link.meeting':meeting,
                              'start':{'$exists':0}
                            }


                        };
              return $http.get('/api/v2016/reservations',{'params':params});


        }
        //============================================================
        //
        //============================================================
        function loadRooms (venId){

            var params={};

            if(!status){
              params = {
                q:{'_id':{$oid:venId},
                    'meta.v':{$ne:0}
                  },
                          f:{'rooms':1}

                        };
              return $http.get('/api/v2015/venues/',{'params':params}).then(function(data){if( data.data[0]) return data.data[0].rooms});
            }

        }




        return{
          loadRooms:loadRooms,

          requestDoc:requestDoc,
          rejectDoc:rejectDoc,
          approveDoc:approveDoc,
          cancelDoc:cancelDoc,

          getStatusFacits:getStatusFacits,
          deleteDoc:deleteDoc,
          loadDoc:loadDoc,

loadUnscheduledSideEvents:loadUnscheduledSideEvents,
          archiveDoc:archiveDoc,

          loadDocs:loadDocs,
          loadConfrences :loadConfrences ,
          unArchiveDoc:unArchiveDoc
        };
}]);

});