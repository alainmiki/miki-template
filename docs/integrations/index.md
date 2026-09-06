# Integrations

miki-template works with all major Node.js web frameworks.

## Supported Frameworks

- [Express](./express)
- [Koa](./koa)
- [Fastify](./fastify)
- [Hono](./hono)
- [Elysia](./elysia)

## Quick Example

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });

app.get('/', (req, res) => res.render('home', { user: req.user }));

app.listen(3000);
```

## Next Steps

- [Express Integration](./express)
- [Performance](./../performance)
