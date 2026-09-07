# miki-template

**Django-style template magic for Node.js — blazing fast partials, smart template discovery, and zero friction for HTMX.**

miki-template brings Django's beloved template language to Node.js and Express. Define reusable partials with `{% partialdef %}`, render any slice of a page with `render('home#card')`, and let the engine find templates across your whole project — `templates/`, `app/templates/`, or whatever structure you prefer.

## Why miki-template?

- **Partial-powered templating**: `{% partialdef %}` blocks render by name anywhere — `res.render('home#card')`, `renderPartialFromSource(...)`, or `compiled.renderBlock('block')`. Built for HTMX-style partial responses.
- **Smart template discovery**: Stop hardcoding view paths. The engine searches `templates/`, nested app directories, and custom folder names automatically — just like Django.
- **One-line Express integration**: `miki.setupExpress(app, { extension: 'html', views: dir })` wires everything up. No boilerplate, no extra middleware.
- **Full Django syntax parity**: Variables, dotted lookups, filters (`|`), block tags (`{% %}`), template inheritance with `extends` and `block.super`.
- **Blazing fast**: Compiled AST engine dominates on realistic pages — ~150× faster than pug, handlebars, and ejs on large templates.

## Quick example

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

## Installation

```bash
npm install miki-template
```

## Documentation

- [Getting Started](guide/getting-started)
- [Filters](guide/filters)
- [Tags](guide/tags)
- [Integrations](integrations/)
- [API Reference](api/)
- [Performance](performance)

## License

MIT
