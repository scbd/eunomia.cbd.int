define(['app',
        'lodash',
        'text!./side-event.html',
        'moment',
        './se-grid-reservation',
    ],
    function(app, _, template) {

        app.directive('sideEvent', ['$timeout', 'mongoStorage','$http', function($timeout, mongoStorage,$http) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    res: '=',
                    load: '&'
                },
                template: template,

                link: function($scope,$elem) {
                    $elem.find('#res-el').hide();


                    var subEl=$elem.find('#res-panel');

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
                                  $http.get('/api/v2016/inde-side-events/',{params:{q:{'id':$scope.res.sideEvent.id},f:{'id':1}}}).then(function(res2){
                                        var params = {};
                                        params.id = res2.data[0]._id;
                                        var update =res2.data[0];
                                        update.meta={};
                                        if (!update.meta.clientOrg) update.meta.clientOrg = 0;
                                        update.meta.status='canceled';
                                        $http.patch('/api/v2016/inde-side-events/'+res2.data[0]._id,update,params);
                                  });
                              $scope.load();
                            });
                        }
                    } //init
                    $scope.deleteRes = deleteRes;
                },
                controller: function($scope, $element) {
                        var titleEl = $element.find("#title").popover({
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
                        $timeout(function() {
                            if ($scope.res.sideEvent && $scope.res.sideEvent.orgs && $scope.res.sideEvent.orgs.length > 1) {
                                var orgEl = $element.find("div.num-orgs"); //.popover({ placement: 'bottom', html: 'true'});

                                var orgs = $element.find("#orgs").popover({
                                    placement: 'bottom',
                                    html: 'true',
                                    container: 'body',
                                    content: function() {
                                        return $element.find('#pop-orgs').html();
                                    }
                                }); //.popover({ placement: 'bottom', html: 'true'});

                                orgEl.on('mouseenter', function() {
                                    orgs.popover('show');
                                });
                                orgEl.on('mouseleave', function() {
                                    orgs.popover('hide');
                                });
                                orgs.on('mouseenter', function() {
                                    orgs.popover('show');
                                });
                                orgs.on('mouseleave', function() {
                                    orgs.popover('hide');
                                });
                            } //
                        }, 1000);
                    } //link
            }; //return
        }]); //directive

    }); //define