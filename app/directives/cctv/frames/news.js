define(['app', 'text!./news.html'], function(app, template) {

    app.directive("cctvFrameNews", [function() {
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
