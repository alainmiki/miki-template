# Custom Filters

Add your own filters to transform values in templates.

## Register a Filter

```javascript
const { registerFilter } = require('miki-template');

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

```javascript
registerFilter('multiply', (val, factor) => {
  return Number(val) * Number(factor);
});
```

Usage:

```html
{{ price|multiply:1.2 }}
```

### Multiple arguments

```javascript
registerFilter('format', (val, prefix, suffix) => {
  return `${prefix}${val}${suffix}`;
});
```

Usage:

```html
{{ name|format:"<b>","</b>" }}
```

## Context-Aware Filters

Filters receive the context as the third argument, enabling context-aware transformations:

```javascript
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
```

## SafeString Filters

Filters can return SafeString to prevent escaping:

```javascript
const { markSafe } = require('miki-template');

registerFilter('bold', (val) => {
  return markSafe(`<b>${val}</b>`);
});
```

## Async Filters

Filters can be async by returning a Promise:

```javascript
registerFilter('fetch', async (val) => {
  const res = await fetch(val);
  const data = await res.json();
  return data.result;
});
```

## Filter Registration Best Practices

1. **Handle null/undefined gracefully** - Return empty string or fallback.
2. **Return strings** - Filters should return string representations.
3. **Don't mutate the input** - Treat values as immutable.
4. **Use `markSafe()` for HTML output** - Prevent auto-escaping.

## Chaining

Filters are evaluated left to right:

```html
{{ title|lower|truncatewords:5|capfirst }}
```

## Next Steps

- [Custom Tags](./custom-tags)
- [Advanced Usage](./advanced-usage)
