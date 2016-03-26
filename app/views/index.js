define(['app', 'lodash','jquery',
  'css!./index', '../services/mongo-storage',

        './menu'
], function(app,_,$) {

    app.controller("home", ['$scope','mainMenu', '$http','$filter','$route','mongoStorage','$location','$element','$timeout','$window','$anchorScroll','authentication', //"$http", "$filter", "Thesaurus",
      function($scope,mainMenu,  $http,$filter,$route,mongoStorage,$location,$element,$timeout,$window,$anchorScroll,auth) { //, $http, $filter, Thesaurus


        $scope.toggle = mainMenu.toggle;
        $scope.sections = mainMenu.getMenu('mainMenu');
          auth.getUser().then(function(user){

             $scope.user = user;
 //              console.log($scope.user);
           }).then(function(){init();});

          //=======================================================================
          //
          //=======================================================================
          function init(){


          }//init


      }]);
});