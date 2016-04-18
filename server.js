/* jshint node: true, browser: false, esnext: true */
'use strict';

process.on('SIGTERM', ()=>process.exit());

// CREATE HTTP SERVER AND PROXY

var app = require('express')();
var proxy = require('http-proxy').createProxyServer({});

app.set('views', __dirname + '/app');
app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));

// CONFIGURE ROUTES

app.use('/app',   require('serve-static')(__dirname + '/app_build'));
app.use('/app',   require('serve-static')(__dirname + '/app'));
app.all('/app/*',       (req, res) => res.status(404).send());
app.all('/api/*',       (req, res) => proxy.web(req, res, { target: 'https://api.cbddev.xyz', changeOrigin: true } ));
app.all('/socket.io/*', (req, res) => proxy.web(req, res, { target: 'https://api.cbddev.xyz', changeOrigin: true } ));

// CONFIGURE TEMPLATE

app.get('/*', (req, res) => res.render('template', { baseUrl: req.headers.base_url || '/' }));

// START SERVER

app.listen(process.env.PORT || 2020, function () {
	console.log('Server listening on %j', this.address());
});

// Handle proxy errors ignore

proxy.on('error', function (e,req, res) {
    console.error('proxy error:', e);
    res.status(502).send();
});
