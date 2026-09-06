# render()

Render a template string or file partial.

## Signature

```javascript
render(templateStr, contextObj = {}, options = {})
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `templateStr` | `string` | Template string or file path with `#partial` suffix |
| `contextObj` | `object` | Variables to inject into the template |
| `options` | `object` | Options including `views` directories |

## Returns

`string` — The rendered HTML.

## Examples

### Render a template string

```javascript
const { render } = require('miki-template');

const html = render('Hello {{ name }}!', { name: 'World' });
// Output: Hello World!
```

### Render a partial from file

```javascript
const html = render('home#card', { title: 'Hello' }, { views: './views' });
```

## Related

- [compile()](./compile)
- [asyncRender()](./async-render)
