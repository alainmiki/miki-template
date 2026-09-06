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

## Chaining

Filters are evaluated left to right:

```html
{{ title|lower|truncatewords:5|capfirst }}
```

## Next Steps

- [Custom Tags](./custom-tags)
- [Advanced Usage](./advanced-usage)
