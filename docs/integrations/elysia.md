# Elysia

Use miki-template with Elysia.

## Setup

```javascript
import { Elysia } from 'elysia';
import miki from 'miki-template';

const app = new Elysia();

app.get('/', async () => {
  const html = await miki.asyncRender('home', {}, { views: './views' });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});

export default app;
```

## Next Steps

- [Integrations Overview](../)
- [API Reference](../api/)
