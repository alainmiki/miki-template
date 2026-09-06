# Koa

Use miki-template with Koa via the Koa adapter.

## Setup

```javascript
const Koa = require('koa');
const { __express } = require('miki-template');

const app = new Koa();

app.use(async (ctx, next) => {
  if (ctx.path === '/') {
    const html = __express(path.join(__dirname, 'views', 'home.html'), {
      user: ctx.state.user
    });
    ctx.body = html;
  }
  await next();
});

app.listen(3000);
```

## Next Steps

- [Integrations Overview](../)
- [API Reference](../api/)
