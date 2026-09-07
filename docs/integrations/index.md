# Integrations Overview

miki-template works with all major Node.js web frameworks. Use `render()` for synchronous output or `asyncRender()` for templates with async filters/tags.

## Supported Frameworks

- [Express](./express) — One-line setup with `setupExpress()`
- [Koa](./koa) — Context helper using `asyncRender()`
- [Fastify](./fastify) — Inline `asyncRender()` calls
- [Hono](./hono) — ESM-first, using `asyncRender()`
- [Elysia](./elysia) — ESM-first, using `asyncRender()`
- [NestJS](./nestjs) — Module/Provider pattern
- [TSDX / TS-Economy (TSed)](./tsed) — TypeScript integration

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

- [Express Integration](./express)
- [API Reference: render](../api/render)
