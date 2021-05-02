define(['app', 'directives/schedule/conference-schedule'
], function() {

  return ['mongoStorage','eventGroup','$scope','$route', '$location','$rootScope', function(mongoStorage,conf,$scope, $route, $location, $rootScope) {
        $scope.hide = true
        $scope.conf=conf;
        mongoStorage.loadOrgs();

        const { code, edit } = $route.current.params

        if(edit) getRes(edit)

        $scope.hide = (code === 'xxx') ? true : false
        if(!edit && code === 'xxx') $location.url(`/schedule/${conf.code}`)



        async function getRes(id){
          const { start, location } = await mongoStorage.loadDoc('reservations', id)

          const resConf = ($rootScope.eventGroups.filter(({ _id }) => location.conference === _id))[0]


          $scope.conf = resConf 

          $location.url(`/schedule/${resConf.code}?day=${start}&edit=${id}`)
  
        }
  }];
});