define(['app', 'directives/schedule/conference-schedule'
], function() {

  return ['mongoStorage', function(mongoStorage) {

        mongoStorage.getAllOrgs('inde-orgs', 'published');// load cache

  }];
});