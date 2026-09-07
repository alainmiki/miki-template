# Hono

Use miki-template with Hono (ESM-first framework) by calling `asyncRender()` in your handlers.

## Setup

=== "ES Modules"

    ```javascript
    import { Hono } from 'hono';
    import miki from 'miki-template';

    const app = new Hono();

    app.get('/', async (c) => {
      const html = await miki.asyncRender(
        'index',
        { user: c.get('user') },
        { views: './views' }
      );
      return c.html(html);
    });

    export default app;
    ```

=== "CommonJS"

    ```javascript
    const { Hono } = require('hono');
    const miki = require('miki-template');

    const app = new Hono();

    app.get('/', async (c) => {
      const html = await miki.asyncRender(
        'index',
        { user: c.get('user') },
        { views: './views' }
      );
      return c.html(html);
    });

    module.exports = app;
    ```

## Partial Rendering

=== "ES Modules"

    ```javascript
    app.get('/partials/:name', async (c) => {
      const html = await miki.asyncRender(
        `home#${c.req.param('name')}`,
        { user: c.get('user') },
        { views: './views' }
      );
      return c.html(html);
    });
    ```

=== "CommonJS"

    ```javascript
    app.get('/partials/:name', async (c) => {
      const html = await miki.asyncRender(
        `home#${c.req.param('name')}`,
        { user: c.get('user') },
        { views: './views' }
      );
      return c.html(html);
    });
    ```

## Next Steps

- [Integrations Overview param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
