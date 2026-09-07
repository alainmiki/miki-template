# Integrations Overview

miki-template works with all major Node.js web frameworks. Use `render()` for synchronous output or `asyncRender()` for templates with async filters/tags.

## Supported Frameworks

- [Express param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'express.md.md'  — One-line setup with `setupExpress()`
- [Koa param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'koa.md.md'  — Context helper using `asyncRender()`
- [Fastify param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'fastify.md.md'  — Inline `asyncRender()` calls
- [Hono param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'hono.md.md'  — ESM-first, using `asyncRender()`
- [Elysia param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'elysia.md.md'  — ESM-first, using `asyncRender()`
- [NestJS param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'nestjs.md.md'  — Module/Provider pattern
- [TSDX / TS-Economy (TSed) param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'tsed.md.md'  — TypeScript integration

## Quick Example

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/', (req, res) => res.render('home', { user: req.user }));

    app.listen(3000);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/', (req, res) => res.render('home', { user: req.user }));

    app.listen(3000);
    ```

## Notes

- For CommonJS: `const miki = require('miki-template');`
- For ESM / Bun: `import miki from 'miki-template';` or `import * as miki from 'miki-template';`
- When rendering files, pass `options.views` or set framework view roots so the engine can locate templates.
- Use `asyncRender()` if your templates use async filters, async tags, or `{% load %}` libraries with async components.

## Installation

```bash
# npm
npm install miki-template

# bun
bun add miki-template

# yarn
yarn add miki-template
```

## Next Steps

- [Express Integration param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'express.md.md' 
- [API Reference: render param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render.md.md' 
