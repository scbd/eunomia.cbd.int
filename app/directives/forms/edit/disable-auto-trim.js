define(['app'],
  function(app) {

    app.directive('disableAutoTrim', [function() {
      return {
        restrict: 'A',
        replace: false,
        transclude: false,

        link: function($scope, $element, $attr) {

          if ( $element.attr('type') === 'text')
            $attr.$set('ngTrim', "false")

          } //link
      }; //return
    }]); //directive

  }); //define