define(['app', 'text!./announcement.html', 'filters/html-sanitizer'], function(app, template) {

    app.directive("cctvFrameAnnouncement", ['$filter', '$window', function($filter, $window) {
        return {
            restrict: 'E',
            template: template,
            replace: true,
            scope: {
                content: '='
            },
            link: function($scope, element) {

                $scope.html = $scope.content.html;

                var htmlEditorTools = element.find("#htmlEditorTools button");
                var htmlEditor      = element.find("#htmlEditor");

                htmlEditorTools.tooltip();
                htmlEditor.keypress(function(){ updateHtml();});
                htmlEditor.keyup   (function(){ updateHtml();});
                htmlEditor.blur    (function(){ updateHtml();});

                $scope.execCommand=function(evt, cmd, options) {

                    options = options || {};

                    if(options && options.useCss)
                        document.execCommand('styleWithCSS', false, true);

                    if(!options.arg && options.prompt) {
                        options.arg = $window.prompt(options.prompt);

                        if(!options.arg)
                            return;
                    }

                    document.execCommand(cmd,false, (options && options.arg)||null);

                    if(options && options.useCss)
                        document.execCommand('styleWithCSS', false, false);

                    updateHtml();
                };

                //========================================
                //
                //========================================
                function updateHtml() {
                    $scope.$applyAsync(function(){
                        var html         = htmlEditor.html();
                        var sanitizeHtml = $filter('sanitizeHtml')(htmlEditor.html());

                        if(html!=sanitizeHtml)
                            $scope.html = sanitizeHtml;

                        $scope.content.html = sanitizeHtml;
                    });
                }
            }
        };
    }]);
});
