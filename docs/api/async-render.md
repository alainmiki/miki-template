# asyncRender()

Async version of `render()`. Returns a Promise.

## Signature

```javascript
asyncRender(templateStr, contextObj = {}, options = {})
```

## Returns

`Promise<string>` — The rendered HTML.

## Examples

```javascript
const { asyncRender } = require('miki-template');

const html = await asyncRender('Hello {{ name }}!', { name: 'World' });
```

### With async tags/filters

```javascript
const html = await asyncRender(templateWithAsyncHelpers, context, options);
```

### Async partial from file

```javascript
const html = await asyncRender('home#card', context, { views: './views' });
```

## Related

- [render()](./render)
- [compile()](./compile)
