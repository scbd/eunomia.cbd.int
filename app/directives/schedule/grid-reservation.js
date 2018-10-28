define(['app', 'text!./grid-reservation.html','lodash'], function(app, template,_) {
    app.directive("gridReservation", [
        function() {
            return {
                restrict: 'E',
                template: template,
                replace: true,
                transclude: false,
                priority: -100,
                scope: {
                    'doc': '=',
                    'start': '=',
                    'popRes': '&',
                    'popVid': '&'
                },
                link: function($scope, $element) {

                        init();
                        //============================================================
                        //
                        //============================================================

                        function hasAgenda(doc){

                            if(doc.agenda && doc.agenda.items && !_.isEmpty(doc.agenda.items) )
                              return true;
                            else
                              return false;

                        }
                        $scope.hasAgenda=hasAgenda;

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

                            if($scope.doc.typeObj)
                                $scope.color=$scope.doc.typeObj.color;

                            if($scope.doc.subTypeObj)
                              $scope.color=$scope.doc.subTypeObj.color;

                        } //triggerChanges

                    } //link
            }; //return
        }
    ]);
});