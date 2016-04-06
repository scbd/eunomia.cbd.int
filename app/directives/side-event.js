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
        link: function($scope, $element, $attr) {
            var orgEl = $element.find("div.num-orgs").popover({ placement: 'bottom', html: 'true',container: 'body',
               content: function() {
                 return $element.find('#pop-orgs').html();
               }

          });//.popover({ placement: 'bottom', html: 'true'});

          var orgs = $element.find("#orgs").popover({ placement: 'bottom', html: 'true',container: 'body',
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

          $scope.popOrgs =function(){
                $timeout(function(){orgEl.popover('hide');},3000);
          };
          } //link
      }; //return
    }]); //directive

  }); //define