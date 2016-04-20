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

                var htmlEditorTools = element.find("#htmlEditorTools button");
                var htmlEditor      = element.find("#htmlEditor");

                htmlEditorTools.tooltip();
                htmlEditor.keypress(function(){ console.log('press'); updateHtml();});
                htmlEditor.keyup   (function(){ console.log('up');    updateHtml();});
                htmlEditor.blur    (function(){ console.log('blur');  updateHtml();});

                $scope.execCommand=function(evt, cmd) {
                    evt.stopPropagation();

                    document.execCommand(cmd,false,null);

                    updateHtml();
                };

                //========================================
                //
                //========================================
                function updateHtml() {
                    $scope.$applyAsync(function(){
                        $scope.content.html = htmlEditor.html();
                    });
                }
            }
        };
    }]);
});
