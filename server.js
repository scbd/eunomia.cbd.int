// CREATE HTTP SERVER AND PROXY

var app = require('express')();
var proxy = require('http-proxy').createProxyServer({});

app.set('views', __dirname + '/app');
app.set('view engine', 'ejs');

if(!process.env.API_URL)
  console.warn('warning: evironment API_URL not set. USING default (https://api.cbd.int:443)');


var apiUrl = process.env.API_URL || 'https://api.cbd.int:443';
var gitVersion = (process.env.COMMIT || 'UNKNOWN').substr(0, 7);


console.info(`info: eunomia.cbd.int`);
console.info(`info: Git version: ${gitVersion}`);
console.info(`info: API address: ${apiUrl}`);
console.info(`info: IS DEV: ${process.env.IS_DEV}`);

app.set('views', `${__dirname}/app`);
app.set('view engine', 'ejs');

app.use('/app/libs', require('serve-static')(__dirname + '/node_modules/@bower_components', { setHeaders: setCustomCacheControl }));
app.use('/app',      require('serve-static')(__dirname + '/app', { setHeaders: setCustomCacheControl }));

app.all('/api/*', function(req, res) { proxy.web(req, res, { target: apiUrl, changeOrigin: true } ); } );

app.all('/app/*', function(req, res) { res.status(404).send(); } );
app.get('/*',     function(req, res) { res.render('template', { gitVersion: gitVersion }); });


// START SERVER

app.listen(process.env.PORT || 2020, function () {
	console.log('Server listening on %j', this.address());
});

// Handle proxy errors ignore

proxy.on('error', function (e,req, res) {
    console.error('proxy error:', e);
    res.status(502).send();
});

process.on('SIGTERM', ()=>process.exit());

//============================================================
//
//
//============================================================
function setCustomCacheControl(res, path) {

	if(res.req.query && res.req.query.v && res.req.query.v==gitVersion && gitVersion!='UNKNOWN')
        return res.setHeader('Cache-Control', 'public, max-age=86400000'); // one day

    res.setHeader('Cache-Control', 'public, max-age=0');
}
