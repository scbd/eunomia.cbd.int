define(['app', 
  'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css',
  'directives/side-events/unscheduled',
  'directives/side-events/se-schedule-header',
  'directives/side-events/side-events',
  'BM-date-picker'
], function() {

    return['$scope','eventGroup',function($scope,conf){
        $scope.conference               = conf;
        $scope.conferenceDays           = []  ;
        $scope.isOpen                   = true;
        $scope.bagScopes                = {}  ;
        $scope.slotElements             = []  ;
        $scope.options                  = {}  ;
        $scope.options.typesProm        = {}  ;
        $scope.reservations             = []  ;
        $scope.rooms                    = []  ;
        $scope.prefs                    = {}  ;
    }];

});