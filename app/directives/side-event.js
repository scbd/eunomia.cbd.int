define(['app',
    'lodash',
      'text!./side-event.html',
  ],
  function(app,  _,template) {

    app.directive('sideEvent', ['$timeout',  function($timeout) {
      return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
          res: '=',
        },
        template: template,


        controller: function($scope, $element) {
          $timeout(function(){
            if($scope.res.sideEvent && $scope.res.sideEvent.orgs.length >1 ){
                var orgEl = $element.find("div.num-orgs").popover({ placement: 'bottom', html: 'true',container: 'body',
                     content: function() {
                       return $element.find('#pop-orgs').html();
                     }
                });//.popover({ placement: 'bottom', html: 'true'});

                var orgs = $element.find("#orgs").popover({ placement: 'top', html: 'true',container: 'body',
                       content: function() {
                         return $element.find('#pop-orgs').html();
                       }
                 });//.popover({ placement: 'bottom', html: 'true'});

                orgEl.on('mouseenter', function() {
                      orgEl.popover('show');
                });
                orgEl.on('mouseleave', function() {
                      orgEl.popover('hide');
                });
                orgs.on('mouseenter', function() {
                      orgEl.popover('show');
                });
                orgs.on('mouseleave', function() {
                      orgEl.popover('hide');
                });
            } //
          },1000);
        } //link
      }; //return
    }]); //directive

  }); //define