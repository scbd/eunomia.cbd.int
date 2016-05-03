define(['app', 'moment', 'BM-date-picker'], function(app, moment) {

    app.directive("datePicker", ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                minDate: "=?datePickerMinDate",
                maxDate: "=?datePickerMaxDate",
                options: "=datePicker"
            },
            link: function($scope, $element, attr, ngModelCtrl) {
                $element.bootstrapMaterialDatePicker($scope.options);

                //============================================================
                //
                //============================================================
                $scope.$watch('minDate', function() {

                    if ($scope.minDate)
                    $scope.$applyAsync(function() {
                        $element.bootstrapMaterialDatePicker('setMinDate', $scope.minDate);
                      });
                });

                //============================================================
                //
                //============================================================
                $scope.$watch('maxDate', function() {
                    if ($scope.maxDate)
                        $element.bootstrapMaterialDatePicker('setMaxDate', $scope.maxDate);

                });

                //============================================================
                //
                //============================================================
                $scope.$watch(function() { return ngModelCtrl.$viewValue; }, function(val, prevVal) {

                    if (val && (val !== prevVal)) {
                        dateChangeEffect();
                        $element.bootstrapMaterialDatePicker('setDate', moment(val, $scope.options.format));
                        $element.trigger('change');
                    }
                });

                //============================================================
                //
                //============================================================
                $element.change(function() {

                    $scope.$applyAsync(function() {
                        var val = $element.val();
                        ngModelCtrl.$setViewValue(val);
                    });
                });

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
