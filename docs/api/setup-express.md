# setupExpress()

One-line Express integration that wires the view engine, views directory, and partial responses.

## Signature

```javascript
setupExpress(app, options = {})
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `extension` | `string` | View file extension, default `'html'` |
| `views` | `string\|string[]` | Views directory path(s) |
| `async` | `boolean` | Use async engine for Express 5+ |

## What It Does

- Calls `app.engine()` with the miki engine.
- Sets `app.set('view engine', extension)`.
- Sets `app.set('views', views)`.
- Patches `res.render` to support `view#partial` syntax.

## Example

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });

app.get('/', (req, res) => res.render('home', { user: req.user }));
app.get('/card/:id', (req, res) =>
  res.render(`home#card`, { title: 'Hello' })
);

app.listen(3000);
```

## Related

- [Integrations: Express](../integrations/express)
