# Koa

Use miki-template with Koa by attaching an async render helper to the context.

## Setup

=== "CommonJS"

    ```javascript
    const Koa = require('koa');
    const path = require('path');
    const miki = require('miki-template');

    const app = new Koa();

    app.context.render = async function (view, locals = {}) {
      const html = await miki.asyncRender(view, locals, {
        views: path.resolve('./views')
      });
      this.type = 'text/html';
      this.body = html;
    };

    app.use(async (ctx) => {
      await ctx.render('index', { user: ctx.state.user });
    });

    app.listen(3000);
    ```

=== "ES Modules"

    ```javascript
    import { Koa } from 'koa';
    import miki from 'miki-template';
    import path from 'node:path';

    const app = new Koa();

    app.context.render = async function (view, locals = {}) {
      const html = await miki.asyncRender(view, locals, {
        views: path.resolve('./views')
      });
      this.type = 'text/html';
      this.body = html;
    };

    app.use(async (ctx) => {
      await ctx.render('index', { user: ctx.state.user });
    });

    export default app;
    ```

## Partial Rendering

=== "CommonJS"

    ```javascript
    app.use(async (ctx) => {
      const html = await miki.asyncRender(
        `home#${ctx.params.name}`,
        { user: ctx.state.user },
        { views: path.resolve('./views') }
      );
      ctx.type = 'text/html';
      ctx.body = html;
    });
    ```

=== "ES Modules"

    ```javascript
    app.use(async (ctx) => {
      const html = await miki.asyncRender(
        `home#${ctx.params.name}`,
        { user: ctx.state.user },
        { views: './views' }
      );
      ctx.type = 'text/html';
      ctx.body = html;
    });
    ```

## Next Steps

- [Integrations Overview](../index.md)
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9-]+)\.md
, '../.md' -replace '([a-z][a-z0-9-]+)
, '../.md' 
