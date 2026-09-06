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

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes:

```javascript
app.get('/card/:id', (req, res) =>
  res.render(`home#card`, { title: 'Hello', body: '...', featured: true })
);
```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

## Inline Partials

A `{% partialdef %}` block renders its body inline where it is defined **and** registers itself for later use:

```html
{% partialdef notice %}
  <div class="alert">{{ message }}</div>
{% endpartialdef %}
```

This means you get immediate output and a reusable partial in one declaration.

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

## API

### renderPartialFromSource

```javascript
const { renderPartialFromSource } = require('miki-template');

const html = renderPartialFromSource(source, 'partialName', context);
```

### compiled.renderBlock

```javascript
const compiled = compile(templateString, { views: './templates' });
const html = compiled.renderBlock('blockName', context);
```

## Next Steps

- [Template Inheritance](./template-inheritance)
- [API Reference: renderPartial](../api/render-partial)
