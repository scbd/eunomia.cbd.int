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
          var orgs = $element.find("#title").popover({ placement: 'top', html: 'true',container: 'body',
                 content: function() {
                   return $element.find('#pop-title').html();
                 }
           });
           var titleEl = $element.find("#title");
           titleEl.on('mouseenter', function() {
                 orgs.popover('show');
           });
           titleEl.on('mouseleave', function() {
                 orgs.popover('hide');
           });
          $timeout(function(){
            if($scope.res.sideEvent && $scope.res.sideEvent.orgs.length >1 ){
                var orgEl = $element.find("div.num-orgs");//.popover({ placement: 'bottom', html: 'true'});

                var orgs = $element.find("#orgs").popover({ placement: 'bottom', html: 'true',container: 'body',
                       content: function() {
                         return $element.find('#pop-orgs').html();
                       }
                 });//.popover({ placement: 'bottom', html: 'true'});

                orgEl.on('mouseenter', function() {
                      orgs.popover('show');
                });
                orgEl.on('mouseleave', function() {
                      orgs.popover('hide');
                });
                orgs.on('mouseenter', function() {
                      orgs.popover('show');
                });
                orgs.on('mouseleave', function() {
                      orgs.popover('hide');
                });
            } //
          },1000);
        } //link
      }; //return
    }]); //directive

  }); //define