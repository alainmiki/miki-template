# Context Processors API

## registerContextProcessor

Register a context processor function.

```javascript
const { registerContextProcessor } = require('miki-template');

registerContextProcessor((context) => {
  return {
    siteName: 'My App',
    currentYear: new Date().getFullYear()
  };
});
```

## clearContextProcessors

Clear all registered context processors.

```javascript
const { clearContextProcessors } = require('miki-template');

clearContextProcessors();
```

## Next Steps

- [Context Processors Guide](../guide/context-processors)
- [API Reference](../)
