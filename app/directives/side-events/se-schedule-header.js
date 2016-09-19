define(['app', 'lodash', 'text!./se-schedule-header.html', 'moment',
    'directives/date-picker',
], function(app, _, template, moment) {

    app.directive("seScheduleHeader", ['$timeout', '$document', 'mongoStorage','$rootScope','$q',
        function($timeout, $document, mongoStorage,$rootScope,$q) {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                require:'seScheduleHeader',
                scope: {
                    'search': '=',
                    'conference':'='
                },
                link: function($scope, $element,$attr,ctrl) {

                        init();

                        //============================================================
                        //
                        //============================================================
                        function init() {
                          $timeout(function(){
                            $element.find('#start-filter').bootstrapMaterialDatePicker('setMinDate', $scope.conference.StartDate);
                            $element.find('#start-filter').bootstrapMaterialDatePicker('setMaxDate', $scope.conference.EndDate);
                            $element.find('#end-filter').bootstrapMaterialDatePicker('setMinDate', $scope.conference.StartDate);
                            $element.find('#end-filter').bootstrapMaterialDatePicker('setMaxDate', $scope.conference.EndDate);
                          },250);

                        } //init
                }, //link
                controller: function($scope) {

                    //============================================================
                    //
                    //============================================================
                    function dateChangeEffect(id) {
                        $element.find('#' + id).parent().addClass('is-focused');

                        $timeout(function() {
                          $element.find('#' + id).parent().removeClass('is-focused');
                        }, 2000);
                    } //dateChangeEffect

                    //============================================================
                    //
                    //============================================================
                    $scope.dateChangeStart = function() {

                      var startDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);
                      var endDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);

                      dateChangeEffect('start-filter');
                    }; //dateChangeStart

                    //============================================================
                    //
                    //============================================================
                    $scope.dateChangeEnd= function() {

                      var startDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);
                      var endDatTS = moment.tz($scope.conference.StartDate,$scope.conference.timezone);

                      dateChangeEffect('end-filter');
                    }; //dateChangeEnd
                }, //link
        };//return
    }]);//directive
});//require