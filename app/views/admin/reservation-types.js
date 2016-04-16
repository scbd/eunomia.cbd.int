define(['app', 'lodash','text!../../directives/forms/edit/delete-dialog.html',
  'text!../../directives/forms/edit/reservation-type-dialog.html',
  '../../services/mongo-storage',
  '../../directives/tool-tip',

  '../../directives/forms/edit/reservation-type',
  'ngDialog',
  'css!libs/ng-dialog/css/ngDialog.css',
  'css!libs/ng-dialog/css/ngDialog-theme-default.min.css',
  // 'bs-colorpicker',
  // 'css!bs-colorpicker-css',
  '../../directives/color-picker'
], function(app, _,deleteDialog,resTypeDialog) {

  app.controller("reservationType", ['$scope', '$element', 'scbdMenuService', 'mongoStorage', '$timeout', '$rootScope', 'ngDialog', '$document',
    function($scope, $element, scbdMenuService, mongoStorage, $timeout, $rootScope, ngDialog, $document) {

      $scope.sideEvents = [];
      $scope.days = [];
      $scope.meeting = 0;
      $scope.search = '';
      $scope.rooms = {};

  //    $scope.updateColorSquare = updateColorSquare;

      init();

      //============================================================
      //
      //============================================================
      function init() {
        $scope.options = {};
        $scope.toggle = scbdMenuService.toggle;
  //      updateColorSquare();
        triggerChanges();
        loadTypes();
      } //init

      //============================================================
      //
      //============================================================
      $scope.typeDialog = function(type) {
        if(type){
            if(type && !_.isObject(type))
              type={'parent':type};
            $scope.editType = type;
        }else $scope.editType =type={};

          var dialog = ngDialog.open({
            template: resTypeDialog,
            className: 'ngdialog-theme-default',
            closeByDocument: true,
            plain: true,
            scope: $scope
          });

          dialog.closePromise.then(function(ret) {
                if (ret.value == 'publish') $scope.save(type).then($scope.close).catch(function onerror(response) {
                    $scope.onError(response);
                });
          });
      };

      //============================================================
      // - orgs
      // - pref
      // - require
      // - contact
      //============================================================
      $scope.searchType = function(type) {

        if (!$scope.search || $scope.search == ' ') return true;
        var temp = JSON.stringify(type);
        return (temp.toLowerCase().indexOf($scope.search.toLowerCase()) >= 0);
      };

      //============================================================
      //
      //============================================================
      function loadTypes() {
        return mongoStorage.loadDocs('reservation-types', status).then(function(result) {
          $scope.types = result.data;
                $scope.initialState=_.cloneDeep($scope.types);
          _.each($scope.types,function(type){
              type.showChildren=true;
                        _.each(type.children,function(child){
                            child.showChildren=true;
                        });
          });
        }).catch(function onerror(response) {
          $scope.onError(response);
        });
      }

      //============================================================
      //
      //============================================================
      $scope.hasError = function() {
        return !!$scope.error;
      };
      // //============================================================
      // //
      // //============================================================
      // function updateColorSquare(id, color) {
      //   $timeout(function() {
      //     $element.find('#' + id).css('color', color);
      //     $element.find('#roomColor').trigger("change");
      //   });
      // } //updateColorSquare
      //============================================================
      //
      //============================================================
      $scope.deleteDial = function(doc,parent) {
        $scope.deletedDoc=doc;
        var dialog = ngDialog.open({
          template: deleteDialog,
          className: 'ngdialog-theme-default',
          closeByDocument: true,
          plain: true,
          scope: $scope,
          trapFocus:false,
        });

        dialog.closePromise.then(function(ret) {
          if (ret.value === 'no') return;
          if (ret.value === 'delete') $scope.delete(doc,parent);
        });
      };
      //============================================================
      //
      //============================================================
      function triggerChanges() {

        $timeout(function(){$element.find('input').trigger("change");},500);

      } //triggerChanges
      //============================================================
      //
      //============================================================
      function cleanObj(obj) {

        var objClone= _.cloneDeep(obj);
        delete(objClone.children);
        delete(objClone.showChildren);
        delete(objClone.test);
        return objClone;
      } //triggerChanges
      //============================================================
      //
      //============================================================
      $scope.save = function(obj){

          var objClone = cleanObj(obj);
          return mongoStorage.save('reservation-types',objClone,objClone._id).then(function(){
                      if(!obj._id) loadTypes();
                      $rootScope.$broadcast("showInfo","Reservation Type '"+objClone.title+"' Successfully Updated.");
          }).catch(function(error){
              console.log(error);
              $rootScope.$broadcast("showError","There was an error saving your Reservation Type: '"+objClone.title+"' to the server.");
          });
      }//save
      //============================================================
      //
      //============================================================
      $scope.saveOnBlur = function(obj,propertyName){
          var initObj = _.find($scope.initialState,{'_id':obj._id});
          if(initObj[propertyName] !== obj[propertyName]) $scope.save(obj);

      }//save
      //============================================================
      //
      //============================================================
      $scope.delete = function(obj,parent){
          var objKey;
          if(parent){
            console.log(parent);
            objKey=  _.findKey(parent.children,{'_id':obj._id});
            parent.children.splice(objKey, 1);
            if(parent.children.length===0)delete(parent.children);
          }
          else{
            objKey=  _.findKey($scope.types,{'_id':obj._id});
            $scope.types.splice(objKey, 1);
          }
          if(obj.children){
              _.each(obj.children,function(child){
                    objClone = cleanObj(child);
                    return mongoStorage.deleteDoc('reservation-types',objClone,objClone._id).then(function(){
                                $rootScope.$broadcast("showInfo","Reservation Type '"+child.title+"' Successfully Updated Deleted.");
                    }).catch(function(error){
                        console.log(error);
                        $rootScope.$broadcast("showError","There was an error deleting your Reservation Type: '"+child.title+"' to the server.");
                    });
              });
          }
          var objClone = cleanObj(obj);
          return mongoStorage.deleteDoc('reservation-types',objClone,objClone._id).then(function(){
                      $rootScope.$broadcast("showInfo","Reservation Type '"+objClone.title+"' Successfully Updated Deleted.");
          }).catch(function(error){
              console.log(error);
              $rootScope.$broadcast("showError","There was an error deleting your Reservation Type: '"+objClone.title+"' to the server.");
          });
      }//save

      //============================================================
      //
      //============================================================
      $scope.onError = function(res) {

        $scope.status = "error";
        if (res.status === -1) {
          $scope.error = "The URI " + res.config.url + " could not be resolved.  This could be caused form a number of reasons.  The URI does not exist or is erroneous.  The server located at that URI is down.  Or lastly your internet connection stopped or stopped momentarily. ";
          if (res.data && res.data.message)
            $scope.error += " Message Detail: " + res.data.message;
        }
        if (res.status == "notAuthorized") {
          $scope.error = "You are not authorized to perform this action: [Method:" + res.config.method + " URI:" + res.config.url + "]";
          if (res.data.message)
            $scope.error += " Message Detail: " + res.data.message;
        } else if (res.status == 404) {
          $scope.error = "The server at URI: " + res.config.url + " has responded that the record was not found.";
          if (res.data.message)
            $scope.error += " Message Detail: " + res.data.message;
        } else if (res.status == 500) {
          $scope.error = "The server at URI: " + res.config.url + " has responded with an internal server error message.";
          if (res.data.message)
            $scope.error += " Message Detail: " + res.data.message;
        } else if (res.status == "badSchema") {
          $scope.error = "Record type is invalid meaning that the data being sent to the server is not in a  supported format.";
        } else if (res.data && res.data.Message)
          $scope.error = res.data.Message;
        else
          $scope.error = res.data;
      };
      //============================================================
      //
      //============================================================
      $document.ready(function() {
        $.material.init();
        $.material.input();
        $.material.ripples();
      });
    }
  ]);

});