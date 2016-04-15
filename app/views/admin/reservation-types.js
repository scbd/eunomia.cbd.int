define(['app', 'lodash', 'moment',
  '../../services/mongo-storage',
  '../../directives/tool-tip',
  'ngDialog',
  'css!libs/ng-dialog/css/ngDialog.css',
  'css!libs/ng-dialog/css/ngDialog-theme-default.min.css',
  'bs-colorpicker',
  'css!bs-colorpicker-css'
], function(app, _, moment) {

  app.controller("reservationType", ['$scope', '$element','scbdMenuService',  'mongoStorage', '$timeout', '$rootScope', 'ngDialog','$document',
    function($scope, $element,scbdMenuService,mongoStorage, $timeout, $rootScope, ngDialog,$document) {

      $scope.sideEvents = [];
      $scope.days = [];
      $scope.meeting = 0;
      $scope.search = '';
      $scope.rooms={};
      $scope.updateColorSquare=updateColorSquare;

      init();

      //============================================================
      //
      //============================================================
      function init() {
        $scope.options = {};
        $scope.toggle = scbdMenuService.toggle;
        updateColorSquare();
        triggerChanges ();
        loadTypes();
      } //init

      //============================================================
      //
      //============================================================
      function loadTypes(){
        return mongoStorage.loadDocs ('reservation-types',status).then(function(result){
          $scope.types=result.data;
          console.log($scope.types);
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
      //============================================================
      //
      //============================================================
      function updateColorSquare (id,color){
          $timeout(function(){
            $element.find('#'+id).css('color',color);
            $element.find('#roomColor').trigger("change");
          });
      }//updateColorSquare

      //============================================================
      //
      //============================================================
      function triggerChanges (){

           $element.find('input').trigger("change");

      }//triggerChanges

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