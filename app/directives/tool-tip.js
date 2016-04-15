define(['app',
    'lodash',
  ],
  function(app,_) {

    app.directive('toolTip', [function() {
      return {
        restrict: 'A',
        replace: false,
        transclude: false,

        link: function($scope, $element, $attr) {

          $element.tooltip({ placement: $attr.dataPlacement,
                 content: function() {
                   return $attr.dataOriginalTitle;
                 }
           });

           $element.on('mouseenter', function() {
                 $element.tooltip('show');
           });
           $element.on('mouseleave', function() {
                 $element.tooltip('hide');
           });

          } //link
      }; //return
    }]); //directive

  }); //define