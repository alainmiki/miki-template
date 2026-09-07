# Elysia

Use miki-template with Elysia.

## Setup

```javascript
import { Elysia } from 'elysia';
import miki from 'miki-template';

const app = new Elysia();

app.get('/', async () => {
  const html = await miki.asyncRender('index', {}, { views: './views' });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});

export default app;
```

## CommonJS

```javascript
const { Elysia } = require('elysia');
const miki = require('miki-template');

const app = new Elysia();

app.get('/', async () => {
  const html = await miki.asyncRender('index', {}, { views: './views' });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});

export default app;
```

## Partial Rendering

```javascript
app.get('/partial/:name', async (params) => {
  const html = await miki.asyncRender(`home#${params.name}`, {}, { views: './views' });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});
```

## Next Steps

- [Integrations Overview](../)
- [API Reference: asyncRender](../api/async-render)
