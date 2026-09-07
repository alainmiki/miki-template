# Partial Templates

Partial templates let you define reusable UI chunks once and render them anywhere. This is especially powerful with HTMX, Turbo, or any AJAX-style partial response pattern.

## Table of Contents

- [Defining Partials param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Rendering Partials by Name param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-partials-by-name.md' 
- [Nested Partials param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#nested-partials.md' 
- [Partials with Context param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#partials-with-context.md' 
- [Partials with Include param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#partials-with-include.md' 
- [Rendering Partials Programmatically param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-partials-programmatically.md' 
- [Express Partial Rendering param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-partial-rendering.md' 
- [Common Pitfalls param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#common-pitfalls.md' 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Rendering Partials by Name param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Nested Partials param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#nested-partials.md' 
- [Partials with Context param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#partials-with-context.md' 
- [Partials with Include param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#partials-with-include.md' 
- [Rendering Partials Programmatically param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-partials-programmatically.md' 
- [Express Partial Rendering param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-partial-rendering.md' 
- [Common Pitfalls param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#common-pitfalls.md' 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Nested Partials param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Partials with Context param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#partials-with-context.md' 
- [Partials with Include param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#partials-with-include.md' 
- [Rendering Partials Programmatically param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-partials-programmatically.md' 
- [Express Partial Rendering param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-partial-rendering.md' 
- [Common Pitfalls param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#common-pitfalls.md' 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Partials with Context param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Partials with Include param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#partials-with-include.md' 
- [Rendering Partials Programmatically param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-partials-programmatically.md' 
- [Express Partial Rendering param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-partial-rendering.md' 
- [Common Pitfalls param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#common-pitfalls.md' 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Partials with Include param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Rendering Partials Programmatically param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-partials-programmatically.md' 
- [Express Partial Rendering param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-partial-rendering.md' 
- [Common Pitfalls param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#common-pitfalls.md' 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Rendering Partials Programmatically param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Express Partial Rendering param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-partial-rendering.md' 
- [Common Pitfalls param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#common-pitfalls.md' 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Express Partial Rendering param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Common Pitfalls param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#common-pitfalls.md' 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Common Pitfalls param($m) if ($m.Groups[1].Value -notmatch '\.md

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#partial-tags.md' 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 

---

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
<!-- Above line ALSO outputs "Hello World!" when rendered -->
```

## Rendering Partials by Name

Once defined, you can render a partial by name from your routes using the `view#partial` syntax:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    miki.setupExpress(app, { extension: 'html', views: './views' });

    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: 'World...', featured: true })
    );
    ```

The syntax is `viewName#partialName`. The engine resolves the file, extracts the named partial, and renders only that block.

**Real-world HTMX example:**

```html
<!-- views/products.html -->
{% partialdef product_card %}
  <div class="product-card" id="product-{{ product.id }}">
    <img src="{{ product.image|static }}" alt="{{ product.name }}">
    <h3>{{ product.name|capfirst }}</h3>
    <p class="price">${{ product.price|floatformat:2 }}</p>
    <button hx-post="/cart/add/{{ product.id }}" hx-swap="outerHTML">
      Add to Cart
    </button>
  </div>
{% endpartialdef %}

{% for product in products %}
  {% partial product_card with product=product %}
{% endfor %}
```

```javascript
// The entire page renders all cards
app.get('/shop', (req, res) =>
  res.render('products', { products: catalog })
);

// HTMX swaps just one card after an action
app.post('/cart/add/:id', (req, res) =>
  res.render('products#product_card', {
    product: catalog.find(p => p.id == req.params.id)
  })
);
```

## Nested Partials

Partials can call other partials:

```html
{% partialdef header %}
  <div class="card-header">
    <h3>{{ title }}</h3>
  </div>
{% endpartialdef %}

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

## Partials with Include

You can include a partial from another template file using the `#partialName` syntax:

```html
{% include "header.html#partial_name" %}
```

This loads `header.html`, registers all its partials, and renders only the named one.

**Real-world navigation include:**

```html
<!-- views/nav.html -->
{% partialdef navigation %}
  <nav>
    {% for link in links %}
      <a href="{{ link.url }}" class="{% if link.active %}current{% endif %}">{{ link.label }}</a>
    {% endfor %}
  </nav>
{% endpartialdef %}
```

```html
<!-- In any template -->
{% include "nav.html#navigation" with links=nav_links %}
```

## Rendering Partials Programmatically

### renderPartialFromSource

Render a named partial from a template source string:

=== "CommonJS"

    ```javascript
    const { renderPartialFromSource } = require('miki-template');

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromSource } from 'miki-template';

    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;
    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });
    ```

### renderPartialFromFile

Render a named partial from a template file:

=== "CommonJS"

    ```javascript
    const { renderPartialFromFile } = require('miki-template');

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

=== "ES Modules"

    ```javascript
    import { renderPartialFromFile } from 'miki-template';

    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });
    ```

### compiled.renderPartial

Render a partial from a compiled template:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile('<h1>{{ title }}</h1>', { views: './templates' });
    const html = compiled.renderPartial('card', { title: 'Hello' });
    ```

### compiled.renderBlock

Render a single block from a compiled template — useful for AJAX responses:

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

## Express Partial Rendering

### res.render with `#partial`

When using `setupExpress()`, you can render partials directly:

=== "CommonJS"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

=== "ES Modules"

    ```javascript
    app.get('/card/:id', (req, res) =>
      res.render(`home#card`, { title: 'Hello', body: '...' })
    );
    ```

### res.renderPartial middleware

If you don't want to patch `res.render`, add the partial renderer middleware instead:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.use(miki.expressPartialRenderer());

    app.get('/card', (req, res) =>
      res.renderPartial('home#card', { user: req.user })
    );
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
| Variable not found | Appears empty | Variables are resolved in the current context; use `with` to pass explicit values. |
| Inline vs non-inline confusion | Duplicate output | Use `inline` only when you want immediate rendering at the declaration site. |
| Partial leaks across includes | Unexpected partials available | `include "file#partial"` isolates partials; `include "file"` (full) makes all partials available. |

## Next Steps

- [Template Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-inheritance.md.md' 
- [Tags: partialdef and partial param($m) if ($m.Groups[1].Value -notmatch '\.md
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [API Reference: renderPartial param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/render-partial.md.md' 
