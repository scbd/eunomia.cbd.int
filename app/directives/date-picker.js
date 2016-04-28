define(['app', 'BM-date-picker'], function(app) {

    app.directive("datePicker", [function() {
        return {
            restrict: 'A',
            scope:{
              minDate:"=?datePickerMinDate",
              maxDate:"=?datePickerMaxDate",
              options:"=datePicker"
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
            }
        };
    }]);
});
