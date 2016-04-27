define(['app', 'text!./announcement.html', 'filters/html-sanitizer'], function(app, template) {

    app.directive("cctvFrameAnnouncement", ['$filter', function($filter) {
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
                htmlEditor.keypress(function(){ console.log('press'); updateHtml();});
                htmlEditor.keyup   (function(){ console.log('up');    updateHtml();});
                htmlEditor.blur    (function(){ console.log('blur');  updateHtml();});

                $scope.execCommand=function(evt, cmd, options) {
                //    evt.stopPropagation();

                    if(options && options.useCss)
                        document.execCommand('styleWithCSS', false, true);

                    document.execCommand(cmd,false, null);

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
