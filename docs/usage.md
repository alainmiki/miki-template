# Usage Guide

This guide covers all usage patterns for **miki-template**, from basic variable rendering to advanced Express integration.

---

## Quick Reference

### One-off Rendering

**CommonJS:**
```javascript
const { render } = require('miki-template');

const output = render('Hello {{ name }}!', { name: 'World' });
// → "Hello World!"
```

**ESM:**
```javascript
import { render } from 'miki-template';

const output = render('Hello {{ name }}!', { name: 'World' });
// → "Hello World!"
```

### Compiled Templates (recommended for repeated use)

**CommonJS:**
```javascript
const { compile } = require('miki-template');

const template = compile('Welcome, {{ user.name }}!');

// Render 1
console.log(template.render({ user: { name: 'Alice' } }));
// → "Welcome, Alice!"

// Render 2
console.log(template.render({ user: { name: 'Bob' } }));
// → "Welcome, Bob!"
```

**ESM:**
```javascript
import { compile } from 'miki-template';

const template = compile('Welcome, {{ user.name }}!');

console.log(template.render({ user: { name: 'Alice' } }));
// → "Welcome, Alice!"

console.log(template.render({ user: { name: 'Bob' } }));
// → "Welcome, Bob!"
```

---

## Variables and Lookups

### Basic Variables

```html
<p>Hello, {{ name }}!</p>
```

### Dotted Lookups (nested properties)

```html
<p>{{ user.profile.displayName }}</p>
<p>{{ config.site.title }}</p>
```

### Array Indexing

```html
<p>First item: {{ items.0 }}</p>
<p>Third item: {{ items.2 }}</p>
```

### Function Call

If a resolved value is a function, it is called automatically with zero arguments:

```javascript
// Context: { user: { getName: () => 'Miki' } }
{{ user.getName }}  // → "Miki"
```

---

## Filters

Filters transform variable output. Apply them with the pipe `|` character:

```html
{{ name|upper }}                    → "MIKI"
{{ title|slugify }}                  → "hello-world"
{{ text|truncatewords:20 }}          → truncated to 20 words
{{ date|date:"Y-m-d" }}             → "2026-08-31"
{{ user.name|default:"Anonymous" }}  → "Miki" or "Anonymous"
```

### Filter Chaining

Filters apply left-to-right:

```html
{{ name|lower|capfirst }}            → "miki" → "Miki"
{{ bio|striptags|truncatewords:50 }} → strip HTML, then truncate
{{ price|floatformat:2|add:10 }}     → format, then add 10
```

### Filter Arguments

Most filters accept optional arguments after a colon:

```html
{{ items|join:", " }}               → "a, b, c"
{{ text|truncatewords:10 }}         → 10 words max
{{ date|date:"F j, Y" }}           → "August 31, 2026"
{{ value|default:"N/A" }}          → fallback if falsy
```

---

## Control Flow Tags

### `{% if %} / {% elif %} / {% else %} / {% endif %}`

```html
{% if user.is_active %}
  <p>Welcome back!</p>
{% elif user.is_pending %}
  <p>Please verify your email.</p>
{% else %}
  <p>Contact support.</p>
{% endif %}
```

Supported operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `not`, `in`, `not in`

```html
{% if user.role == 'admin' or user.is_staff %}
  <a href="/admin">Admin Panel</a>
{% endif %}

{% if item in cart_items %}
  <span>In cart</span>
{% endif %}

{% if not user.is_banned %}
  <p>You may post.</p>
{% endif %}
```

### `{% for %} / {% empty %} / {% endfor %}`

Loop over arrays:

```html
<ul>
  {% for item in items %}
    <li>{{ item }}</li>
  {% empty %}
    <li>No items found.</li>
  {% endfor %}
</ul>
```

Loop with unpacking (arrays):

```html
{% for name, index in items %}
  {{ forloop.counter }}. {{ name }}
{% endfor %}
```

Loop over objects (key, value):

```html
{% for key, value in config %}
  <tr>
    <td>{{ key }}</td>
    <td>{{ value }}</td>
  </tr>
{% endfor %}
```

Loop metadata (`forloop`):

```html
{% for item in items %}
  {% if forloop.first %}<ul>{% endif %}
  <li>{% if forloop.last %}last!{% else %}{{ item }}{% endif %}</li>
  {% if forloop.last %}</ul>{% endif %}
{% endfor %}
```

Available `forloop` properties:
| Property | Description |
|----------|-------------|
| `forloop.counter` | 1-indexed position |
| `forloop.counter0` | 0-indexed position |
| `forloop.revcounter` | Countdown from end (1-indexed) |
| `forloop.revcounter0` | Countdown from end (0-indexed) |
| `forloop.first` | `true` on first iteration |
| `forloop.last` | `true` on last iteration |
| `forloop.parentloop` | Reference to parent loop's metadata |

Nested loops:

```html
{% for group in groups %}
  {% for item in group.items %}
    {{ forloop.parentloop.counter }}.{{ forloop.counter }}: {{ item }}
  {% endfor %}
{% endfor %}
```

### `{% with %} / {% endwith %}`

Create scoped aliases:

```html
{% with user.profile.address as addr %}
  <p>{{ addr.city }}, {{ addr.country }}</p>
{% endwith %}

{% with a=x b=y c=z %}
  {{ a }} + {{ b }} + {{ c }}
{% endwith %}
```

### `{% cycle %}`

Cycle through values on each iteration:

```html
{% for row in rows %}
  <tr class="{% cycle 'row-even' 'row-odd' %}">
    <td>{{ row.name }}</td>
  </tr>
{% endfor %}
```

Cycle with named state:

```html
{% for item in items %}
  {% cycle 'row1' 'row2' as row_class %}
  <tr class="{{ row_class }}">{{ item }}</tr>
{% endfor %}
```

### `{% firstof %}`

Return the first truthy value:

```html
{% firstof user.display_name user.username "Guest" %}
<!-- Returns first non-falsy value -->
```

---

## Template Inheritance

### Base Template

```html
<!-- base.html -->
<html>
<head>
  <title>{% block title %}Default Title{% endblock %}</title>
  {% block extra_head %}{% endblock %}
</head>
<body>
  <header>{% block header %}Site Header{% endblock %}</header>
  <main>{% block content %}{% endblock %}</main>
  <footer>{% block footer %}{% endblock %}</footer>
</body>
</html>
```

### Child Template

```html
<!-- home.html -->
{% extends "base.html" %}

{% block title %}Home Page{% endblock %}

{% block content %}
  <h1>Welcome!</h1>
  {{ block.super }}  <!-- renders parent's block content -->
{% endblock %}
```

`{{ block.super }}` renders the parent template's block content within the override.

### Multi-level Inheritance

```
base.html
  └── base_blog.html   {% extends "base.html" %}
        └── post.html {% extends "base_blog.html" %}
```

---

## Include and Partials

### `{% include %}`

Include another template file:

```html
{% include "header.html" %}
{% include "sidebar.html" with active="home" %}
{% include user.theme|add:".html" %}  <!-- dynamic template name -->
```

Path traversal is blocked for security.

### `{% partialdef %} / {% partial %}`

Define and render reusable partial snippets within a template:

```html
{% partialdef card %}
  <div class="card">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
{% endpartialdef %}

{% partial card with title="Hello" description="World" %}
{% partial card with title="Foo" description="Bar" %}
```

Inline partials render immediately:

```html
{% partialdef greeting inline %}
  Hello {{ name }}!
{% endpartialdef %}
<!-- Output: "Hello !" (name not yet defined) -->
```

### Programmatic Partial Rendering

```javascript
const { compile } = require('miki-template');

const template = `{% partialdef my_partial %}Hello {{ who }}!{% endpartialdef %}`;
const compiled = compile(template);

console.log(compiled.renderPartial('my_partial', { who: 'World' }));
// → "Hello World!"
```

---

## Block Partial Rendering (HTMX / AJAX)

Render a specific block from a compiled template for AJAX responses:

```javascript
const { compile } = require('miki-template');

const template = compile(`
  {% extends "base.html" %}
  {% block main %}
    <h1>{{ title }}</h1>
    <div class="content">{{ content }}</div>
  {% endblock %}
`, { views: './templates' });

// Full page render
res.send(template.render({ title: 'Home', content: '...' }));

// Partial render — only the 'main' block
res.send(template.renderBlock('main', { title: 'Home', content: '...' }));
```

---

## Async Rendering

For templates with async helpers (database lookups, API calls):

```javascript
const { asyncRender, registerHelper } = require('miki-template');

registerHelper('fetch-user', async (content, ctx) => {
  const userId = content.trim();
  const user = await db.users.findById(userId);
  return `User: ${user.name}`;
});

// Template: {% fetch-user %}123{% endfetch-user %}
const html = await asyncRender(template, { db });
```

---

## Express Integration

### One-Line Setup (recommended)

`miki.setupExpress(app, opts)` wires the view engine, the `views` directory, and a `res.render` shim that makes `res.render('view#partial', ...)` return just the named `{% partialdef %}` body — perfect for HTMX.

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();

// That single line: registers the engine, sets views dir, enables #partial selectors.
miki.setupExpress(app, { extension: 'html', views: './views' });

// Full-page render
app.get('/', (req, res) => res.render('home', { user: req.user }));

// HTMX partial response — just append `#partialName` to the view name.
// Internally this calls the {% partialdef card %} body inside views/home.html.
app.get('/partials/:name', (req, res) =>
  res.render(`home#${req.params.name}`, { user: req.user })
);

app.listen(3000);
```

Options:

| Option | Default | Description |
|---|---|---|
| `extension` | `'html'` | File extension for views. Use `'miki'` if you prefer `.miki` files. |
| `views` | `app.get('views')` | Views directory (passed to `app.set('views', ...)`). |
| `async` | `false` | Use the async engine (`__expressAsync`). For Express 5 with async helpers. |

> The `res.render` shim intercepts **only** view names containing a `#`. Everything else (full pages, `res.render(view, cb)`, callback forms) goes through Express's normal view lookup, so the integration is fully compatible with existing Express middleware.

### Just-the-Middleware Variant

If you already have your own `app.engine()` setup and just want partial responses, add the middleware:

```javascript
const miki = require('miki-template');
app.use(miki.expressPartialRenderer());

app.get('/card', (req, res) => res.renderPartial('home#card', { user: req.user }));
```

### Manual Setup (still supported)

```javascript
const express = require('express');
const { __express } = require('miki-template');

const app = express();
app.engine('html', __express);
app.set('view engine', 'html');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('home', {
    title: 'My Site',
    user: req.user,
    items: ['a', 'b', 'c']
  });
});

app.listen(3000);
```

### Async Express Views

Express 5+ supports async route handlers natively. Pass `async: true` to `setupExpress`, or use `__expressAsync` directly:

```javascript
miki.setupExpress(app, { extension: 'html', views: './views', async: true });

app.get('/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send('Not found');
  res.render('user-profile', { user });
});
```

---

## Context Processors

Context processors inject variables into every template render, like Django's custom context processors.

```javascript
const { registerContextProcessor } = require('miki-template');

// Inject site-wide variables
registerContextProcessor(() => ({
  site_name: 'MyApp',
  current_year: new Date().getFullYear()
}));

// Access request-specific data
registerContextProcessor((ctx) => ({
  is_authenticated: ctx.user !== null,
  user_display: ctx.user ? ctx.user.name : 'Guest'
}));
```

Now `{{ site_name }}` and `{{ current_year }}` are available in every template automatically.

---

## Security

### Auto-escaping

HTML auto-escaping is **enabled by default**. All variable output is escaped:

```html
{{ user_input }}  → &lt;script&gt;alert()&lt;/script&gt;
```

### Marking Values as Safe

Use `|safe` for trusted HTML content:

```html
{{ trusted_html|safe }}
```

In JavaScript:

```javascript
const { markSafe } = require('miki-template');

res.render('email', {
  body: markSafe('<b>Welcome!</b>')  // Won't be escaped
});
```

### CSRF Protection

```html
<form method="post">
  {% csrf_token %}
  <!-- renders: <input type="hidden" name="csrfmiddlewaretoken" value="..."> -->
  ...
</form>
```

Provide `csrf_token` in context:

```javascript
res.render('form', { csrf_token: req.csrfToken() });
```

### CSP Nonce

```html
<script {% csp_nonce %} src="/app.js"></script>
```

Provide `csp_nonce` in context:

```javascript
res.render('page', { csp_nonce: res.locals.nonce });
```

---

## Static Files and URLs

Configure the static URL prefix:

```javascript
compile(template, { staticUrl: '/static/assets/' });
```

Then in templates:

```html
<img src="{% static "images/logo.png" %}" alt="Logo">
<!-- → /static/assets/images/logo.png -->

<script src="{% static "js/app.js" %}"></script>
```

### URL Resolution

```javascript
compile(template, {
  urlHelper: (routeName, ...args) => {
    const routes = {
      'home': '/',
      'user-profile': (id) => `/users/${id}`
    };
    const handler = routes[routeName];
    return typeof handler === 'function' ? handler(...args) : handler;
  }
});
```

```html
<a href="{% url "home" %}">Home</a>
<a href="{% url "user-profile" user.id %}">Profile</a>
```

---

## Error Handling

### Unclosed Tags

Unclosed block tags produce an error:

```html
{% if user.is_active %}
  <p>Active</p>
<!-- Missing {% endif %} → throws "Unexpected end of template"
```

### Missing Partial

```html
{% partial missing_name %}
<!-- throws: Partial 'missing_name' not found -->
```

### Missing Block

```javascript
template.renderBlock('nonexistent', {});
// throws: Block 'nonexistent' not found in template
```

### Path Traversal Protection

```html
{% include "../etc/passwd" %}
<!-- throws: Include tag attempted path traversal outside allowed views -->
```
