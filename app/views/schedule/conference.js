define(['app','moment','text!../../directives/forms/edit/institution-dialog.html','directives/forms/edit/local-preferences','directives/schedule/conference-schedule','BM-date-picker',  'ngDialog',
], function(app, moment, dialogTemplate) {

  return ['mongoStorage','eventGroup','$scope','$route', '$location','$rootScope','ngDialog', function(mongoStorage,conf,$scope, $route, $location, $rootScope, ngDialog) {
        $scope.hide = true
        
        $scope.conf = conf;
        mongoStorage.loadOrgs();

        const hasInstitution = !!localStorage.getItem('institution');
        const { code, edit } = $route.current.params

        if(!hasInstitution )
          ngDialog.open({
            template: dialogTemplate,
            className: 'ngdialog-theme-default',
            closeByDocument: true,
            plain: true,
            scope: $scope
          });

        if(edit) getRes(edit)

        $scope.hide = (code === 'xxx') ? true : false

        if(!edit && code === 'xxx') $location.url(`/${conf.institution}/${conf.code}/schedule`)

        async function getRes(id){
          try{
            const { start, location } = await mongoStorage.loadDoc('reservations', id)
            const   resConf           = ($rootScope.eventGroups.filter(({ _id }) => location.conference === _id))[0]

            $scope.conf = resConf

            const queryParamDay = encodeURIComponent(moment.tz(start,resConf.timezone).startOf('day').format())

            $location.url(`/${resConf.institution}/${resConf.code}/schedule?day=${queryParamDay}&edit=${encodeURIComponent(id)}`)
          }catch(e){
            console.error(e)
            $location.url(`/${conf.institution}/${conf.code}/schedule`)
          }
  
        }
  }];
});