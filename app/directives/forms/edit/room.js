define(['app', 'lodash',
  'text!./room.html',
  'moment',
  '../../color-picker'
], function(app, _, template) { //'scbd-services/utilities',

  app.directive("room", ['$timeout','mongoStorage','$rootScope','$location',
    function($timeout,mongoStorage,$rootScope,$location) {
      return {
        restrict  : 'E'     ,
        template  : template,
        replace   : true    ,
        transclude: false   ,
        scope: {'doc':'=?','venue':'=?','closeThisDialog':'&'},
        require:'room',
        link: function($scope, $element,$atrbs,ctrl){
          ctrl.init();
        },
        controller: function($scope, $element) { 

            this.init = init;
            //============================================================
            //
            //============================================================
            function triggerChanges (){
                $timeout(function(){$element.find('input').trigger("change");
                    $element.find('select').trigger("change");
                },200);
            }


          //============================================================
          //
          //============================================================
          function initVenues(){

              return mongoStorage.getDocs('venues').then(function(venues){
                $scope.options.venues=venues.data;
                _.each($scope.options.venues,function(ven){
                      if(ven._id === $scope.doc.venue)
                        ven.selected=true;
                });
              });
          }//initVunues

          //============================================================
          //
          //============================================================
          function initTypes(){
            var q = { schema: 'venue-rooms' };
            return mongoStorage.loadDocs('types',q,0,100000,false).then(function(result) {
                    $scope.options.types =result.data;

                     $scope.initialState=_.cloneDeep($scope.options.types);
                     _.each($scope.options.types,function(type,key){
                            var parentObj;
                            type.showChildren=true;
                            if(type.parent){
                              parentObj= _.find($scope.options.types,{'_id':type.parent});
                              if(!parentObj) throw "error ref to parent res type not found.";
                              if(!parentObj.children)parentObj.children=[];
                              parentObj.children.push(type);
                              delete($scope.options.types[key]);
                            }
                     });
            });
          }//

          //============================================================
          //
          //============================================================
          $scope.changeTab = function(tabName){
              _.each($scope.tabs,function(tab){
                  tab.active=false;
              });
              $scope.tabs[tabName].active=true;
          };//initVunues


          function onChangeInterpretationOnSite(interpretationOnSite){
            console.log('onChangeInterpretationOnSite',$scope);
            if(!interpretationOnSite) return delete $scope.doc.interpretationBooths;

            $scope.doc.interpretationBooths= 3
          }
          $scope.onChangeInterpretationOnSite=onChangeInterpretationOnSite;

          function save (){
            if($scope.form.$invalid) return;

            $scope.closeThisDialog({ value: 'save' });
          }
          $scope.save=save;
          //============================================================
          //
          //============================================================
          function init() {
              $scope.options={};

              $scope.tabs={'details':{'active':true},'resources':{'active':false},'options':{'active':false}};

              initVenues().then(function(){
                initTypes();
                $timeout(triggerChanges,500);
              });


          }//triggerChanges


        } //controlledr
      }; //return
    }
  ]);
});