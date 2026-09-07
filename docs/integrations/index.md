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

## Notes

- For CommonJS: `const miki = require('miki-template');`
- For ESM / Bun: `import miki from 'miki-template';` or `import * as miki from 'miki-template';`
- When rendering files, pass `options.views` or set framework view roots so the engine can locate templates.

## Setup (install)

```bash
# npm
npm install miki-template

# bun
bun add miki-template
```

## Next Steps

- [Express Integration](./express)
- [Performance](./../performance)
