define(['app', 
// 'lodash', 'moment',
  // 'text!directives/forms/edit/room-dialog.html',
  // 'directives/date-picker',
  'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css',
  // 'services/mongo-storage',
  // 'directives/forms/edit/room',
  // 'directives/side-events/se-grid-reservation',
  'directives/side-events/unscheduled',
  'directives/side-events/se-schedule-header',
  'directives/side-events/side-events',
  // 'directives/side-events/totals',
  // 'directives/side-events/side-event'
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