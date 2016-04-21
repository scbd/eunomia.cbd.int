define(['app', 'lodash',
  'text!./reservation.html',
  'moment',
  '../../color-picker'
], function(app, _, template,moment) {

  app.directive("reservation", ['$timeout','mongoStorage','$document','$timeout',
    function($timeout,mongoStorage,$document,$timeout) {
      return {
        restrict: 'E',
        template: template,
        replace: true,
        transclude: false,
        scope: {'doc':'=?','startObj':'=?','closeThisDialog':'&'},
        link: function($scope, $element) {
//console.log($scope.startObj);
            init();

            //============================================================
            //
            //============================================================
            function triggerChanges (){

                 $element.find('input').each(function(){
                      $timeout($(this).trigger('change'),100);
                      if($(this).attr('id')!=='test'){

                          isEmptyModel($(this));

                        }
                 });//jquery each
                 $element.find('select').each(function(){
                      $timeout(isEmptyModel($(this)));
                 });//jquery each
            }//triggerChanges

            //============================================================
            //
            //============================================================
            function dateChangeEffect(id) {
              var el =$element.find('#' + id);
              if(el.parent().hasClass('form-group')){
                  el.parent().addClass('is-focused');
                  $timeout(function() {
                    el.parent().removeClass('is-focused');
                  }, 2000);

              }else if(el.parent().parent().hasClass('form-group')){
                el.parent().parent().addClass('is-focused');
                $timeout(function() {
                  el.parent().parent().removeClass('is-focused');
                }, 2000);

              }
            }; //init
            //============================================================
            // adds isEmpty css if ngModel empty
            //============================================================
            function isEmptyModel (el){
              var ngModel,ngModelSub,$formGroup;
              ngModel= el.attr('ng-model');
              if(ngModel && ngModel!=='binding'){
                ngModelSub=ngModel.substring(ngModel.indexOf('.')+1,ngModel.length);
                   if(!$scope.doc[ngModelSub]){
                     $formGroup = el.closest(".form-group");
                      $formGroup.addClass("is-empty");
                    }//
              }//if(ngModel)
            }/// isEmptyModel

          //============================================================
          //
          //============================================================
          function initTypes() {
            var parentObj,typesTemp;
            return mongoStorage.getDocs('reservation-types', status,true).then(function(result) {
              $scope.options.types = result.data;
              _.each($scope.options.types,function(type,key){
                    type.showChildren=true;
                    if(type._id===$scope.doc.type)type.selected=true;
                     if(type.parent){
                       parentObj= _.find($scope.options.types,{'_id':type.parent});
                       if(!parentObj) throw "error ref to parent res type not found.";
                       if(!parentObj.children)parentObj.children=[];
                       parentObj.children.push(type);
                       delete($scope.options.types[key]);
                     }
              });
              if(isSideEvent()){
                  typesTemp=[];
                  var seType=_.find($scope.options.types,{'_id':'570fd0a52e3fa5cfa61d90ee'});
                  typesTemp.push();

                  typesTemp=_.sortBy(seType.children,function(o){return o.title});
                  _.each(typesTemp,function(t){t.title='___ '+t.title;});
                  typesTemp.unshift(seType);
                  $scope.options.types=typesTemp;
              }

            }).catch(function onerror(response) {
              $scope.onError(response);
            });
          }

          //============================================================
          //
          //============================================================
          function isSideEvent() {
                if($scope.doc.type==='570fd0a52e3fa5cfa61d90ee') return true;
                var seType= _.find($scope.options.types,{'_id':'570fd0a52e3fa5cfa61d90ee'});
                return _.find(seType.children,{'_id':$scope.doc.type});
          }
          //============================================================
          //
          //============================================================
          function init() {
              $scope.options={};
              $scope.tabs={'details':{'active':true},'resources':{'active':false},'compound':{'active':false}};
              initTypes();
              initMaterial();
              triggerChanges();
          }//init
          //============================================================
          //
          //============================================================
          function initMaterial() {
            $document.ready(function() {
                $.material.init();
                $.material.input();
                $.material.ripples();



                $element.find('#start').bootstrapMaterialDatePicker({
                    time:true,
                    date: true,
                    shortTime: true,
                    format: 'YYYY-MM-DD  hh:mm a'
                });
                $element.find('#end').bootstrapMaterialDatePicker({
                    time:true,
                    date: true,
                    shortTime: true,
                    format: 'YYYY-MM-DD  hh:mm a'
                });


                  $timeout(function(){
                    if($scope.doc.start)
                        $element.find('#start').bootstrapMaterialDatePicker('setDate',moment.utc($scope.doc.start));
                    else
                        $element.find('#start').bootstrapMaterialDatePicker('setDate',moment($scope.startObj));
                    $element.find('#start').trigger('change');
                  });
                  $timeout(function(){
                    if($scope.doc.end)
                      $element.find('#end').bootstrapMaterialDatePicker('setDate',moment.utc($scope.doc.end));
                    else
                      $element.find('#end').bootstrapMaterialDatePicker('setDate',moment($scope.startObj).add(30,'minutes'));
                    $element.find('#end').trigger('change');
                  });

                  $element.find('#start').on('change',function(e,date){
console.log(date);
                      // $scope.startObj=moment.utc(date);
                      // $scope.start=moment.utc(date)
                  });

            });
          }//init


        } //link
      }; //return
    }
  ]);
});