define(['app'], function(app) {
  'use strict';

  app.directive('sorter',['$timeout', function($timeout) {
  return {
   restrict: 'E',
   scope:{binding:'=ngModel',load:'&load'},
   template:'<span ng-click="setSort()" class="text-nowrap" style="margin-bottom:0px;"><a ><span style="cursor:pointer;font-size:14px;color:#333;font-family: Roboto,Helvetica,Arial,sans-serif;font-weight:bold;padding: 0px 8px 0px 8px;"> {{name}}</span></a> <a ng-if="direction && isSelected()" style="cursor:pointer;"><span><i ng-if="direction===1 && isSelected()"  class="fa fa-caret-down"></i><i ng-if="direction===-1" class="fa fa-caret-up"></i></a></span></span>',
   link: function($scope,$element,$attrs) {

        $scope.name=$attrs.labelName;
        $scope.property=$attrs.property;
        isSelected();        //inits to selected if object set

        //============================================================
        //
        //============================================================
        $scope.setSort =  function (){
          if(!$scope.direction)
            $scope.direction=1;
          else
          $scope.direction=-$scope.direction;
          $scope.binding={};
          $scope.binding[$scope.property]=$scope.direction;
          $scope.load();
        };

        //============================================================
        //
        //============================================================
        function isSelected() {
          if(!$scope.binding) return false
            if(!!$scope.binding[$scope.property] && !$scope.direction)
              $scope.direction=$scope.binding[$scope.property];
          return !!$scope.binding[$scope.property];
        }
        $scope.isSelected=isSelected;


     }
    };
  }]);
}); // define
