define(['app', 'lodash',  'text!./agenda-select.html', 'css!libs/angular-dragula/dist/dragula.css'], function(app, _, template) {

  app.directive("agendaSelect", ['$timeout','dragulaService',
    function($timeout,dragulaService) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        require: 'agendaSelect',
        scope: {'binding':'=ngModel',conference:"="},
        link: function($scope, $element,$attr,$ctrl) {


var watchKill = $scope.$watch('conference',function(){
  if($scope.conference && !_.isEmpty($scope.conference)&& !_.isEmpty($scope.conference.meetings)){

      _.each($scope.conference.meetings,function(m){
            if(!m.agenda)m.agenda={};
            m.agenda.items.push({item:-1,display:'  '});
            _.each(m.agenda.items,function(i){
                  if(i.item>-1)
                    i.display=i.item+' '+(i.shortTitle || i.title);
            });

      });
      $ctrl.init();
      watchKill();

  }
});

        }, //link
        controller: ['$scope',function($scope) {

          //============================================================
          //
          //============================================================
          function init (){
              if(!$scope.binding )
               $scope.binding={};

              if(!$scope.binding.items)
                  $scope.binding.items=[];


          }//triggerChanges
          this.init=init;

          //============================================================
          //
          //============================================================
          function itemSelected(meeting, item){

              createAgendaItem(meeting, item);

          }//itemSelected
          $scope.itemSelected=itemSelected;

          //============================================================
          //
          //============================================================
          function clearStatus (item){

              delete(item.status);
          }//itemSelected
          $scope.clearStatus=clearStatus;
          //============================================================
          //
          //============================================================
          function setStatus (item,status){

              item.status=status;
          }//itemSelected
          $scope.setStatus=setStatus;

          //============================================================
          //
          //============================================================
          function deleteItem (item){

              _.each($scope.binding.items,function(i,index){
                  if(i && i.item===item.item && item.law===i.law)
                    $scope.binding.items.splice(index,1);
              });
          }//itemSelected
          $scope.delete=deleteItem;

          //============================================================
          //
          //============================================================
          function getPrefix(item){

            var meeting = _.find($scope.conference.meetings,{EVT_CD:item.meeting});
            return meeting.agenda.prefix;
          }//itemSelected
          $scope.getPrefix=getPrefix;

          //============================================================
          //
          //============================================================
          function getTitle(item){

              var meeting = _.find($scope.conference.meetings,{EVT_CD:item.meeting});

              var i       = _.find(meeting.agenda.items,{item:Number(item.item)});
              var title = (i.shortTitle || i.title).substring(0,25);
              if(title.length>=25) title=title+' ...';

              return title;
          }//itemSelected
          $scope.getTitle=getTitle;
          //============================================================
          //
          //============================================================
          function createAgendaItem(meeting, item){

              var itemObj = item;
              if(!itemObj) throw "error no item found in meetings agenda";
              var i =_.find($scope.binding.items,{meeting:meeting.EVT_CD,item:item.item});
              if(!i)
                $scope.binding.items.push({meeting:meeting.EVT_CD,item:item.item});

          }//itemSelected
          $scope.itemSelected=itemSelected;

        } ]//controller
      }; //return
    }]); // directive
});//require