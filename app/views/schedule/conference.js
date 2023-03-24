define(['app','moment', 'directives/schedule/conference-schedule','BM-date-picker',
], function(app, moment) {

  return ['mongoStorage','eventGroup','$scope','$route', '$location','$rootScope', function(mongoStorage,conf,$scope, $route, $location, $rootScope) {
        $scope.hide = true
        $scope.conf = conf;
        mongoStorage.loadOrgs();

        const { code, edit } = $route.current.params

        if(edit) getRes(edit)

        $scope.hide = (code === 'xxx') ? true : false

        if(!edit && code === 'xxx') $location.url(`/schedule/${conf.institution}/${conf.code}`)

        async function getRes(id){
          try{
            const { start, location } = await mongoStorage.loadDoc('reservations', id)
            const   resConf           = ($rootScope.eventGroups.filter(({ _id }) => location.conference === _id))[0]

            $scope.conf = resConf

            const queryParamDay = encodeURIComponent(moment.tz(start,resConf.timezone).startOf('day').format())

            $location.url(`/schedule/${resConf.institution}/${resConf.code}?day=${queryParamDay}&edit=${encodeURIComponent(id)}`)
          }catch(e){
            console.error(e)
            $location.url(`/schedule/${conf.institution}/${conf.code}`)
          }
  
        }
  }];
});