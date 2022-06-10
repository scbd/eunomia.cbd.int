define(['app', 'lodash',  'text!./agenda-select.html', 'css!https://cdn.jsdelivr.net/gh/scbd/angular-dragula@1.2.6/dist/dragula.min.css'], function(app, _, template) {

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
                        })

                  });
                  $ctrl.init();
                  watchKill();
              }
            });

        }, //link
        controller: ['$scope','dragulaService','$timeout',function($scope,dragulaService,$timeout) {

          //============================================================
          //
          //============================================================
          function isMeetingSelected(code){
            return $scope.binding?.meetings?.[code]
          }
          $scope.isMeetingSelected=isMeetingSelected;

          //============================================================
          //
          //============================================================
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
                            //d.display = d.symbol + ' ' + d.title.en

                            if(d.metadata && d.metadata.superseded )
                              d.disabled =true
                            d.display = (d.symbol || (d.title||{}).en) + ((d.metadata && d.metadata.superseded && ' - (Superseded by '+d.metadata.superseded+')')||'') ;
                            d.sortKey = sortKey(d);

                            return d;
                        }).sortBy(sortKey).value();

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

            $timeout(function(){
              if(!Array.isArray(item.files)) item.files = []
              item.files.push({_id:file._id,display:file.display,symbol:file.symbol,title:file.title})
              item.files = _(item.files).filter(function(f){return f && !!f._id; }).uniq('_id').value();
              var originalItem = getAgendaItem(item.meeting,item.item)

              // item was scoped from ng-repeat
              originalItem.files = item.files
              buildItemText (item)
              buildItemText (originalItem)
            })


          }//
          $scope.fileSelected=fileSelected;
          //============================================================
          //
          //============================================================
          function buildItemText (item){
            $timeout(function(){
              item.text=''
              _.each(item.files,function(file){
                var isCPR = /.*\b(CRP|L)(\d+)\b.*/i
                var isAddtional = /.*\b(?:CRP|L)\d+\/ADD(\d+)\b.*/i

                if(isCPR.test(file.symbol)){
                  if(item.text) item.text += ', '
                  item.text += file.symbol.replace(isCPR, "$1.$2" )
                  if(isAddtional.test(file.symbol))
                    item.text += '/Add.'+file.symbol.replace(isAddtional, "$1" )
                }
              });
            });
          }//hideAllFiles
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
              buildItemText (item)
          }//deleteItem
          $scope.deleteFile=deleteFile;

          //============================================================
          //
          //============================================================
          function getAgendaItem(meetingCode,item){

              var meeting = _.find($scope.conference.meetings,{EVT_CD:meetingCode})
              return _.find(meeting.agenda.items,{item:Number(item)});
          }//itemSelected

          //============================================================
          //
          //============================================================
          function getFile(meetingCode,item,id){
              var files = getFiles(meetingCode,item)
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
          function deleteItem (index){
            $scope.binding.items.splice(index,1);
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


          //==============================
          //
          //==============================
          function sortKey(d) {

              var typePos;

                   if(d.type=='in-session' && d.nature=="limited")     typePos = 10;
              else if(d.type=='in-session' && d.nature=="crp")         typePos = 20;
              else if(d.type=='in-session' && d.nature=="non-paper")   typePos = 30;
              else if(d.type=="official")                              typePos = 40;
              else if(d.type=="information")                           typePos = 50;
              else if(d.type=="other")                                 typePos = 60;
              else if(d.type=='in-session' && d.nature=="statement")   typePos = 70;

              return ("000000000" + (typePos   ||9999)).slice(-9) + '_' + // pad with 0 eg: 150  =>  000000150
                     (d.group||'') + '_' +
                   //  ((d.metadata||{}).superseded ? '1' : '0') + '_' +
                     ("000000000" + (d.displayPosition||9999)).slice(-9) + '_' + // pad with 0 eg: 150  =>  000000150
                     (d.symbol||"").replace(/\b(\d)\b/g, '0$1')
                                   .replace(/(\/REV)/gi, '0$1')
                                   .replace(/(\/ADD)/gi, '1$1');
          }
        } ]//controller
      }; //return
    }]); // directive
});//require
