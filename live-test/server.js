const express = require('express');
const path = require('path');
const miki = require('miki-template');

const app = express();
const views = path.join(__dirname, 'views');

miki.setupExpress(app, { extension: 'html', views });

app.get('/', (req, res) => {
  res.render('index', { name: 'Live NPM' });
});

app.listen(3002, () => console.log('Live test app listening on 3002'));
