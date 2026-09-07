# asyncRender()

Async version of `render()`. Returns a Promise. Use this when your templates contain async filters, async custom tags, or async library components.

## Signature

```javascript
asyncRender(templateStr, contextObj = {}, options = {})
```

## Returns

`Promise<string>` — The rendered HTML.

## When to Use

Use `asyncRender()` when your templates contain:

- Async filters (returning Promises)
- Async custom tags (render return a Promise)
- Async library helpers
- `{% load %}` libraries with async components

Using async features with `render()` throws: `Async node encountered during sync render. Use asyncRender() instead.`

## Examples

### Basic async render

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello {{ name }}!', { name: 'World' });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello {{ name }}!', { name: 'World' });
    ```

### With async tags/filters

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender(templateWithAsyncHelpers, context, options);
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender(templateWithAsyncHelpers, context, options);
    ```

### Async partial from file

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('home#card', context, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', context, { views: './views' });
    ```

## Related

- [render() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'render.md.md' 
- [compile() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'compile.md.md' 
