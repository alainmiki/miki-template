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
| `async` | `boolean` | Use async engine (`__expressAsync`) for Express 5+ |

## What It Does

- Calls `app.engine()` with the miki view engine.
- Sets `app.set('view engine', extension)` if not already set.
- Sets `app.set('views', views)` if `options.views` is provided.
- Expands `views` to include nested template directories (app-style `templates/` folders).
- Patches `res.render` to support `view#partial` syntax for HTMX responses.

## Example

=== "CommonJS"

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

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/', (req, res) => res.render('home', { user: req.user }));
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello' })
    );

    app.listen(3000);
    ```

## Partial Responses

`setupExpress()` patches `res.render` so that any view name containing `#` renders only the named partial:

```javascript
// Renders only the "card" partialdef from home.html
res.render('home#card', { title: 'Hello' });
```

This is ideal for HTMX where you only need to update a portion of the page.

## Related

- [Integrations: Express param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../integrations/express.md.md' 
