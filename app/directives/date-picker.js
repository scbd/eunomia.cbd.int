define(['app', 'BM-date-picker'], function(app) {

    app.directive("datePicker", ['$timeout',function($timeout) {
        return {
            restrict: 'A',
            scope:{
              minDate:"=?datePickerMinDate",
              maxDate:"=?datePickerMaxDate",
              options:"=datePicker",
              ngModel:"="
            },
            link : function($scope, $element)
            {
                $element.bootstrapMaterialDatePicker($scope.options);

                $scope.$watch('minDate',function(){
                  if($scope.minDate)
                    $element.bootstrapMaterialDatePicker('setMinDate',$scope.minDate);
                });

                $scope.$watch('maxDate',function(){
                  if($scope.maxDate)
                    $element.bootstrapMaterialDatePicker('setMaxDate',$scope.maxDate);
                });

                $scope.$watch('ngModel',function(){
                  if($scope.ngModel)
                    dateChangeEffect();
                });
                
                //============================================================
                //
                //============================================================
                function dateChangeEffect() {
                  var el =$element;
                  if(el.parent().hasClass('form-group')){
                      el.parent().addClass('is-focused');
                      $timeout(function() {
                        el.parent().removeClass('is-focused');
                      }, 2000);

                  }else if(el.parent().parent().hasClass('form-group')){
                    el.parent().parent().addClass('is-focused');
                    $timeout(function() {
                      el.parent().parent().removeClass('is-focused');
                    }, 2000);

                  }
                } //init
            }
        };
    }]);
});
