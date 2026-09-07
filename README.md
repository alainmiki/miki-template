# miki-template
![miki-template banner](assets/banner.png)
![npm version](https://img.shields.io/npm/v/miki-template.svg) ![CI](https://github.com/your-repo/miki-template/workflows/ci.yml/badge.svg)

**Django-style template magic for Node.js — blazing fast partials, smart template discovery, and zero friction for HTMX.**

Define reusable partials with `{% partialdef %}`, render any slice of a page with `render('home#card')`, and let the engine find templates across your whole project — `templates/`, `app/templates/`, or whatever structure you prefer. No more wrestling with view paths or boilerplate middleware.

---

## 🚀 Features

- **Partial-powered templating**: Define reusable chunks with `{% partialdef %}` and render them by name anywhere — `res.render('home#card')`, `renderPartialFromSource(...)`, or `compiled.renderBlock('block')`. Built for HTMX-style partial responses without the hassle.
- **Smart template discovery**: Stop hardcoding view paths. The engine searches `templates/`, nested app directories, and custom folder names automatically — just like Django. `setupExpress()` expands your views roots so templates live where they make sense.
- **One-line Express integration**: `miki.setupExpress(app, { extension: 'html', views: dir })` — wires the engine, views directory, and a `res.render` shim that makes `res.render('home#card', ...)` Just Work for HTMX-style partial responses. **No boilerplate, no extra middleware.**
- **Full Syntax Parity**: Supports variables, dotted lookups, filters (`|`), and block tags (`{% %}`).
- **Template Inheritance**: Multi-level inheritance with `extends`, block overrides, and `{{ block.super }}` support.
- **Built-in libraries**: `humanize`, `cache`, and `lorem` ship pre-activated. `{% lorem 5 p %}` works without `{% load lorem %}`.
- **ESM & CommonJS**: Works seamlessly with both `import` and `require` syntax.
- **Security by Default**: Auto-escaping enabled by default with a `SafeString` wrapper.
- **CSRF & CSP Support**: Native tags for `{% csrf_token %}` and `{% csp_nonce_attr %}` to keep apps secure out-of-the-box.
- **Block Partials**: Render a single block from a compiled template via `compiled.renderBlock('block_name')`.
- **Async Rendering**: Support for async filters/tags with `asyncRender()`.
- **Extensible API**: Easy registration for custom tags and filters.
- **No Unsafe Code Execution**: Evaluates expressions securely without using `eval()`.
- **Editor Support**: First-class syntax highlighting and snippets for VS Code, Sublime Text, Atom, and TextMate-compatible editors.

### VS Code

#### Option A: Install the official extension (recommended)

Search for **miki-template** in the VS Code Marketplace, or install from the command line:

```bash
code --install-extension miki-template
```

#### Option B: Manual install from this repo

1. Copy the `syntaxes/` and `snippets/` folders from this repo.
2. In VS Code, run **Preferences: Configure File Associations** and associate `*.miki` with `miki-template`.
3. Or add a workspace-level `.vscode/settings.json`:

```json
{
  "files.associations": {
    "*.miki": "miki-template"
  }
}
```

### Sublime Text / Atom / TextMate

Drop the `syntaxes/miki-template.tmLanguage.json` file into your editor's `Packages/User/` folder and associate it with the `.miki` extension.

---

## ⚡ Performance

miki-template is built for real-world apps. Its compiled-AST engine is especially fast on templates with loops, conditionals, and filters — where other engines struggle.

**Benchmark: renders per second (higher is better)**

| Template   | miki-template | pug     | handlebars | ejs     |
|------------|---------------|---------|------------|---------|
| Small      | ~115k rps     | 1.7M rps| 417k rps   | 182k rps|
| Medium     | ~454k rps     | 625k rps| 48k rps    | 29k rps |
| Large      | **~476k rps** | 3.1k rps| 661 rps    | 290 rps |

> **TL;DR**: On medium templates miki-template is competitive with pug, and on large/realistic pages it **dominates by ~150×** versus pug, handlebars, and ejs. That’s where production apps live, and that’s where miki wins.

**How we benchmark**: Each engine renders the same template shape (loops, filters, conditionals) for its syntax. Run `npm run bench` to verify on your own machine.

---

## 📚 Documentation

- **[Documentation](https://alainmiki.github.io/miki-template/)** — Full docs site
- [Getting Started](https://alainmiki.github.io/miki-template/guide/getting-started)
- [Installation](https://alainmiki.github.io/miki-template/guide/installation)
- [Quick Start](https://alainmiki.github.io/miki-template/guide/quick-start)
- [API Reference](https://alainmiki.github.io/miki-template/api/)
- [Integrations](https://alainmiki.github.io/miki-template/integrations/)
- [Performance](https://alainmiki.github.io/miki-template/performance)

---

## 📦 Installation

```bash
npm install miki-template
```

---

## 🛠️ Quick Start

### CommonJS (require)

```javascript
const { render, compile, __express, SafeString, markSafe } = require('miki-template');

const template = 'Hello {{ user.name|title }}! Roles: {{ user.roles|join:", " }}';
const context = {
  user: {
    name: 'miki coder',
    roles: ['admin', 'developer']
  }
};

const result = render(template, context);
console.log(result); // Output: "Hello Miki Coder! Roles: admin, developer"
```

### ES Modules (import)

```javascript
// Named imports
import { render, compile, __express, SafeString, markSafe } from 'miki-template';

// Or default import (gets all exports)
import miki from 'miki-template';
const { render: mikiRender } = miki;

const template = 'Hello {{ user.name|title }}!';
const result = render(template, { user: { name: 'world' } });
console.log(result); // Output: "Hello World!"
```

> **Note:** For ESM in Node.js, either name your files `.mjs` or add `"type": "module"` to your `package.json`.

### Express Integration

**The recommended, one-line setup** — wires the view engine, views directory, and partial responses in a single call:

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });

// Full page
app.get('/', (req, res) => res.render('home', { user: req.user }));

// HTMX / partial response — just append `#partialName` to the view name
app.get('/partials/:name', (req, res) =>
  res.render(`home#${req.params.name}`, { user: req.user })
);

app.listen(3000);
```

> `setupExpress` calls `app.engine()`, `app.set('views')`, and `app.set('view engine')` for you, and patches `res.render` so `view#partial` is dispatched to the partial renderer (not the file system). It works equally well for `.miki` files — just pass `extension: 'miki'`.

### Partial Templates Made Effortless

**Define reusable partials once, render them anywhere:**

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

Then serve just that partial via HTMX:

```javascript
app.get('/card/:id', (req, res) =>
  res.render(`home#card`, { title: 'Hello', body: '...', featured: true })
);
```

### Smart Template Discovery

Tired of `Failed to lookup view` errors? miki-template searches your entire project structure automatically:

- `views/`
- `app/templates/`
- `packages/*/templates/`
- Any custom directory name you configure

```javascript
miki.setupExpress(app, { 
  extension: 'html', 
  views: './views' 
});

// Templates placed deeply in your project are found automatically:
//   src/modules/users/templates/profile.html
//   packages/admin/templates/dashboard.html
//   app/templates/shared/header.html
```

If your project uses a different convention than `templates`, call `setAppTemplateDirNames()` to customize the names that the engine recognizes when scanning for app-style template folders.

**The classic, fully manual setup still works** if you prefer it:

```javascript
const express = require('express');
const { __express } = require('miki-template');

const app = express();
app.engine('html', __express);
app.set('view engine', 'html');
app.set('views', './views');
```

**ESM:**
```javascript
import express from 'express';
import miki from 'miki-template';

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });
```

**Async Express 5+:**
```javascript
miki.setupExpress(app, { extension: 'html', views: './views', async: true });
```

**Or, if you only want partial responses** without changing your engine registration, add the middleware:

```javascript
app.use(miki.expressPartialRenderer());

app.get('/card', (req, res) => res.renderPartial('home#card', { user: req.user }));
```

---

## 📖 Template Syntax & Parity

### Variables & Dotted Lookups
Resolve properties dynamically on nested objects or arrays. If the resolved value is a callable/function, it is automatically executed with zero arguments.
```html
{{ user.profile.name }}
{{ items.0 }} <!-- Array indexing -->
{{ user.getFullName }} <!-- Function resolution -->
```

### Built-in Filters
Apply filters using pipes (`|`). Arguments are passed after a colon (`:`).
- **Text**: `upper`, `lower`, `title`, `capfirst`, `slugify`, `wordcount`, `striptags`, `linebreaks`, `linebreaksbr`, `truncatewords:N`, `truncatechars:N`, `truncatechars_html:N`.
- **HTML**: `safe`, `escape`.
- **List**: `length`, `join:","`, `slice:"start:end"`, `dictsort:"key"`, `dictsortreversed:"key"`, `sort`, `unique`, `random`, `reverse`, `split:","`, `replace:"old,new"`.
- **Default**: `default:"fallback"`, `default_if_none:"fallback"`, `firstof:v1 v2 v3`.
- **Date/Time**: `date:"Y-m-d"`, `time:"H:i"`, `date_format:"yyyy-MM-dd"`, `strftime:"PPpp"`, `timesince`, `timeuntil`, `ago`, `until`, `time_diff:other_date`.
- **Numeric**: `add:5`, `sub:3`, `mult:2`, `divisibleby:2`, `mod:3`, `floatformat:2`, `square`, `sqrt`, `abs`, `round:2`, `floor`, `ceil`, `min:10`, `max:100`, `sum`, `average`.
- **Currency/Data**: `currency:"$"`, `phone_number`, `email`, `url`, `mask:"*"`, `whatsapp_link:"msg"`, `credit_card`, `ssn`, `ip_address`, `uuid`, `filesizeformat`, `yesno:"yes,no,maybe"`, `pluralize:"s"`, `urlencode`, `escapeuri`, `stringformat:"%s"`, `cut:"text"`, `addslashes`, `removetags:"p,div"`, `trans`, `regroup:"attr"`, `json`, `urlize`.
- **Encoding**: `base64_encode`, `base64_decode`.

### Built-in Control Tags
- **if / elif / else / endif**: Supports conditional expressions with operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `and`, `or`, `not`.
  ```html
  {% if user.role == 'admin' or user.is_staff %}
    <p>Access Granted</p>
  {% elif user.age >= 18 %}
    <p>Standard Access</p>
  {% else %}
    <p>Access Denied</p>
  {% endif %}
  ```
- **for / empty / endfor**: Loop over arrays and objects. Injects `forloop` meta tracking.
  ```html
  {% for item in items %}
    <li>{{ forloop.counter }}: {{ item }}</li>
  {% empty %}
    <li>No items found</li>
  {% endfor %}
  ```
- **with / endwith**: Scopes localized variables.
  ```html
  {% with user.profile.address as addr %}
    <p>{{ addr.city }}, {{ addr.zip }}</p>
  {% endwith %}
  ```
- **cycle**: Cycle through values sequentially.
  ```html
  {% for row in rows %}
    <tr class="{% cycle 'row-odd' 'row-even' %}">...</tr>
  {% endfor %}
  ```
- **firstof**: Return the first truthy value.
  ```html
  {% firstof var1 var2 var3 "fallback" %}
  ```
- **set**: Assign variables.
  ```html
  {% set total = price * quantity %}
  {% set greeting %}Hello {{ name }}{% endset %}
  ```
- **ifchanged / endifchanged**: Render only when value changes.
  ```html
  {% for item in items %}
    {% ifchanged item.category %}
      <h2>{{ item.category }}</h2>
    {% endifchanged %}
  {% endfor %}
  ```
- **now**: Output current date/time.
  ```html
  {% now "Y-m-d H:i:s" %}
  ```
- **static**: Generate static file URLs.
  ```html
  {% static "css/style.css" %}
  ```
- **url**: Build URLs from route names.
  ```html
  {% url 'user.profile' user.id %}
  ```
- **regroup**: Group lists by attribute.
  ```html
  {% for group in items|regroup:"category" %}
    <h3>{{ group.grouper }}</h3>
  {% endfor %}
  ```
- **spaceless**: Remove whitespace between tags.
  ```html
  {% spaceless %}<div>  <span>hi</span>  </div>{% endspaceless %}
  ```
- **widthratio**: Calculate ratios.
  ```html
  {% widthratio value max max_width %}
  ```
- **debug**: Dump template context.
  ```html
  {% debug %}
  ```
- **autoescape on/off**: Control auto-escaping block behavior.
- **verbatim / endverbatim**: Treat raw text inside literally.
- **comment / endcomment**: Block comment ignored during parse.
- **load**: Activate template libraries.
  ```html
  {% load lorem humanize %}
  ```
- **templatetag**: Output literal template tag tokens.
  ```html
  {% templatetag openblock %} if user.is_admin {% templatetag closeblock %}
  ```

### Security Tags
- **csrf_token**: Automatically outputs a hidden input carrying the CSRF token from the context variable `csrf_token`.
  ```html
  <form method="post">
    {% csrf_token %}
    ...
  </form>
  ```
- **csp_nonce_attr**: Dynamically outputs `nonce="value"` if the variable `csp_nonce` is in the context.
  ```html
  <script {% csp_nonce_attr %} src="app.js"></script>
  ```

### Inheritance & Block Rendering
Inherit structure from parent templates.
- `base.html`:
  ```html
  <html>
  <body>
    {% block content %}Default Content{% endblock %}
  </body>
  </html>
  ```
- `child.html`:
  ```html
  {% extends "base.html" %}
  {% block content %}
    <h1>Child Content</h1>
    {{ block.super }} <!-- Renders parent's default content -->
  {% endblock %}
  ```

#### Rendering a Block-Level Partial (Django 5.1+ / HTMX Style)
You can compile a template and choose to render *only a specific block* (useful for AJAX or HTMX requests):
```javascript
const compiled = compile(childTemplateStr, { views: './templates' });
const partialHtml = compiled.renderBlock('content', context);
console.log(partialHtml); // Output: "<h1>Child Content</h1> Default Content"
```

---

## 🔧 Extensibility API

### Register a Custom Filter

**CommonJS:**
```javascript
const { registerFilter } = require('miki-template');

registerFilter('reverse', (val) => {
  return String(val).split('').reverse().join('');
});
```

**ESM:**
```javascript
import { registerFilter } from 'miki-template';

registerFilter('reverse', (val) => {
  return String(val).split('').reverse().join('');
});
```

### Register a Custom Tag

**CommonJS:**
```javascript
const { registerTag } = require('miki-template');

// Custom tag parser returning an AST Node
registerTag('hello', (tagContent, parser) => {
  return {
    render: (context) => 'Hello World!'
  };
});
```

**ESM:**
```javascript
import { registerTag } from 'miki-template';

registerTag('hello', (tagContent, parser) => {
  return {
    render: (context) => 'Hello World!'
  };
});
```

---

## 🚀 Releasing

Releases are fully automatic. Pick the bump you want and run one command:

```bash
npm run release:patch   # 1.3.3 → 1.3.4
npm run release:minor   # 1.3.3 → 1.4.0
npm run release:major   # 1.3.3 → 2.0.0
```

That bumps `package.json`, creates a `chore(release): vX.Y.Z` commit, and pushes to `main`. The CI then:

1. Runs lint + test + the strict benchmark (must pass)
2. Creates an annotated `vX.Y.Z` git tag and pushes it
3. Creates a GitHub Release with notes from `.github/release-notes/vX.Y.Z.md` (optional)
4. Publishes to npm

Nothing else to click. The whole pipeline is in `.github/workflows/release.yml`.

---

## 🔒 Security
- **HTML Auto-escaping**: Enabled by default to guard against Cross-Site Scripting (XSS).
- **SafeString Wrapper**: Explicitly bypass escaping using the `|safe` filter or marking variables via `markSafe(val)`.
- **No eval() Execution**: Parser evaluates logic statements securely using standard tokens mapping.
