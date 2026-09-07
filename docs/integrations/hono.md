# Hono

Use miki-template with Hono.

## Setup

```javascript
import { Hono } from 'hono';
import miki from 'miki-template';

const app = new Hono();

app.get('/', async (c) => {
  const html = await miki.asyncRender('index', { user: c.get('user') }, { views: './views' });
  return c.html(html);
});

export default app;
```

## CommonJS

```javascript
const { Hono } = require('hono');
const miki = require('miki-template');

const app = new Hono();

app.get('/', async (c) => {
  const html = await miki.asyncRender('index', { user: c.get('user') }, { views: './views' });
  return c.html(html);
});

export default app;
```

## Partial Rendering

```javascript
app.get('/partial/:name', async (c) => {
  const html = await miki.asyncRender(`home#${c.req.param('name')}`, { user: c.get('user') }, { views: './views' });
  return c.html(html);
});
```

## Next Steps

- [Integrations Overview](../)
- [API Reference: asyncRender](../api/async-render)
