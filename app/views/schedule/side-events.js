define(['app', 'lodash', 'moment',
  'text!directives/forms/edit/room-dialog.html',
  'directives/date-picker',
  'css!libs/angular-dragula/dist/dragula.css',
  'services/mongo-storage',
  'directives/forms/edit/room',
  'directives/grid-reservation-se',
  'directives/side-events/unscheduled',
  'directives/side-events/se-schedule-header',
  'directives/side-events/side-events',
  'ngDialog',
  'directives/side-event'
], function(app, _, moment, roomDialog, resDialog) {

    return['$scope','eventGroup',function($scope,conf){
        $scope.conference=conf;
        $scope.conferenceDays={};
        $scope.isOpen=true;
    }];

});