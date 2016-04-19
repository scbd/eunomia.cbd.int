define(['app', 'text!./announcement.html'], function(app, template) {

    app.directive("cctvFrameAnnouncement", [function() {
        return {
            restrict: 'E',
            template: template,
            replace: true,
            scope: {
                content: '='
            }
        };
    }]);
});
