# Async Rendering

Use `asyncRender()` when your templates contain async helpers or when you need Promise-based rendering.

## Basic Usage

```javascript
const { asyncRender } = require('miki-template');

const html = await asyncRender('Hello {{ name }}!', { name: 'World' });
```

## Async Tags and Filters

You can register async tags and filters:

```javascript
const { registerTag } = require('miki-template');

registerTag('fetch', async (tagContent, parser) => {
  const url = tagContent.trim();
  const res = await fetch(url);
  const data = await res.json();
  return {
    render: (context) => JSON.stringify(data)
  };
});
```

## Express Async Support

Use `__expressAsync` for Express 5+ or async-aware apps:

```javascript
const { __expressAsync, setupExpress } = require('miki-template');

app.engine('html', __expressAsync);
// or
miki.setupExpress(app, { extension: 'html', views: './views', async: true });
```

## Concurrency

`asyncRender()` is fully concurrent-safe. You can run thousands of parallel renders:

```javascript
const promises = Array.from({ length: 1000 }, () =>
  asyncRender(template, data)
);

const results = await Promise.all(promises);
```

## Next Steps

- [Custom Tags](./custom-tags)
- [API Reference: asyncRender](../api/async-render)
