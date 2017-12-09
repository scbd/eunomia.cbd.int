define(['app', 'lodash',  'text!./agenda-select.html', 'css!libs/angular-dragula/dist/dragula.css'], function(app, _, template) {

  app.directive("agendaSelect", ['$timeout','dragulaService','$q','$http','$compile',
    function($timeout,dragulaService,$q,$http,$compile) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        require: 'agendaSelect',
        scope: {'binding':'=ngModel',conference:"="},
        link: function($scope, $element,$attr,$ctrl) {
            $scope.fileToAdd = '';
            var watchKill = $scope.$watch('conference',function(){
              if($scope.conference && !_.isEmpty($scope.conference)&& !_.isEmpty($scope.conference.meetings)){

                  _.each($scope.conference.meetings,function(m){
                        if(!m.agenda)
                          m.agenda={};

                        _.each(m.agenda.items,function(i){
                              if(i.item>-1)
                                i.display=i.item+' '+(i.shortTitle || i.title);
                        });

                        $ctrl.loadDocuments(m).then(function(d){
                          m.files=d;
                          console.log(m.files)
                        })

                  });
                  $ctrl.init();
                  watchKill();

              }
            });

        }, //link
        controller: ['$scope','dragulaService',function($scope,dragulaService) {

          dragulaService.options($scope, 'agenda-items', {
              removeOnSpill: false,
              moves: function (el, container, target) {
                  if (target.classList) {
                      return target.classList.contains('handle');
                  }
                  return false;
              }
          });

          //============================================================
          //
          //============================================================
          function init (){
              if(!$scope.binding )
               $scope.binding={};

              if($scope.binding.visible===undefined)
                $scope.binding.visible = true;

              if(!$scope.binding.items)
                  $scope.binding.items=[];

              hideAllFiles($scope.binding.hideFiles)

          }//
          this.init=init;



          //============================================================
          //
          //============================================================
          function loadDocuments(meeting){


                return $http.get('/api/v2016/meetings/'+meeting.EVT_CD+'/documents', { params: {  } }).then(function(res){

                    var docs = _(res.data).map(function(d) {
                            d.metadata = d.metadata || {};

                            _.defaults(d.metadata, {
                                printable: ['crp', 'limited', 'non-paper'].indexOf(d.nature)>=0
                            });
                            d.display = d.symbol + ' ' + d.title.en


                            return d;
                        }).value()

                    var docsByItem = {}
                        _.each(meeting.agenda.items,function(i){
                            _.each(docs,function(d){
                                  if(!Array.isArray(docsByItem[i.item])) docsByItem[i.item] = []
                                  if(d.agendaItems && ~d.agendaItems.indexOf(i.item))
                                    docsByItem[i.item].push(d)
                            });
                        });

                    return docsByItem
                });


          }//loadDocuments
          this.loadDocuments = loadDocuments;

          //============================================================
          //
          //============================================================
          function fileSelected(item,file){
            if(!Array.isArray(item.files)) item.files = []
            item.files.push({_id:file._id,display:file.display,symbol:file.symbol,title:file.title})
          }//fileSelected
          $scope.fileSelected=fileSelected;
          //============================================================
          //
          //============================================================
          function hideAllFiles (hideBool){

            _.each($scope.binding.items,function(i){
              i.showFiles=hideBool
            });
          }//hideAllFiles
          $scope.hideAllFiles=hideAllFiles;
          //============================================================
          //
          //============================================================
          function deleteFile (item,file){

              _.each(item.files,function(i,index){

                  if(i && i._id===file._id)
                    item.files.splice(index,1);
              });

          }//deleteItem
          $scope.deleteFile=deleteFile;
          //============================================================
          //
          //============================================================
          function getAgendaItem(meetingCode,item){

              var meeting = _.find($scope.conference.meetings,{EVT_CD:meetingCode})
              return meeting.agenda
          }//itemSelected
          //============================================================
          //
          //============================================================
          function getFile(meetingCode,item,id){
              var files = getFiles(meetingCode,item)
              console.log('id',id)
              console.log('_.find(files,{_id:id})',_.find(files,{_id:id}))
              return _.find(files,{_id:id})
          }//itemSelected

          //============================================================
          //
          //============================================================
          function getFiles(meetingCode,item){
              var meeting = _.find($scope.conference.meetings,{EVT_CD:meetingCode})
              if(!meeting || !meeting.files) return []
              return meeting.files[item]
          }//itemSelected
          $scope.getFiles=getFiles;

          //============================================================
          //
          //============================================================
          function getNumFiles(meetingCode, item){
              var meeting = _.find($scope.conference.meetings,{EVT_CD:meetingCode})
              if(!meeting || !meeting.files) return 0
              return meeting.files[item].length
          }//itemSelected
          $scope.getNumFiles=getNumFiles;

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
          }//clearStatus
          $scope.clearStatus=clearStatus;
          //============================================================
          //
          //============================================================
          function setStatus (item,status){

              item.status=status;
          }//setStatus
          $scope.setStatus=setStatus;

          //============================================================
          //
          //============================================================
          function deleteItem (item){

              _.each($scope.binding.items,function(i,index){
                  if(i && i.item===item.item )
                    $scope.binding.items.splice(index,1);
              });
          }//deleteItem
          $scope.delete=deleteItem;

          //============================================================
          //
          //============================================================
          function getPrefix(item){

            var meeting = _.find($scope.conference.meetings,{EVT_CD:item.meeting});
            return meeting.agenda.prefix;
          }//getPrefix
          $scope.getPrefix=getPrefix;

          //============================================================
          //
          //============================================================
          function getTitle(item){

              var meeting = _.find($scope.conference.meetings,{EVT_CD:item.meeting});

              var i       = _.find(meeting.agenda.items,{item:Number(item.item)});
              var title = (i.shortTitle || i.title).substring(0,25);

              return title;
          }//getTitle
          $scope.getTitle=getTitle;
          //============================================================
          //
          //============================================================
          function createAgendaItem(meeting, item){

              if(!item) throw "error no item found in meetings agenda";
              $scope.binding.items.push({meeting:meeting.EVT_CD,item:item.item,showFiles:false});

          }//createAgendaItem
          $scope.itemSelected=itemSelected;

        } ]//controller
      }; //return
    }]); // directive
});//require
