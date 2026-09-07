# miki-template

<div class="md-hero">
  <h1 class="md-hero__title">miki-template</h1>
  <p class="md-hero__subtitle">Django-style template magic for Node.js — blazing fast partials, smart template discovery, and zero friction for HTMX.</p>
  <div class="md-hero__buttons">
    <a href="guide/quick-start" class="md-button md-button--primary">Get Started</a>
    <a href="api/" class="md-button">API Reference</a>
    <a href="https://github.com/alainmiki/miki-template" class="md-button" target="_blank" rel="noopener">
      <span class="md-icon">&#128190;</span> GitHub
    </a>
  </div>
</div>

<div class="md-typeset">

## Why miki-template?

miki-template brings Django's beloved template language to Node.js and Express. Define reusable partials with `{% partialdef %}`, render any slice of a page with `render('home#card')`, and let the engine find templates across your whole project — `templates/`, `app/templates/`, or whatever structure you prefer.

- **Partial-powered templating**: `{% partialdef %}` blocks render by name anywhere — `res.render('home#card')`, `renderPartialFromSource(...)`, or `compiled.renderBlock('block')`. Built for HTMX-style partial responses.
- **Smart template discovery**: Stop hardcoding view paths. The engine searches `templates/`, nested app directories, and custom folder names automatically — just like Django.
- **One-line Express integration**: `miki.setupExpress(app, { extension: 'html', views: dir })` wires everything up. No boilerplate, no extra middleware.
- **Full Django syntax parity**: Variables, dotted lookups, filters (`|`), block tags (`{% %}``, template inheritance with `extends` and `block.super`.
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

## Features at a glance

| Feature | Description |
|---------|-------------|
| **Partial Templates** | Define and render template fragments by name |
| **Smart Discovery** | Auto-finds templates across your project |
| **Express Integration** | One-line setup with full middleware support |
| **Django Syntax** | Familiar `{% tag %}` and `{{ var }}` syntax |
| **Filters & Tags** | Extensible filter and custom tag system |
| **Async Rendering** | Full async/await support for modern Node.js |
| **Security** | Auto-escaping and sandboxed execution |
| **i18n** | Built-in internationalization support |

## Documentation

<div class="md-grid" markdown>
<div class="md-typeset__scrollwrap">

| Section | Description |
|---------|-------------|
| [Getting Started](guide/getting-started) | What is miki-template and why use it |
| [Installation](guide/installation) | How to install and configure |
| [Quick Start](guide/quick-start) | Get up and running in minutes |
| [Core Features](guide/partial-templates) | Partial templates, discovery, inheritance, filters, tags |
| [Advanced Usage](guide/advanced-usage) | Custom tags, filters, context processors, async |
| [API Reference](api/) | Complete API documentation |
| [Integrations](integrations/) | Express, Koa, Fastify, Hono, Elysia |
| [Performance](performance) | Benchmark results and optimization tips |

</div>
</div>

## Installation

```bash
npm install miki-template
```

## License

MIT

</div>
