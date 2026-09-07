# Custom Tags

Create your own template tags by registering a parser function. miki-template's tag API mirrors Django's — a tag is a parser that returns a Node object with a `render(context)` method.

## Table of Contents

- [Register a Simple Tag](#register-a-simple-tag)
- [Async Custom Tags](#async-custom-tags)
- [Parsing Complex Tags](#parsing-complex-tags)
- [Accessing the Parser](#accessing-the-parser)
- [Tag Registration Best Practices](#tag-registration-best-practices)

---

## Register a Simple Tag

=== "CommonJS"

    ```javascript
    const { registerTag } = require('miki-template');

    registerTag('hello', (tagContent, parser) => {
      return {
        render: (context) => 'Hello World!'
      };
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerTag } from 'miki-template';

    registerTag('hello', (tagContent, parser) => {
      return {
        render: (context) => 'Hello World!'
      };
    });
    ```

Usage in templates:

```html
{% hello %}
```

### Passing Arguments

```javascript
registerTag('greet', (tagContent, parser) => {
  // tagContent is the full text after the tag name: "user.name"
  const varName = tagContent.trim();
  return {
    render: (context) => {
      const value = context.get(varName);
      return `Hello, ${value}!`;
    }
  };
});
```

```html
{% greet user.name %}
```

## Returning a Node Class

For more complex tags, return a Node class instance:

=== "CommonJS"

    ```javascript
    const { registerTag } = require('miki-template');

    class GreetNode {
      constructor(varName) {
        this.varName = varName;
      }
      render(context) {
        const value = context.get(this.varName);
        return `Hello, ${value || 'Guest'}!`;
      }
    }

    registerTag('greet', (tagContent, parser) => {
      const varName = tagContent.trim();
      return new GreetNode(varName);
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerTag } from 'miki-template';

    class GreetNode {
      constructor(varName) {
        this.varName = varName;
      }
      render(context) {
        const value = context.get(this.varName);
        return `Hello, ${value || 'Guest'}!`;
      }
    }

    registerTag('greet', (tagContent, parser) => {
      const varName = tagContent.trim();
      return new GreetNode(varName);
    });
    ```

## Async Custom Tags

If your `render()` method returns a Promise, the template must be rendered with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('fetch_greeting', (tagContent, parser) => {
      const urlVar = tagContent.trim();
      return {
        async render(context) {
          const url = context.get(urlVar);
          const res = await fetch(url);
          const data = await res.json();
          return data.message;
        }
      };
    });

    // Must use asyncRender
    const html = await asyncRender('{% fetch_greeting api_url %}', { api_url: 'https://...' });
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('fetch_greeting', (tagContent, parser) => {
      const urlVar = tagContent.trim();
      return {
        async render(context) {
          const url = context.get(urlVar);
          const res = await fetch(url);
          const data = await res.json();
          return data.message;
        }
      };
    });

    const html = await asyncRender('{% fetch_greeting api_url %}', { api_url: 'https://...' });
    ```

## Parsing Complex Tags

Use the `parser` object to consume tokens and build multi-part tags:

=== "CommonJS"

    ```javascript
    const { registerTag } = require('miki-template');

    registerTag('panel', (tagContent, parser) => {
      const classes = tagContent.trim() || '';
      const nodelist = parser.parse(['endpanel']);
      parser.skipTag(); // consume endpanel

      return {
        render: (context) => {
          const body = nodelist.map(n => n.render(context)).join('');
          return `<div class="panel ${classes}">${body}</div>`;
        }
      };
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerTag } from 'miki-template';

    registerTag('panel', (tagContent, parser) => {
      const classes = tagContent.trim() || '';
      const nodelist = parser.parse(['endpanel']);
      parser.skipTag();

      return {
        render: (context) => {
          const body = nodelist.map(n => n.render(context)).join('');
          return `<div class="panel ${classes}">${body}</div>`;
        }
      };
    });
    ```

Usage with nested content:

```html
{% panel "card" %}
  <h2>{{ title }}</h2>
  <p>{{ description }}</p>
{% endpanel %}
```

### Real-World Example: Cache Tag

=== "CommonJS"

    ```javascript
    const { registerTag } = require('miki-template');

    registerTag('cache_block', (tagContent, parser) => {
      const [key, ...rest] = tagContent.trim().split(/\s+/);
      const nodelist = parser.parse(['endcache_block']);
      parser.skipTag();

      return {
        render: (context) => {
          const cacheKey = key;
          const cache = context.get('cache') || global.__cache__;
          if (!cache) return nodelist.map(n => n.render(context)).join('');
          if (cache.has(cacheKey)) return cache.get(cacheKey);
          const output = nodelist.map(n => n.render(context)).join('');
          cache.set(cacheKey, output, rest[0] || 300);
          return output;
        }
      };
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerTag } from 'miki-template';

    registerTag('cache_block', (tagContent, parser) => {
      const [key, ...rest] = tagContent.trim().split(/\s+/);
      const nodelist = parser.parse(['endcache_block']);
      parser.skipTag();

      return {
        render: (context) => {
          const cacheKey = key;
          const cache = context.get('cache') || global.__cache__;
          if (!cache) return nodelist.map(n => n.render(context)).join('');
          if (cache.has(cacheKey)) return cache.get(cacheKey);
          const output = nodelist.map(n => n.render(context)).join('');
          cache.set(cacheKey, output, rest[0] || 300);
          return output;
        }
      };
    });
    ```

## Tag Registration Best Practices

1. **Return objects with `render(context)`** — the render signature must accept a context object.
2. **Use `parser.parse([...terminators])`** for tags with bodies — this lets the parser consume nested content correctly.
3. **Always call `parser.skipTag()`** after `parser.parse` to consume the end tag.
4. **Handle whitespace** — `tagContent.trim()` for single-argument tags.
5. **Async tags need asyncRender** — return a Promise from `render()` and use `asyncRender()` to render.
6. **Access context values** — use `context.get('key')` or `context.resolve('expr')`.

## Next Steps

- [Built-in Tags Reference](../api/tags)
- [Custom Filters](./custom-filters)
- [Guide: Tags](./tags)
