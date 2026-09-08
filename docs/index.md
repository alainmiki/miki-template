# miki-template

Django-style template magic for Node.js — blazing fast partials, smart template discovery, and zero friction for HTMX.
miki comes with more tags and filters that are not in django/jinja and miki templates supports all django tags and filters plus it own additional tags and filters.
you can register your own custom filters and filters in miki templates.

miki is secure and production ready with active maintainer and performance improvements.

[Get Started](guide/quick-start.md) | [API Reference](api/index.md) | [GitHub](https://github.com/alainmiki/miki-template)

![miki-template banner](assets/banner.png)

## Why miki-template?

miki-template brings Django's beloved template language to Node.js and Express. Define reusable partials with `{% partialdef %}`, render any slice of a page with `render('home#card')`, and let the engine find templates across your whole project — `templates/`, `app/templates/`, or whatever structure you prefer.

- **Partial-powered templating**: `{% partialdef %}` blocks render by name anywhere — `res.render('home#card')`, `renderPartialFromSource(...)`, or `compiled.renderBlock('block')`. Built for HTMX-style partial responses.
- **Smart template discovery**: Stop hardcoding view paths. The engine searches `templates/`, nested app directories, and custom folder names automatically — just like Django.
- **One-line Express integration**: `miki.setupExpress(app, { extension: 'html', views: dir })` wires everything up. No boilerplate, no extra middleware.
- **Full Django syntax parity**: Variables, dotted lookups, filters (`|`), block tags (`{% %}`), template inheritance with `extends` and `block.super`.
- **Blazing fast**: Compiled AST rendering dominates on realistic pages — ~150× faster than pug, handlebars, and ejs on large templates.
- **ESM & CommonJS**: Works seamlessly with both `import` and `require` syntax.
- **Security by default**: Auto-escaping, `SafeString`, CSRF and CSP tags.

## Quick example

=== "CommonJS"

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

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

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

See the [Installation guide](guide/installation.md) for pnpm, yarn, and Bun instructions.

## Documentation

- [What is miki-template?](guide/what-is-miki-template.md)
- [Getting Started](guide/getting-started.md)
- [Quick Start](guide/quick-start.md)
- [Filters](guide/filters.md)
- [Tags](guide/tags.md)
- [Partial Templates](guide/partial-templates.md)
- [Template Inheritance](guide/template-inheritance.md)
- [Template Discovery](guide/template-discovery.md)
- [Security](guide/security.md)
- [Integrations](integrations/index.md)
- [API Reference](api/index.md)
- [Performance](performance.md)

## License

MIT
