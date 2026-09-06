const express = require('express');
const path = require('path');
const miki = require('../../');

const app = express();
miki.setupExpress(app, { extension: 'html', views: path.resolve(__dirname, '..', 'views') });

app.get('/', (req, res) => res.render('home', { user: 'ExpressUser', title: 'ExpressCard' }));
app.get('/partial', (req, res) => res.render('home#card', { user: 'ExpressUser', title: 'ExpressCard' }));

function start(port = 3000, host = '127.0.0.1') {
	return new Promise((resolve, reject) => {
		try {
			const srv = app.listen(port, host, () => {
				console.log('Express example listening on', port);
				resolve(srv);
			});
		} catch (err) { reject(err); }
	});
}

if (require.main === module) start().catch(err => { console.error(err); process.exit(1); });

module.exports = { app, start };
