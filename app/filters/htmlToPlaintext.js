define(['app'], function(app) {

  var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      str = str.replace(/\u00a0/gmi, ' ');
      element.textContent = '';
    }

    return str.replace(/\n{2,}/g, '\n\n')
              .replace(/[\t]/g, '  ')
              .trim();
  }

  return decodeHTMLEntities;
})();
  app.filter('htmlToPlaintext', function() {
      return function(text) {
        return  text ? decodeEntities(text) : '';
      };
    }
  );

});
