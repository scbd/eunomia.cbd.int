define(['app', 'lodash', 'text!./tier-row-header.html', 'filters/moment' ], function(app, _, template) {

    app.directive("tierRowHeader",  [ function() {
            return {
                restrict  : 'E'     ,
                template  : template,
                replace   : true    ,
                transclude: false   ,
                scope: {
                    'isOpen'    :'=',
                    'conference':'='
                },
                controller: function($scope) {

                        $scope.$watch('conferenceDays', function() {
                            if (!_.isEmpty($scope.conferenceDays))
                                initTimeIntervals();
                        });

                        $scope.$watch('isOpen', function() {
                            initTimeIntervals();
                        });


                        function initTimeIntervals() {
                          $scope.timeIntervals = $scope.conference.timeObjects.sideEventTimeIntervals
                          $scope.timezone      = $scope.conference.timeObjects.tz
                          $scope.colWidth      = $scope.conference.timeObjects.colWidth
                        } //initTimeIntervals


                    } //
            }; //return
        }
    ]);
});