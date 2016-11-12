define(['app',
        'lodash',
        'text!./side-event.html',
        'moment',
        './se-grid-reservation',
    ],
    function(app, _, template) {

        app.directive('sideEvent', ['$timeout', 'mongoStorage', function($timeout, mongoStorage) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    res: '=',
                    load: '&'
                },
                template: template,

                link: function($scope) {
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
                            if (!$scope.res.meta) $scope.doc.meta = {};
                            $scope.res.meta.status = 'deleted';
                            return mongoStorage.save('reservations', cleanReservation($scope.res)).then(function(res) {

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
                            if ($scope.res.sideEvent.orgs && $scope.res.sideEvent.orgs.length > 1) {
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