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
| `options` | `object` | Options including `views` directories and custom settings |

## Returns

`string` — The rendered HTML.

## Examples

### Render a template string

=== "CommonJS"

    ```javascript
    const { render } = require('miki-template');

    const html = render('Hello {{ name }}!', { name: 'World' });
    // Output: Hello World!
    ```

=== "ES Modules"

    ```javascript
    import { render } from 'miki-template';

    const html = render('Hello {{ name }}!', { name: 'World' });
    // Output: Hello World!
    ```

### Render a partial from file

=== "CommonJS"

    ```javascript
    const { render } = require('miki-template');

    const html = render('home#card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { render } from 'miki-template';

    const html = render('home#card', { title: 'Hello' }, { views: './views' });
    ```

### Render with options

=== "CommonJS"

    ```javascript
    const { render } = require('miki-template');

    const html = render(template, context, {
      views: ['./views', './app/templates'],
      staticUrl: '/static',
      urlHelper: (name, ...args) => '/' + name + '/' + args.join('/')
    });
    ```

=== "ES Modules"

    ```javascript
    import { render } from 'miki-template';

    const html = render(template, context, {
      views: ['./views', './app/templates'],
      staticUrl: '/static',
      urlHelper: (name, ...args) => '/' + name + '/' + args.join('/')
    });
    ```

## Related

- [compile() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'compile.md.md' 
- [asyncRender() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'async-render.md.md' 
