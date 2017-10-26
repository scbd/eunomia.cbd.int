define(['app', 'lodash', 'text!./se-grid-reservation.html', 'text!../forms/edit/reservation-view-dialog.html','moment',    'ngDialog',
], function(app, _, template,resDialog, moment) {

  app.directive("seGridReservation", ['$timeout','ngDialog','mongoStorage','$http','$q','$window',
    function($timeout,ngDialog,mongoStorage,$http,$q,$window) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        // priority: -100,
        scope: {
          'doc': '=',
          'rowMinHeight': '=',
          'ignoreMinHeight': '=?'
        },
        link: function($scope, $element) {
          $scope.tabs={};
          $scope.tabs.details={};
          $scope.tabs.other={};
          $scope.tabs.contact={};
          $scope.tabs.details.active =true;

          var subEl=$element.find('#res-el');
          if($scope.doc.subTypeObj && $scope.doc.subTypeObj.color){
            subEl.css("background-color",$scope.doc.subTypeObj.color);
          }
            // ============================================================
            //
            // ============================================================
            $scope.$watch('doc.searchFound', function() {
              if($scope.doc.searchFound){
                subEl.css("background-color",'#99FFC9');
              }
              else{
                if($scope.doc.subTypeObj && $scope.doc.subTypeObj.color)
                  subEl.css("background-color",$scope.doc.subTypeObj.color);
                else
                  subEl.css("background-color",'#dddddd');

              }

            });

            //============================================================
            //
            //============================================================
            $scope.goTo = function(url) {
                $window.open(url,'_blank');

            }; //goto

            //============================================================
            //
            //============================================================
            $scope.changeTab = function(tabName) {
                _.each($scope.tabs, function(tab) {
                    tab.active = false;
                });
                $scope.tabs[tabName].active = true;

            }; //changeTab

            //============================================================
            //
            //============================================================
            function getRes(id) {
              var params ={parmas:{}};
              //params.q = {'id':1};
              return $http.get('/api/v2016/inde-side-events/'+id,params).then(
                  function(responce) {

                      return   responce.data;
                  });

            } //initMeeting
            //============================================================
            // Load select with users choices of prefered date times
            //============================================================
            function loadCountry(code) {
              if(!code) return $q(function(resolve){resolve(true);});
                var params={params:{}};
                params.params.f = {history:0,meta:0,treaties:0};
                return $http.get('/api/v2015/countries/'+code.toUpperCase(),params).then(function(res){
                  return res.data;
                });
            } //loadOrgs

            //============================================================
            // Load select with users choices of prefered date times
            //============================================================
            function loadOrgs(orgs) {

            var f = {history:0,meta:0};
            //  var sort ={'sideEvent.id':-1};
            var orgsFormated=[];
            var partiesFormated=[];
            _.each(orgs,function(o){
                if(o.length>2)
                  orgsFormated.push({'$oid':o});
                else
                  partiesFormated.push(o.toUpperCase());
            });
              var q={
                '_id':{'$in':orgsFormated}
              };

              return mongoStorage.loadDocs('inde-orgs',q, 0,1000000,false,{'acronym':1},f).then(
                  function(responce) {
                        var params={params:{}};
                        params.params.q={'code':{'$in':partiesFormated}};

                        return $http.get('/api/v2015/countries',params).then(function(res){
                          return responce.data.concat(res.data);
                        });

                  });

            } //loadOrgs
            //============================================================
            //
            //============================================================
            $scope.resDialog = function(res) {
              $scope.loadingRes=true;
              if(res.sideEvent)
                getRes(res.sideEvent.id).then(function(res){
                  $scope.se=res;
                  loadOrgs($scope.se.hostOrgs).then(function(orgObjs){
                      $scope.se.hostOrgObjs=orgObjs;
                      if(res.contact && res.contact.country)
                      loadCountry(res.contact.country.identifier).then(function(cObj){
                          $scope.se.countryObj = cObj;
                          ngDialog.open({
                              template: resDialog,
                              className: 'ngdialog-theme-default',
                              closeByDocument: true,
                              plain: true,
                              scope: $scope
                          });
                            $scope.loadingRes=false;

                      });
                      else
                      ngDialog.open({
                          template: resDialog,
                          className: 'ngdialog-theme-default',
                          closeByDocument: true,
                          plain: true,
                          scope: $scope
                      });
                        $scope.loadingRes=false;
                    });
                });
            }; //$scope.roomDialog
        },
        controller: function($scope, $element) {

            $scope.oneLine = false;
            $scope.twoLine = false;
            $scope.threeLine = false;
            init();

            //============================================================
            //
            //============================================================
            function init() {

              var titleEl = $element.find("#res-el").popover({
                placement: 'top',
                html: 'true',
                container: 'body',
                content: function() {
                  return $element.find('#pop-title').html();
                }
              });


              titleEl.on('mouseenter', function() {
                titleEl.popover('show');
              });
              titleEl.on('mouseleave', function() {
                titleEl.popover('hide');
              });
              $element.on('$destroy', function() {
                titleEl.popover('destroy');
              });
            } //triggerChanges

          } //link
      }; //return
    }
  ]);
});
