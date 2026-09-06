# Fastify

Use miki-template with Fastify via the Fastify adapter.

## Setup

```javascript
const fastify = require('fastify')();
const { __express } = require('miki-template');

fastify.get('/', async (request, reply) => {
  const html = __express(path.join(__dirname, 'views', 'home.html'), {
    user: request.user
  });
  return html;
});

fastify.listen({ port: 3000 });
```

## Next Steps

- [Integrations Overview](../)
- [API Reference](../api/)
