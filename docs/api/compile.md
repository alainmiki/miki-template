# compile()

Compile a template string into a reusable renderable object.

## Signature

```javascript
compile(templateStr, options = {})
```

## Returns

An object with render methods:

| Method | Description |
|--------|-------------|
| `render(contextObj, callOptions)` | Synchronous render |
| `renderWith(contextObj, callOptions)` | Render with options override |
| `asyncRender(contextObj, callOptions)` | Async render |
| `asyncRenderWith(contextObj, callOptions)` | Async render with options override |
| `renderBlock(blockName, contextObj)` | Render a single block |
| `renderPartial(partialName, contextObj)` | Render a named partial |

## Examples

```javascript
const { compile } = require('miki-template');

const compiled = compile('<h1>{{ title }}</h1>');

const html = compiled.render({ title: 'Hello' });
// Output: <h1>Hello</h1>
```

### Render with options

```javascript
const compiled = compile(template, { views: './templates' });
const html = compiled.renderWith({ title: 'Hello' }, { views: './other-views' });
```

### Render a Block

```javascript
const compiled = compile(childTemplate, { views: './templates' });
const html = compiled.renderBlock('content', context);
```

### Render a Partial

```javascript
const compiled = compile(template, { views: './templates' });
const html = compiled.renderPartial('card', { title: 'Hello' });
```

## Related

- [render()](./render)
- [asyncRender()](./async-render)
