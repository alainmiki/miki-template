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

## Related

- [render()](./render)
- [compile()](./compile)
