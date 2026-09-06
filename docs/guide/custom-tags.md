# Custom Tags

Extend miki-template with your own tags. Tags are parsed at compile time and rendered at runtime.

## Register a Tag

```javascript
const { registerTag } = require('miki-template');

registerTag('hello', (tagContent, parser) => {
  return {
    render: (context) => 'Hello World!'
  };
});
```

Use it in templates:

```html
{% hello %}
```

## Block Tags

Tags can consume block content using `parseBody()`:

```javascript
const { registerTag } = require('miki-template');

registerTag('mytag', (tagContent, parser) => {
  const body = parser.parseBody('endmytag');
  return {
    render: (context) => {
      const inner = body.map(node => node.render(context)).join('');
      return `<div>${inner}</div>`;
    }
  };
});
```

Usage:

```html
{% mytag %}
  <p>This is inside the block</p>
{% endmytag %}
```

## Context Access

Tags receive a `context` object with all template variables:

```javascript
registerTag('show', (tagContent, parser) => {
  return {
    render: (context) => {
      const user = context.get('user');
      return `<span>${user.name}</span>`;
    }
  };
});
```

## Next Steps

- [Custom Filters](./custom-filters)
- [Advanced Usage](./advanced-usage)
