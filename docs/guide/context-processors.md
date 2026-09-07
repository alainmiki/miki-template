# Context Processors

Context processors inject variables into every render automatically, similar to Django's context processors.

## Register a Context Processor

```javascript
const { registerContextProcessor } = require('miki-template');

registerContextProcessor((context) => {
  return {
    siteName: 'My App',
    currentYear: new Date().getFullYear()
  };
});
```

Every template now has access to `siteName` and `currentYear` without explicitly passing them.

### Multiple Processors

You can register multiple processors. They run in order, and later processors can override earlier ones:

```javascript
registerContextProcessor((ctx) => ({ a: 1 }));
registerContextProcessor((ctx) => ({ b: 2 }));
// Result: { a: 1, b: 2 }
```

### Conditional Injection

Processors can conditionally inject variables:

```javascript
registerContextProcessor((ctx) => {
  if (ctx.user && ctx.user.isAdmin) {
    return { showAdminPanel: true };
  }
  return {};
});
```

## Clear Processors

```javascript
const { clearContextProcessors } = require('miki-template');

clearContextProcessors();
```

## How It Works

1. When `render()` or `compile().render()` is called, all registered processors run.
2. Each processor receives the context object and may return key/value pairs.
3. Keys that are already defined in the context are **not** overwritten (Django semantics).
4. The final context is used for rendering.

## Use Cases

- Injecting globals like `siteName`, `currentYear`, or `user`.
- Adding CSRF tokens or CSP nonces automatically.
- Injecting feature flags or configuration.
- Adding request-specific data (with Express middleware).

## Express Integration

Context processors work seamlessly with Express:

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

miki.setupExpress(app, { extension: 'html', views: './views' });

app.get('/', (req, res) => {
  // user is automatically available via context processor or res.locals
  res.render('home');
});
```

## Context Processor vs res.locals

- `res.locals` is Express-specific and persists across requests in the same response.
- Context processors are engine-level and work outside Express.
- Both can be used together.

## Next Steps

- [Custom Tags](./custom-tags)
- [Async Rendering](./async-rendering)
