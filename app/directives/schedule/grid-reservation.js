define(['app', 'text!./grid-reservation.html','lodash', 'services/when-element'], function(app, template,_) {
    app.directive("gridReservation", ['whenElement', '$route', 
        function(whenElement, $route) {
            return {
                restrict  : 'E',
                template  : template,
                replace   : true,
                transclude: false,
                scope: {
                          'doc'   : '=',
                          'start' : '=',
                          'popRes': '&',
                          'popVid': '&',
                          'interactioEventsMap' : '=',
                      },
                link: function($scope, $element) {
                  
                  $scope.color = '#dddddd'
                  $scope.interactioEvent = ($scope.interactioEventsMap || []).find((e) => e.interactioEventId === $scope.doc.interactioEventId);
                  
                  $element.ready(init)



                  function hasAgenda(doc){

                      if(doc.agenda && doc.agenda.items && !_.isEmpty(doc.agenda.items) )
                        return true;
                      else
                        return false;

                  }
                  $scope.hasAgenda=hasAgenda;


                  function init() {

                    whenElement(`res-el-${$scope.doc._id}`, $element)
                        .then(setPopOver)
                        .then(() => $scope.$applyAsync(updateColor))
                        .then(() => $scope.$applyAsync(loadReservation))

                  } 

                  async function setPopOver(titleEl) {

                    const popOverOptions = {
                                              placement: 'top',
                                              html     : 'true',
                                              container: 'body',
                                              content  : () => $element.find('#pop-title').html()
                                            }

                    titleEl.popover(popOverOptions);
                    titleEl.on('mouseenter', () => titleEl.popover('show'))
                    titleEl.on('mouseleave', () => titleEl.popover('hide'))
                    $element.on('$destroy',  () => titleEl.popover('destroy'))
                  }

                  function updateColor(){

                    if($scope.doc.typeObj) $scope.color=$scope.doc.typeObj.color;
                    if($scope.doc.subTypeObj) $scope.color=$scope.doc.subTypeObj.color;
                  }

                  function loadReservation(){
                    const { edit } = $route.current.params

                    if(!edit || edit !== $scope.doc._id) return

                    whenElement(`res-el-${edit}-outer`, $element)
                    .then(($outerEl) => $scope.$applyAsync(() => $outerEl.click()))
                  }

          } //link
            }; //return
        }
    ]);
});