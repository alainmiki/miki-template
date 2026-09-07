# Elysia

Use miki-template with Elysia (Bun-native framework) by calling `asyncRender()` in your handlers.

## Setup

=== "ES Modules"

    ```javascript
    import { Elysia } from 'elysia';
    import miki from 'miki-template';

    const app = new Elysia();

    app.get('/', async () => {
      const html = await miki.asyncRender('index', {}, { views: './views' });
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    });

    export default app;
    ```

=== "CommonJS"

    ```javascript
    const { Elysia } = require('elysia');
    const miki = require('miki-template');

    const app = new Elysia();

    app.get('/', async () => {
      const html = await miki.asyncRender('index', {}, { views: './views' });
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    });

    module.exports = app;
    ```

## Partial Rendering

=== "ES Modules"

    ```javascript
    app.get('/partials/:name', async ({ params }) => {
      const html = await miki.asyncRender(
        `home#${params.name}`,
        {},
        { views: './views' }
      );
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    });
    ```

=== "CommonJS"

    ```javascript
    app.get('/partials/:name', async ({ params }) => {
      const html = await miki.asyncRender(
        `home#${params.name}`,
        {},
        { views: './views' }
      );
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    });
    ```

## Next Steps

- [Integrations Overview param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
