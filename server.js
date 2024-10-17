// CREATE HTTP SERVER AND PROXY

const app   = require('express')();
const { JSDOM } = require('jsdom');

app.set('views', __dirname + '/app');
app.set('view engine', 'ejs');

const apiUrl      =   process.env.API_URL      || 'https://api.cbd.int'
const accountsUrl =   process.env.ACCOUNTS_URL || 'https://accounts.cbd.int'
const gitVersion  = ( process.env.COMMIT || 'UNKNOWN' ).substr(0, 7);


console.info(`info: eunomia.cbd.int`)
console.info(`info: Git version: ${gitVersion}`)
console.info(`info: API address: ${apiUrl}`)
console.info(`info: Accounts   : ${accountsUrl}`)
console.info(`info: port   : ${process.env.PORT }`)

app.set('views', `${__dirname}/app`);
app.set('view engine', 'ejs');

app.use('/app/libs', require('serve-static')(__dirname + '/node_modules/@bower_components', { setHeaders: setCustomCacheControl }));
app.use('/app',      require('serve-static')(__dirname + '/app', { setHeaders: setCustomCacheControl }));

app.all('/app/*', function(req, res) { res.status(404).send(); } );

app.get('/unwebtv/:locale/:code', getUnWebTvMetadata);

app.get('/*',     function(req, res) { res.render('template', { gitVersion, accountsUrl, apiUrl }); });


// START SERVER

app.listen(process.env.PORT || 2020, function () {
	console.log('Server listening on %j', this.address());
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

async function getUnWebTvMetadata(req, res) { // use this api to bypass CORS

    try {

        const locale = req.params.locale || 'en';
        const code    = req.params.code   || 'NOCODE';

        const url = `https://webtv.un.org/${encodeURIComponent(locale)}/asset/${encodeURIComponent(code.substring(0, 3))}/${encodeURIComponent(code)}`
        const response = await fetch(url);
        const html  = await response.text();

        const dom = new JSDOM(html);
        const document = dom.window.document;

        const title       = document.querySelector('meta[property="og:title"]')?.content || 'no title';
        const description = document.querySelector('meta[property="og:description"]')?.content || 'no description';
        const date        = document.querySelector('time')?.dateTime || 'no date';

        const metas = {
            title,
            description,
            date: new Date(date)
        };

        res.send(metas);

    }
    catch(e)
    {
        res.status(400).send({
            title: 'Error retreiving UN Webtv Information',
            description : e.message,
            date: null
        });
    }
}