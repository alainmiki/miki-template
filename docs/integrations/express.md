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

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `extension` | `'html'` | File extension for views. Use `'miki'` if you prefer `.miki` files. |
| `views` | `app.get('views')` | Views directory (passed to `app.set('views', ...)`). |
| `async` | `false` | Use the async engine (`__expressAsync`). For Express 5 with async helpers. |

> The `res.render` shim intercepts **only** view names containing a `#`. Everything else (full pages, `res.render(view, cb)`, callback forms) goes through Express's normal view lookup, so the integration is fully compatible with existing Express middleware.

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

Express 5+ supports async route handlers natively. Pass `async: true` to `setupExpress`, or use `__expressAsync` directly:

```javascript
miki.setupExpress(app, { extension: 'html', views: './views', async: true });

app.get('/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send('Not found');
  res.render('user-profile', { user });
});
```

## Partial Renderer Middleware

Add partial rendering without changing engine registration:

```javascript
app.use(miki.expressPartialRenderer());

app.get('/card', (req, res) => res.renderPartial('home#card', { user: req.user }));
```

## HTMX Example

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });

// Full page
app.get('/', (req, res) => res.render('home', { user: req.user }));

// HTMX partial response — just append `#partialName` to the view name
app.get('/partials/:name', (req, res) =>
  res.render(`home#${req.params.name}`, { user: req.user })
);

app.listen(3000);
```

## ESM / Bun

```javascript
import express from 'express';
import miki from 'miki-template';

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });
app.listen(3000);
```

## Next Steps

- [Integrations Overview](../)
- [API Reference: setupExpress](../api/setup-express)
