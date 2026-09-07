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
  <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative; align-items: center;">
    <img src="assets/banner.png" alt="miki-template banner" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 12px var(--md-shadow-color); max-height: 200px;">
  </div>
  <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; position: relative; align-items: center;">
    <a href="https://www.npmjs.com/package/miki-template" target="_blank" rel="noopener">
      <img src="https://img.shields.io/npm/v/miki-template.svg" alt="npm version" style="height: 20px;">
    </a>
    <a href="https://www.npmjs.com/package/miki-template" target="_blank" rel="noopener">
      <img src="https://img.shields.io/npm/dm/miki-template.svg" alt="npm downloads" style="height: 20px;">
    </a>
    <a href="https://github.com/alainmiki/miki-template" target="_blank" rel="noopener">
      <img src="https://img.shields.io/github/actions/workflow/status/alainmiki/miki-template/ci.yml?branch=main" alt="CI status" style="height: 20px;">
    </a>
  </div>
</div>

<div class="md-typeset">

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

See the [Installation guide param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/installation.md'  for pnpm, yarn, and Bun instructions.

## Documentation

- [What is miki-template? param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/what-is-miki-template.md' 
- [Getting Started param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/getting-started.md' 
- [Quick Start param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/quick-start.md' 
- [Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/filters.md' 
- [Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/tags.md' 
- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/partial-templates.md' 
- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/template-inheritance.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/template-discovery.md' 
- [Security param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'guide/security.md' 
- [Integrations param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'integrations/.md' 
- [API Reference param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'api/.md' 
- [Performance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'performance.md' 

## License

MIT

</div>
