define(['app', 'text!./grid-reservation.html'], function(app, template) {
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
                },
                link: function($scope, $element) {

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