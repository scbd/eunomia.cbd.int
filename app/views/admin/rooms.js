define(['app','lodash',
  'text!directives/forms/edit/delete-dialog.html',
  'text!directives/forms/edit/room-dialog.html',
  'services/mongo-storage',
  'directives/tool-tip',
  'directives/sorter',
  'directives/forms/edit/room',
  'ngDialog',
  'directives/color-picker',
    'css!libs/angular-dragula/dist/dragula.css',
], function(app, _,deleteDialog,roomDialog) {

return  ['$scope','$document','mongoStorage','ngDialog','$rootScope','$timeout','eventGroup','dragulaService',function($scope,$document,mongoStorage,ngDialog,$rootScope,$timeout,conference,dragulaService) {

  $scope.$parent.$on('list-bag.drop-model', function() {
          if(!_.isEmpty(_ctrl.docs)){
              _.each( _ctrl.docs,function(item,index){
                item.sort=index;
                save(item);
              });
          }
  });

      var _ctrl = this;
      _ctrl.count = 0;
      _ctrl.options = {};
      _ctrl.sort = {'sort':1};
      _ctrl.venueId = conference.venueId;
      _ctrl.edit   = editDialog;
      _ctrl.delete = del;
      _ctrl.load = loadRooms;
      _ctrl.save = save;
      _ctrl.getType =getType;

      init();



      return this;


      //============================================================
      //
      //============================================================
      function init() {
         loadRooms();
         loadTypes();
         loadVenues();
      } //init

      //============================================================
      //
      //============================================================
      dragulaService.options($scope, 'list-bag', {
        mirrorAnchor: 'top',

      });


      //============================================================
      //
      //============================================================
      function del (doc) {

        if (doc)
            $scope.deletedDoc = doc;
        else {
            $scope.deletedDoc = {};
            $scope.venue = _ctrl.venueId;
            $scope.deletedDoc.venue = _ctrl.venueId;
        }
          var dialog = ngDialog.open({
            template: deleteDialog,
            className: 'ngdialog-theme-default',
            closeByDocument: true,
            plain: true,
            scope: $scope
          });

          dialog.closePromise.then(function(ret) {
                if (ret.value === 'delete')  deleteDoc(doc).then(close).catch(onError);
          });
      }

      //============================================================
      //
      //============================================================
      function editDialog (doc) {

          if (doc)
              $scope.editRoom = doc;
          else {
              $scope.editRoom = {};
              $scope.venue = _ctrl.venueId;
              $scope.editRoom.venue = _ctrl.venueId;
          }

          var dialog = ngDialog.open({
            template: roomDialog,
            className: 'ngdialog-theme-default',
            closeByDocument: true,
            plain: true,
            scope: $scope
          });

          dialog.closePromise.then(function(ret) {
                if (ret.value === 'save')  save($scope.editRoom).then(loadRooms).then(close).catch(onError);
          });
      }

      //============================================================
      //q, pageNumber,pageLength,count,sort
      //============================================================
      function loadRooms() {

        var q = {'venue':_ctrl.venueId,'meta.status':{'$nin':['deleted','archived']}};
        return mongoStorage.loadDocs('venue-rooms',q,0,100000,false,_ctrl.sort).then(function(result) {
                 _ctrl.count=result.count;
                 _ctrl.docs =result.data;
        }).catch(onError);
      }


      //============================================================
      //
      //============================================================
      function loadTypes() {

        var q = {schema:'venue-rooms'};
        return mongoStorage.loadDocs('types',q,0,100000,false).then(function(result) {
                 _ctrl.options.types =result.data;

                 _ctrl.initialState=_.cloneDeep(_ctrl.options.types);
                 _.each(_ctrl.options.types,function(type,key){
                        var parentObj;
                        type.showChildren=true;
                        if(type.parent){
                          parentObj= _.find(_ctrl.options.types,{'_id':type.parent});
                          if(!parentObj) throw "error ref to parent res type not found.";
                          if(!parentObj.children)parentObj.children=[];
                          parentObj.children.push(type);
                          delete(_ctrl.options.types[key]);
                        }
                 });
        }).catch(onError);
      } //triggerChanges

      //============================================================
      //q, pageNumber,pageLength,count,sort
      //============================================================
      function getType(id,property) {
          if(!_ctrl.options.types ) return '';
          var type = _.find(_ctrl.options.types ,{_id:id});

          if(!type) return'';
          if(!property) return type;
          return type[property];
      }
      //============================================================
      //
      //============================================================
      function loadVenues() {

        var q = {};
        return mongoStorage.loadDocs('venues',q,0,100000,false).then(function(result) {
                 _ctrl.options.venues =result.data;
        }).catch(onError);
      } //triggerChanges

      //============================================================
      //
      //============================================================
      function cleanDoc(obj) {

        var objClone = _.clone(obj);
        delete(objClone.changed);
        delete(objClone.history);
        return objClone;
      } //triggerChanges

      //============================================================
      //
      //============================================================
      function save (obj){
          return mongoStorage.save('venue-rooms', cleanDoc(obj),obj._id).then(function(){
                      $rootScope.$broadcast("showInfo","Room '"+obj.title+"' Successfully Updated.");
                      loadRooms();
          }).catch(function(error){
              console.log(error);
              $rootScope.$broadcast("showError","There was an error saving your Room details: '"+obj.title+"' to the server.");
          });
      }//save

      //============================================================
      //
      //============================================================
      function deleteDoc (obj){

          // var objClone = cleanObj(obj);
          var objClone = _.clone(obj);
          objClone.meta.status='archived';
          return save(objClone);
      }

      //============================================================
      //
      //============================================================
      function onError (res) {
          var status,error;
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

      //============================================================
      //
      //============================================================
      $document.ready(function() {
        $.material.init();
        $.material.input();
        $.material.ripples();
      });
    }
  ];

});