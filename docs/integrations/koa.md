# Koa

Use miki-template with Koa via the Koa adapter.

## Setup

```javascript
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

## CommonJS

```javascript
const Koa = require('koa');
const path = require('path');
const miki = require('miki-template');

const app = new Koa();

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

## ESM / Bun

```javascript
import { Koa } from 'koa';
import miki from 'miki-template';
import path from 'path';

const app = new Koa();

app.context.render = async function (view, locals = {}) {
  const html = await miki.asyncRender(view, locals, { views: path.resolve('./views') });
  this.type = 'text/html';
  this.body = html;
};

app.use(async (ctx) => {
  await ctx.render('index', { user: ctx.state.user });
});

export default app;
```

## Partial Rendering

```javascript
app.get('/partial/:name', async (ctx) => {
  await ctx.render(`home#${ctx.params.name}`, { user: ctx.state.user });
});
```

## Next Steps

- [Integrations Overview](../)
- [API Reference: asyncRender](../api/async-render)
