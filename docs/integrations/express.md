# Express

Express is the most common integration. Use `setupExpress()` for one-line setup.

## Setup

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });

app.get('/', (req, res) => res.render('home', { user: req.user }));
app.get('/partials/:name', (req, res) =>
  res.render(`home#${req.params.name}`, { user: req.user })
);

app.listen(3000);
```

## Manual Setup

If you prefer full control:

```javascript
const express = require('express');
const { __express } = require('miki-template');

const app = express();
app.engine('html', __express);
app.set('view engine', 'html');
app.set('views', './views');
```

## Async Express 5+

```javascript
miki.setupExpress(app, { extension: 'html', views: './views', async: true });
```

## Partial Renderer Middleware

Add partial rendering without changing engine registration:

```javascript
app.use(miki.expressPartialRenderer());

app.get('/card', (req, res) => res.renderPartial('home#card', { user: req.user }));
```

## Next Steps

- [Integrations Overview](../)
- [API Reference: setupExpress](../api/setup-express)
