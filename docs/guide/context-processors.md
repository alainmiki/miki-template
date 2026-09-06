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

## Clear Processors

```javascript
const { clearContextProcessors } = require('miki-template');

clearContextProcessors();
```

## Use Cases

- Injecting globals like `siteName`, `currentYear`, or `user`.
- Adding CSRF tokens or CSP nonces automatically.
- Injecting feature flags or configuration.

## Next Steps

- [Custom Tags](./custom-tags)
- [Async Rendering](./async-rendering)
