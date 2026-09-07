# Fastify

Use miki-template with Fastify via the Fastify adapter.

## Setup

```javascript
const fastify = require('fastify')();
const path = require('path');
const miki = require('miki-template');

fastify.get('/', async (request, reply) => {
  const html = await miki.asyncRender('index', { user: request.user }, { views: path.resolve('./views') });
  reply.type('text/html').send(html);
});

fastify.listen({ port: 3000 });
```

## CommonJS

```javascript
const fastify = require('fastify')();
const path = require('path');
const miki = require('miki-template');

fastify.get('/', async (request, reply) => {
  const html = await miki.asyncRender('index', { user: request.user }, { views: path.resolve('./views') });
  reply.type('text/html').send(html);
});

fastify.listen({ port: 3000 });
```

## Partial Rendering

```javascript
fastify.get('/partial/:name', async (request, reply) => {
  const html = await miki.asyncRender(`home#${request.params.name}`, { user: request.user }, { views: path.resolve('./views') });
  reply.type('text/html').send(html);
});
```

## Next Steps

- [Integrations Overview](../)
- [API Reference: asyncRender](../api/async-render)
