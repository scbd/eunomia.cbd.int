define(['app',
        'lodash',
        'text!./side-event.html',
        'moment',
        './se-grid-reservation',
        'services/when-element'  ,
    ],
    function(app, _, template) {

        app.directive('sideEvent', [ 'mongoStorage','$http','whenElement', function(mongoStorage,$http, whenElement) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    res: '=',
                    load: '&',
                    loadingRes:'='
                },
                template: template,

                link: async function($scope, $elem) {
                    whenElement('res-el', $elem).then(($el) => $el.hide())


                    const subEl = await whenElement('res-panel', $elem)

                    if($scope.res.subTypeObj && $scope.res.subTypeObj.color){
                      subEl.css("background-color",$scope.res.subTypeObj.color);
                    }


                    //============================================================
                    //
                    //============================================================
                    function cleanReservation(res, isNew) {
                        if (!res) throw "Error: not res obj passed.";
                        var objClone = _.cloneDeep(res);
                        if (isNew) {
                            delete(objClone._id);
                            delete(objClone.meta);
                            delete(objClone.history);
                        }

                        if (!objClone.recurrence) delete(objClone.series);
                        delete(objClone.test);
                        delete(objClone.startDisp);
                        delete(objClone.endDisp);
                        delete(objClone.typeObj);
                        delete(objClone.children);
                        delete(objClone.subTypeObj);
                        delete(objClone.resWidth);


                        return objClone;
                    } //initVunues

                    //============================================================
                    //
                    //============================================================
                    function deleteRes() {

                        if (confirm('Are you sure you would like to permanently delete this reservation?')) {
                            var dalObj = _.clone($scope.res);
                            dalObj.meta={};
                            dalObj.meta.status='deleted';

                            return mongoStorage.save('reservations',dalObj).then(function() {
                                if($scope.res.sideEvent)
                                  $http.get('https://api.cbd.int/api/v2016/inde-side-events/',{params:{q:{'id':$scope.res.sideEvent.id},f:{'id':1}}}).then(function(res2){
                                        var params = {};
                                        params.id = res2.data[0]._id;
                                        var update =res2.data[0];
                                        update.meta={};
                                        if (!update.meta.clientOrg) update.meta.clientOrg = 0;
                                        update.meta.status='canceled';
                                        $http.patch('https://api.cbd.int/api/v2016/inde-side-events/'+res2.data[0]._id,update,params);
                                  });
                              $scope.load();
                            });
                        }
                    } //init
                    $scope.deleteRes = deleteRes;
                }
            }; //return
        }]); //directive

    }); //define