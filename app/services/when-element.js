define(['app', 'lodash'], function loadFactory(app, _){
  app.factory('whenElement', ['$document', factory], ); 
}); 




  function factory($document) {
    
    function when(id, $element = $document, { iterations, time } = { iterations: 5, time: 500 } ) {

      return new Promise( (resolve, reject) => {

          let   iterationsCount = 0

          const interval = setInterval(() => {
            const testEl     = $element.find(`#${id}`).length
            const anElement  =  testEl? $element.find(`#${id}`) : $(document.getElementById(`${id}`))
            const isTimedOut = iterationsCount > iterations
            const canResolve = !!anElement && !!anElement.length && !isTimedOut 

              iterationsCount += 1;
              if (canResolve) {
                clearInterval(interval)
                return resolve(anElement)
              }
              if (isTimedOut) {
                clearInterval(interval)
                return reject('time out')
              }
              return
          }, time)
      });
    }


    return when
  }


  


