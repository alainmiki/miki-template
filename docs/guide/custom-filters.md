# Custom Filters

Add your own filters to transform values in templates. miki-template's filter API mirrors Django's — filters are simply functions that receive a value and optional argument, and return the transformed value.

## Table of Contents

- [Register a Simple Filter param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Filters with Arguments param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#filters-with-arguments.md' 
- [Multiple Arguments param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#multiple-arguments.md' 
- [Context-Aware Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#context-aware-filters.md' 
- [SafeString Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#safestring-filters.md' 
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Filter Registration Best Practices param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#filter-registration-best-practices.md' 
- [Chaining Custom Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#chaining-custom-filters.md' 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Filters with Arguments param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Multiple Arguments param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#multiple-arguments.md' 
- [Context-Aware Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#context-aware-filters.md' 
- [SafeString Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#safestring-filters.md' 
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Filter Registration Best Practices param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#filter-registration-best-practices.md' 
- [Chaining Custom Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#chaining-custom-filters.md' 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Multiple Arguments param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Context-Aware Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#context-aware-filters.md' 
- [SafeString Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#safestring-filters.md' 
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Filter Registration Best Practices param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#filter-registration-best-practices.md' 
- [Chaining Custom Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#chaining-custom-filters.md' 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Context-Aware Filters param($m) if ($m.Groups[1].Value -notmatch '\.md
- [SafeString Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#safestring-filters.md' 
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Filter Registration Best Practices param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#filter-registration-best-practices.md' 
- [Chaining Custom Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#chaining-custom-filters.md' 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [SafeString Filters param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Filter Registration Best Practices param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#filter-registration-best-practices.md' 
- [Chaining Custom Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#chaining-custom-filters.md' 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Async Filters param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Filter Registration Best Practices param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#filter-registration-best-practices.md' 
- [Chaining Custom Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#chaining-custom-filters.md' 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Filter Registration Best Practices param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Chaining Custom Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#chaining-custom-filters.md' 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Chaining Custom Filters param($m) if ($m.Groups[1].Value -notmatch '\.md

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 

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

- [Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'custom-tags.md.md' 
- [Advanced Usage param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'advanced-usage.md.md' 
- [API Reference: Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/filters.md.md' 
