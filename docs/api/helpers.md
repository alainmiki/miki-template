# Helpers API

## registerHelper

Register a helper function that can be called from templates.

```javascript
const { registerHelper } = require('miki-template');

registerHelper('bold', (inner, context) => `<b>${inner}</b>`);
```

Usage in templates:

```html
{% bold %}Hello World{% endbold %}
<!-- Output: <b>Hello World</b> -->
```

## Built-in Helpers

miki-template includes built-in helpers for common tasks:

- `bold` - Wrap content in `<b>` tags
- `italic` - Wrap content in `<i>` tags
- `underline` - Wrap content in `<u>` tags

## Next Steps

- [API Reference](../)
- [Custom Tags](../guide/custom-tags)
