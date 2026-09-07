# Cache API

## clearCache

Clear the compiled template cache.

```javascript
const { clearCache } = require('miki-template');

clearCache();
```

## How Caching Works

- Templates are cached by source string and compile options.
- The cache is an in-memory LRU cache limited to 100 entries.
- Cached templates are reused across renders, improving performance.

## When to Clear Cache

- During development when templates change frequently.
- In tests to ensure fresh compilation.
- When dynamically registering custom tags/filters at runtime.

## Next Steps

- [Advanced Usage: Caching](../guide/advanced-usage#caching)
- [API Reference](../)
