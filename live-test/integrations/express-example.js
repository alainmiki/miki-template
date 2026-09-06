const express = require('express');
const path = require('path');
const miki = require('../../');

const app = express();
miki.setupExpress(app, { extension: 'html', views: path.resolve(__dirname, '..', 'views') });

app.get('/', (req, res) => res.render('home', { user: 'ExpressUser', title: 'ExpressCard' }));
app.get('/partial', (req, res) => res.render('home#card', { user: 'ExpressUser', title: 'ExpressCard' }));

if (require.main === module) app.listen(3000, () => console.log('Express example listening on 3000'));
module.exports = app;
