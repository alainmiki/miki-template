# Custom Tags

Extend miki-template with your own tags. Tags are parsed at compile time and rendered at runtime.

## Register a Simple Tag

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

Tags can consume block content using `parser.parse()`:

```javascript
const { registerTag } = require('miki-template');

registerTag('mytag', (tagContent, parser) => {
  const body = parser.parse(['endmytag']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endmytag') {
    parser.advance();
  }
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

### Context API

| Method | Description |
|--------|-------------|
| `context.get('var')` | Get a variable value |
| `context.push(scope)` | Push a new scope onto the stack |
| `context.pop()` | Pop the top scope |
| `context.registerPartial(name, node)` | Register a partial definition |
| `context.getPartial(name)` | Get a registered partial |

## Tag Parser Arguments

The tag parser function receives:

| Argument | Type | Description |
|----------|------|-------------|
| `tagContent` | `string` | The full tag content, e.g. `"url 'route.name' arg1 arg2"` |
| `parser` | `object` | The parser instance with `parse()`, `peek()`, `advance()`, `blocks` |

### parser API

| Method | Description |
|--------|-------------|
| `parser.parse(untilTags)` | Parse until one of the untilTags is found |
| `parser.peek()` | Peek at the next token |
| `parser.advance()` | Advance to the next token |
| `parser.blocks` | Object tracking block stacks for inheritance |

## Async Tags

Tags can return Promises for async rendering:

```javascript
registerTag('fetch', async (tagContent, parser) => {
  const url = tagContent.trim();
  const res = await fetch(url);
  const data = await res.json();
  return {
    render: (context) => JSON.stringify(data)
  };
});
```

## Tag with Arguments

Tags can accept arguments:

```javascript
registerTag('repeat', (tagContent, parser) => {
  const parts = tagContent.trim().split(/\s+/);
  const text = parts[0] || '';
  const count = parseInt(parts[1], 10) || 1;
  return {
    render: (context) => text.repeat(count)
  };
});
```

Usage:

```html
{% repeat "Hello " 3 %}
```

## Tag Registration Best Practices

1. **Always return an object with a `render` method** - The render method receives a `context` and must return a string or Promise.
2. **Handle errors gracefully** - Throw descriptive errors for invalid usage.
3. **Don't modify the parser state** unless necessary - Let the engine manage parsing.
4. **Use `context.get()` for variable lookup** - Never access `context.scopes` directly.

## Next Steps

- [Custom Filters](./custom-filters)
- [Advanced Usage](./advanced-usage)
