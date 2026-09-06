## Integrations — miki-template

This document shows concise examples for integrating `miki-template` with popular Node.js and Bun web frameworks. Use the synchronous `render()` API for CPU-bound sync templates, and `asyncRender()` when using async helpers.

Notes
- For CommonJS: `const miki = require('miki-template');`
- For ESM / Bun: `import miki from 'miki-template';` or `import * as miki from 'miki-template';`
- When rendering files, pass `options.views` or set framework view roots so the engine can locate templates.

Setup (install)

```bash
# npm
npm install miki-template

# bun
bun add miki-template
```

Express (recommended: use `setupExpress`)

CommonJS

```js
const express = require('express');
const miki = require('miki-template');

const app = express();

// One-line setup: wires engine, sets views, and patches res.render to support `view#partial`
miki.setupExpress(app, { extension: 'html', views: './views' });

app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/partial/:name', (req, res) => {
  // Renders only the named partial inside the template
  res.render(`index#${req.params.name}`, { user: req.user });
});

app.listen(3000);
```

ESM / Bun (similar)

```js
import express from 'express';
import miki from 'miki-template';

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });
app.listen(3000);
```

Koa

```js
// CommonJS
const Koa = require('koa');
const path = require('path');
const miki = require('miki-template');

const app = new Koa();

// Simple render helper attached to context
app.context.render = async function (view, locals = {}) {
  const html = await miki.asyncRender(view, locals, { views: path.resolve('./views') });
  this.type = 'text/html';
  this.body = html;
};

app.use(async (ctx) => {
  await ctx.render('index', { user: ctx.state.user });
});

app.listen(3000);
```

Fastify

```js
const Fastify = require('fastify');
const path = require('path');
const miki = require('miki-template');

const app = Fastify();

app.get('/', async (request, reply) => {
  const html = await miki.asyncRender('index', { user: request.user }, { views: path.resolve('./views') });
  reply.type('text/html').send(html);
});

app.listen(3000);
```

NestJS (Express under the hood)

```ts
// In main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as miki from 'miki-template';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Use the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance();
  miki.setupExpress(expressApp, { extension: 'html', views: './views' });
  await app.listen(3000);
}
bootstrap();
```

Ts.ED

```ts
// In server bootstrap
import { ServerLoader } from '@tsed/di';
import * as miki from 'miki-template';

// Ts.ED also runs on Express/Koa — obtain the underlying app
// and call miki.setupExpress(...) when using the Express adapter.

// Example when using Express adapter:
// miki.setupExpress(server.rawApp, { extension: 'html', views: './views' });
```

Elysia (Bun-friendly)

```js
// ESM / Bun example
import { Elysia } from 'elysia';
import * as miki from 'miki-template';
import path from 'path';

const app = new Elysia();

app.get('/', async () => {
  const html = await miki.asyncRender('index', { }, { views: path.resolve('./views') });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});

app.listen(3000);
```

Hono (Edge + Bun)

```js
import { Hono } from 'hono';
import * as miki from 'miki-template';
import path from 'path';

const app = new Hono();

app.get('/', async (c) => {
  const html = await miki.asyncRender('index', { }, { views: path.resolve('./views') });
  return c.html(html);
});

app.listen({ port: 3000 });
```

Nifra / other minimal frameworks

```js
// Generic handler pattern — works in almost any framework
// (Nifra users can adapt the response API)
const miki = require('miki-template');
const path = require('path');

async function handler(req, res) {
  const html = await miki.asyncRender('index', { }, { views: path.resolve('./views') });
  res.setHeader('Content-Type', 'text/html');
  res.end(html);
}
```

Bun-specific notes
- Bun is ESM-first; import `miki-template` using `import miki from 'miki-template'`.
- Use `bun add miki-template` to install.
- When using Bun's native servers, call `miki.asyncRender(...)` and return/send the Response object accordingly.

Tips and best practices
- Prefer `miki.setupExpress()` for Express-based apps — it wires partial rendering and view expansion.
- For non-Express frameworks, call `miki.render()` (sync) or `miki.asyncRender()` (async) and set `options.views` to your views root (or pass absolute file paths resolved with your framework).
- To support Django-style app templates (e.g. `packages/*/templates/...`), call `miki.setAppTemplateDirNames(['templates','app_templates'])` early in your app startup if you use a custom folder name.

Engine usage & partial rendering

Use the engine APIs directly when you don't want framework-specific wiring or when you need fine-grained control over `views` roots.

```js
const miki = require('miki-template');
const path = require('path');

// Sync render of a named partial inside a template file
const html = miki.render('home#card', { user: 'Alice', title: 'Card' }, { views: path.resolve('./views') });

// Async render when templates use async helpers
const htmlAsync = await miki.asyncRender('home#card', { user: 'Bob' }, { views: path.resolve('./views') });

// If your project arranges templates under custom folder names, configure
// what constitutes an "app template" directory before rendering:
miki.setAppTemplateDirNames(['templates', 'app_templates']);

// To locate a template file programmatically without rendering, use the
// exported finder helper:
const found = miki.findTemplateInViews('home', [path.resolve('./views')]);
if (found) console.log('Resolved to', found);
```

Further reading
- See the main API docs for `setupExpress`, `render`, and `asyncRender` in `docs/api.md`.
