# compile()

Compile a template string into a reusable renderable object.

## Signature

```javascript
compile(templateStr, options = {})
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `templateStr` | `string` | Template source string |
| `options` | `object` | Options including `views` directories |

## Returns

An object with these render methods:

| Method | Description |
|--------|-------------|
| `render(contextObj, callOptions)` | Synchronous render |
| `renderWith(contextObj, callOptions)` | Render with options override |
| `asyncRender(contextObj)` | Asynchronous render (supports async filters/tags) |
| `asyncRenderWith(contextObj, callOptions)` | Async render with options override |
| `renderBlock(blockName, contextObj)` | Render a single `{% block %}` |
| `renderPartial(partialName, contextObj)` | Render a named `{% partialdef %}` |

## Examples

### Basic compile

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>');

    const html = compiled.render({ title: 'Hello' });
    // Output: <h1>Hello</h1>
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>');

    const html = compiled.render({ title: 'Hello' });
    // Output: <h1>Hello</h1>
    ```

### Render with options override

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './templates' });
    const html = compiled.renderWith({ title: 'Hello' }, { views: './other-views' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './templates' });
    const html = compiled.renderWith({ title: 'Hello' }, { views: './other-views' });
    ```

### Render a Block (template inheritance)

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplate, { views: './templates' });
    const html = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplate, { views: './templates' });
    const html = compiled.renderBlock('content', context);
    ```

### Render a Partial

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(`
      {% partialdef card %}
        <div class="card">{{ title }}</div>
      {% endpartialdef %}
    `);
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(`
      {% partialdef card %}
        <div class="card">{{ title }}</div>
      {% endpartialdef %}
    `);
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

## Related

- [render() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'render.md.md' 
- [asyncRender() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'async-render.md.md' 
