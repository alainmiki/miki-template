# Custom Filters

Add your own filters to transform values in templates. miki-template's filter API mirrors Django's — filters are simply functions that receive a value and optional argument, and return the transformed value.

## Table of Contents

- [Register a Simple Filter](#register-a-simple-filter)
- [Filters with Arguments](#filters-with-arguments)
- [Multiple Arguments](#multiple-arguments)
- [Context-Aware Filters](#context-aware-filters)
- [SafeString Filters](#safestring-filters)
- [Async Filters](#async-filters)
- [Filter Registration Best Practices](#filter-registration-best-practices)
- [Chaining Custom Filters](#chaining-custom-filters)

---

## Register a Simple Filter

=== "CommonJS"

    ```javascript
    const { registerFilter } = require('miki-template');

    registerFilter('reverse', (val) => {
      return String(val).split('').reverse().join('');
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter } from 'miki-template';

    registerFilter('reverse', (val) => {
      return String(val).split('').reverse().join('');
    });
    ```

Use it in templates:

```html
{{ name|reverse }}
```

## Filters with Arguments

Filters can accept arguments after a colon:

=== "CommonJS"

    ```javascript
    const { registerFilter } = require('miki-template');

    registerFilter('multiply', (val, factor) => {
      return Number(val) * Number(factor);
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter } from 'miki-template';

    registerFilter('multiply', (val, factor) => {
      return Number(val) * Number(factor);
    });
    ```

Usage:

```html
{{ price|multiply:1.2 }}
```

## Multiple Arguments

Pass multiple arguments separated by commas:

=== "CommonJS"

    ```javascript
    const { registerFilter } = require('miki-template');

    registerFilter('format', (val, prefix, suffix) => {
      return `${prefix}${val}${suffix}`;
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter } from 'miki-template';

    registerFilter('format', (val, prefix, suffix) => {
      return `${prefix}${val}${suffix}`;
    });
    ```

Usage:

```html
{{ name|format:"<b>","</b>" }}
<!-- → "<b>Alice</b>" -->
```

### Real-World Example: Dynamic Currency Filter

=== "CommonJS"

    ```javascript
    const { registerFilter, markSafe } = require('miki-template');

    registerFilter('currency_dynamic', (val, code, locale = 'en-US') => {
      const num = Number(val);
      if (isNaN(num)) return '';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code
      }).format(num);
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter } from 'miki-template';

    registerFilter('currency_dynamic', (val, code, locale = 'en-US') => {
      const num = Number(val);
      if (isNaN(num)) return '';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code
      }).format(num);
    });
    ```

Template usage:

```html
<!-- €1,234.56 -->
{{ 1234.5|currency_dynamic:"EUR", "de-DE" }}

<!-- $1,234.56 -->
{{ 1234.5|currency_dynamic:"USD" }}
```

## Context-Aware Filters

Filters receive the rendering `context` as the third argument, enabling context-aware transformations:

=== "CommonJS"

    ```javascript
    const { registerFilter } = require('miki-template');

    registerFilter('currency', (val, symbol, ctx) => {
      const num = Number(val);
      if (isNaN(num)) return '';
      const sym = symbol || ctx.currencySymbol || '$';
      return sym + num.toFixed(2);
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter } from 'miki-template';

    registerFilter('currency', (val, symbol, ctx) => {
      const num = Number(val);
      if (isNaN(num)) return '';
      const sym = symbol || ctx.currencySymbol || '$';
      return sym + num.toFixed(2);
    });
    ```

Usage:

```html
{{ price|currency:"€" }}
<!-- The filter can also read ctx.currencySymbol for a default -->
```

**Real-world locale-aware formatter:**

```javascript
registerFilter('datetime', (val, format, ctx) => {
  const locale = ctx.locale || 'en-US';
  const d = new Date(val);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format === 'short' ? 'short' : 'full',
    timeStyle: format === 'short' ? 'short' : undefined
  }).format(d);
});
```

```html
{{ post.created_at|datetime:"full" }}
```

## SafeString Filters

Filters can return `SafeString` to prevent escaping — useful when generating HTML:

=== "CommonJS"

    ```javascript
    const { registerFilter, markSafe } = require('miki-template');

    registerFilter('badge', (val) => {
      const color = val === 'active' ? 'green' : 'gray';
      return markSafe(`<span class="badge badge-${color}">${val}</span>`);
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, markSafe } from 'miki-template';

    registerFilter('badge', (val) => {
      const color = val === 'active' ? 'green' : 'gray';
      return markSafe(`<span class="badge badge-${color}">${val}</span>`);
    });
    ```

Usage:

```html
{{ user.status|badge }}
```

## Async Filters

Filters can be async by returning a Promise. Use `asyncRender()` to render templates with async filters:

=== "CommonJS"

    ```javascript
    const { registerFilter } = require('miki-template');

    registerFilter('fetch_user', async (val) => {
      const res = await fetch(`https://api.example.com/users/${val}`);
      const data = await res.json();
      return data.display_name;
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter } from 'miki-template';

    registerFilter('fetch_user', async (val) => {
      const res = await fetch(`https://api.example.com/users/${val}`);
      const data = await res.json();
      return data.display_name;
    });
    ```

Usage:

=== "CommonJS (asyncRender)"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Author: {{ user.id|fetch_user }}', { user: { id: 42 } });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Author: {{ user.id|fetch_user }}', { user: { id: 42 } });
    ```

> **Note:** Async filters only work with `asyncRender()` or `compiled.asyncRender()`. Using them with `render()` or `compiled.render()` will throw.

## Filter Registration Best Practices

1. **Handle null/undefined gracefully** — Return empty string or a fallback value.
2. **Return strings** — Filters should generally return string representations for template output.
3. **Don't mutate the input** — Treat values as immutable.
4. **Use `markSafe()` for HTML output** — Prevent auto-escaping when returning HTML.
5. **Validate arguments** — Coerce numeric arguments with `Number()` and handle `NaN`.

## Chaining Custom Filters

Custom filters chain the same way as built-in filters:

```html
{{ text|trim|highlight:"important"|safe }}
```

```javascript
registerFilter('trim', (val) => String(val || '').trim());
registerFilter('highlight', (val, term) => {
  const re = new RegExp(`(${term})`, 'gi');
  return markSafe(String(val).replace(re, '<mark>$1</mark>'));
});
```

## Next Steps

- [Custom Tags](./custom-tags)
- [Advanced Usage](./advanced-usage)
- [API Reference: Filters](../api/filters)
