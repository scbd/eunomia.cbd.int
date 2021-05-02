define(['app', 'moment', 'BM-date-picker'], function(app, moment) {

    app.directive("datePicker", ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                minDate: "=?datePickerMinDate",
                maxDate: "=?datePickerMaxDate",
                currentDate:"=?",
                options: "=datePicker"
            },
            link: function($scope, $element, attr, ngModelCtrl) {
              $timeout(() => {
                $element.bootstrapMaterialDatePicker($scope.options)
                $element.change(function() {

                  $scope.$applyAsync(function() {
                      var val = $element.val();
                      ngModelCtrl.$setViewValue(val);
                    });
                });
              },500)

                //============================================================
                //
                //============================================================
                var minDate = $scope.$watch('minDate', function() {

                    if ($scope.minDate && $element.bootstrapMaterialDatePicker)
                    $scope.$applyAsync(function() {
                        $element.bootstrapMaterialDatePicker('setMinDate', $scope.minDate);
                        minDate();
                      });
                });

                //============================================================
                //
                //============================================================
                var maxDate = $scope.$watch('maxDate', function() {
                    if ($scope.maxDate && $element.bootstrapMaterialDatePicker){
                        $element.bootstrapMaterialDatePicker('setMaxDate', $scope.maxDate);
                        maxDate();
                    }

                });
                //============================================================
                //
                //============================================================
                var currDate = $scope.$watch('currentDate', function() {
                    if ($scope.currentDate && $element.bootstrapMaterialDatePicker){
                        $element.bootstrapMaterialDatePicker('currentDate', $scope.currentDate);
                        currDate();
                    }

                });
                //============================================================
                //
                //============================================================
                $scope.$watch(function() { return ngModelCtrl.$viewValue; }, function(val, prevVal) {

                    if (val && (val !== prevVal) && $element.bootstrapMaterialDatePicker) {
                        dateChangeEffect();
                        $element.bootstrapMaterialDatePicker('setDate', val);
                        $element.trigger('change');
                    }
                });

                //============================================================
                //
                //============================================================


                //============================================================
                //
                //============================================================
                function dateChangeEffect() {
                    var el = $element;
                    if (el.parent().hasClass('form-group')) {
                        el.parent().addClass('is-focused');
                        $timeout(function() {
                            el.parent().removeClass('is-focused');
                        }, 2000);

                    } else if (el.parent().parent().hasClass('form-group')) {
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
