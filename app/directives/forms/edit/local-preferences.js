define(['app', 'lodash',
    'text!./local-preferences.html'
  ], function(app, _, template) { 
  
    app.directive("localPreferences", ['$timeout','$window','$rootScope',
      function($timeout, $window, $rootScope) {
        return {
          restrict  : 'E'     ,
          template  : template,
          replace   : true    ,
          transclude: false   ,
          link: function($scope, $element,$atrbs,ctrl){
            ctrl.init();
          },
          controller: function($scope, $element) { 
  
              this.init = init;


            function save (){
              if($scope.form.$invalid) return;
  
              if($scope?.prefs?.institution)
                localStorage.setItem('institution',$scope.prefs.institution);

              if($scope.prefs.institution)
                $rootScope.institutionChange($scope.prefs.institution);


              $timeout(()=>$window.location.path(`/`),1000);
              $timeout(()=>$window.location.reload(true),2000);
              $scope.closeThisDialog({ value: 'save' })
              

            }
            $scope.save=save;
            //============================================================
            //
            //============================================================
            function init() {
                $scope.options={};
                $scope.prefs = {};
                $scope.tabs = { 'details':{'active':true}};


            }//triggerChanges
  
  
          } //controlledr
        }; //return
      }
    ]);
  });