# Helpers API

## registerHelper

Register a helper function that can be called from templates.

=== "CommonJS"

    ```javascript
    const { registerHelper } = require('miki-template');

    registerHelper('bold', (inner, context) => `<b>${inner}</b>`);
    ```

=== "ES Modules"

    ```javascript
    import { registerHelper } from 'miki-template';

    registerHelper('bold', (inner, context) => `<b>${inner}</b>`);
    ```

### Helper Signature

Helpers receive `(content, context)` where `content` is the rendered inner content of the tag:

```javascript
registerHelper('panel', (content, context) => {
  return `<div class="panel">${content}</div>`;
});
```

Usage in templates:

```html
{% panel %}
  <h2>{{ title }}</h2>
  <p>{{ description }}</p>
{% endpanel %}
```

## Built-in Helpers

miki-template includes built-in helpers for common formatting tasks:

- `bold` — Wrap content in `<b>` tags
- `italic` — Wrap content in `<i>` tags
- `underline` — Wrap content in `<u>` tags

## Next Steps

- [Custom Tags](../guide/custom-tags)
- [API Reference](../)
