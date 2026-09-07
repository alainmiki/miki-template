# Partial Templates

Partial templates let you define reusable UI chunks once and render them anywhere. This is especially powerful with HTMX, Turbo, or any AJAX-style partial response pattern.

## Defining Partials

Use `{% partialdef %}` to define a named partial inside any template:

```html
<!-- views/home.html -->
{% partialdef card %}
  <div class="card">
    <h3>{{ title|default:"Untitled" }}</h3>
    <p>{{ body|truncatewords:30 }}</p>
    {% if featured %}<em>Featured</em>{% endif %}
  </div>
{% endpartialdef %}

{% for entry in entries %}
  {% partial card with title=entry.title body=entry.body featured=entry.featured %}
{% endfor %}
```

### Inline Partials

A `{% partialdef %}` block renders its body inline where it is defined **and** registers itself for later use:

```html
{% partialdef notice %}
  <div class="alert">{{ message }}</div>
{% endpartialdef %}
```

This means you get immediate output and a reusable partial in one declaration.

Use the `inline` option explicitly:

```html
{% partialdef greeting inline %}
  Hello {{ name }}!
{% endpartialdef %}
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes:

```javascript
app.get('/card/:id', (req, res) =>
  res.render(`home#card`, { title: 'Hello', body: '...', featured: true })
);
```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

## Nested Partials

Partials can call other partials:

```html
{% partialdef card %}
  <div class="card">
    {% partial header with title=title %}
    <p>{{ body }}</p>
  </div>
{% endpartialdef %}
```

## Partials with Context

By default, partials inherit the parent context. Use `with` to pass explicit values:

```html
{% partial card with title="Hello" body="World" %}
```

You can also pass context variables:

```html
{% partial card with title=entry.title body=entry.body %}
```

## Partial with include

You can include a partial from another template file:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

```javascript
const { renderPartialFromSource } = require('miki-template');

const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
```

### renderPartialFromFile

Render a named partial from a template file:

```javascript
const { renderPartialFromFile } = require('miki-template');

const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
```

### compiled.renderPartial

Render a partial from a compiled template:

```javascript
const { compile } = require('miki-template');

const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
const html = compiled.renderPartial('card', { title: 'Hello' });
```

### compiled.renderBlock

Render a single block from a compiled template:

```javascript
const compiled = compile(childTemplate, { views: './templates' });
const html = compiled.renderBlock('content', context);
```

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

```javascript
app.get('/card/:id', (req, res) =>
  res.render(`home#card`, { title: 'Hello', body: '...' })
);
```

### res.renderPartial middleware

Add the partial renderer middleware:

```javascript
app.use(miki.expressPartialRenderer());

app.get('/card', (req, res) => res.renderPartial('home#card', { user: req.user }));
```

## Partial API Reference

### renderPartialFromSource(fileContent, partialName, contextObj, options, filePath?)

Render a named partial from a template source string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `fileContent` | `string` | Template source string |
| `partialName` | `string` | Name of the partial to render |
| `contextObj` | `object` | Variables to inject |
| `options` | `object` | Options |
| `filePath` | `string?` | Optional file path for error messages |

### renderPartialFromFile(fileName, partialName, contextObj, options)

Render a named partial from a template file.

| Parameter | Type | Description |
|-----------|------|-------------|
| `fileName` | `string` | Template file name (without extension) |
| `partialName` | `string` | Name of the partial to render |
| `contextObj` | `object` | Variables to inject |
| `options` | `object` | Options including `views` directories |

## Common Pitfalls

| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing partial name | `{% partial %}` renders nothing | Ensure the name matches a defined `partialdef`. |
| Variable not found | Appears empty | Variables are resolved in the current context; use `{% with %}` inside the partial if you need a local alias. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering. |

## Next Steps

- [Template Inheritance](./template-inheritance)
- [API Reference: renderPartial](../api/render-partial)
