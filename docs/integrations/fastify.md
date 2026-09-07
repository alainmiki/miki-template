# Fastify

Use miki-template with Fastify by calling `asyncRender()` inline in your route handlers.

## Setup

=== "CommonJS"

    ```javascript
    const fastify = require('fastify')();
    const path = require('path');
    const miki = require('miki-template');

    fastify.get('/', async (request, reply) => {
      const html = await miki.asyncRender(
        'index',
        { user: request.user },
        { views: path.resolve('./views') }
      );
      reply.type('text/html').send(html);
    });

    fastify.listen({ port: 3000 });
    ```

=== "ES Modules"

    ```javascript
    import Fastify from 'fastify';
    import miki from 'miki-template';

    const fastify = Fastify();

    fastify.get('/', async (request, reply) => {
      const html = await miki.asyncRender(
        'index',
        { user: request.user },
        { views: './views' }
      );
      reply.type('text/html').send(html);
    });

    fastify.listen({ port: 3000 });
    ```

## Partial Rendering

=== "CommonJS"

    ```javascript
    fastify.get('/partial/:name', async (request, reply) => {
      const html = await miki.asyncRender(
        `home#${request.params.name}`,
        { user: request.user },
        { views: path.resolve('./views') }
      );
      reply.type('text/html').send(html);
    });
    ```

=== "ES Modules"

    ```javascript
    fastify.get('/partial/:name', async (request, reply) => {
      const html = await miki.asyncRender(
        `home#${request.params.name}`,
        { user: request.user },
        { views: './views' }
      );
      reply.type('text/html').send(html);
    });
    ```

## Next Steps

- [Integrations Overview](../index.md)
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9-]+)\.md
, '../.md' -replace '([a-z][a-z0-9-]+)
, '../.md' 
