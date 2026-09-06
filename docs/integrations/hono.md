# Hono

Use miki-template with Hono.

## Setup

```javascript
import { Hono } from 'hono';
import miki from 'miki-template';

const app = new Hono();

app.get('/', async (c) => {
  const html = await miki.asyncRender('home', {}, { views: './views' });
  return c.html(html);
});

export default app;
```

## Next Steps

- [Integrations Overview](../)
- [API Reference](../api/)
