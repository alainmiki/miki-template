const express = require('express');
const path = require('path');
const miki = require('miki-template');

const app = express();
const views = path.join(__dirname, 'views');
const templatesRoot = path.join(__dirname, 'templates');

// Demonstrate multiple discovery roots: explicit views dir,
// plus a top-level `templates/` (Django-style) and app-style nested folders
// discovered anywhere under the project root.
miki.setupExpress(app, { extension: 'html', views: [views, templatesRoot, __dirname] });

// Note: `miki.setupExpress` may expand `app.get('views')` to include
// nested template directories (project-level `templates/`,
// app-style `packages/*/templates/...`, etc.). The live-test app
// intentionally passed multiple roots to demonstrate discovery.

app.get('/', (req, res) => {
  res.render('index', { name: 'Live NPM' });
});

// Render a nested child template that extends base.html located in views/
app.get('/child', (req, res) => {
  res.render('child', { title: 'From Live', message: 'Hello from child' });
});

// Render a template located under templates/app_templates/detail.html

app.get('/app-detail', (req, res) => {
  res.render('detail', { item: 'Widget 42' });
});

app.get('/product', (req, res) => {
  res.render('product/detail', { name: 'Gizmo', price: '$19.99' });
});

app.listen(3002, () => console.log('Live test app listening on 3002'));
