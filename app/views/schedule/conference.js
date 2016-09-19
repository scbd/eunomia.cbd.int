define(['app', 'directives/schedule/conference-schedule'
], function() {

  return ['mongoStorage','eventGroup','$scope', function(mongoStorage,conf,$scope) {
        $scope.conf=conf;
        mongoStorage.getAllOrgs('inde-orgs', 'published');// load cache

  }];
});