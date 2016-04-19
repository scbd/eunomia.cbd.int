define(['app', 'text!./announcement.html'], function(app, template) {

    app.directive("cctvFrameAnnouncement", [function() {
        return {
            restrict: 'E',
            template: template,
            replace: true,
            scope: {
                content: '='
            },
            link: function($scope, element) {

                var htmlEditor = element.find("#htmlEditor");

                $scope.execCommand=function(cmd) {
                    document.execCommand(cmd,false,null);
                };

                htmlEditor.blur(function() {
                    $scope.$apply(function(){
                        $scope.content.html = htmlEditor.html();
                    });
                });
            }

        };
    }]);
});
