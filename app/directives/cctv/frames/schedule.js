define(['app', 'text!./schedule.html', 'lodash'], function(app, template, _) {

    app.directive("cctvFrameSchedule", ['$http', function($http) {
        return {
            restrict: 'E',
            template: template,
            replace: true,
            scope: {
                content: '='
            },
            link: function($scope) {

                $scope.selectedTypes = {};
                $scope.updateTypes = updateReservationTypes;

                if($scope.content && $scope.content.reservationTypes) {
                    $scope.content.reservationTypes.forEach(function(id){
                        $scope.selectedTypes[id]=true;
                    });
                }

                $http.get('/api/v2016/reservation-types').then(function(res) {
                    $scope.reservationTypes = res.data;
                });

                //========================================
                //
                //========================================
                function updateReservationTypes() {

                    $scope.content.reservationTypes = [];

                    _.forEach($scope.selectedTypes, function(selected, key) {
                        if (selected)
                            $scope.content.reservationTypes.push(key);
                    });
                }
            }
        };
    }]);
});
