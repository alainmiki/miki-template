# miki-template
![npm version](https://img.shields.io/npm/v/miki-template.svg) ![CI](https://github.com/your-repo/miki-template/workflows/ci.yml/badge.svg)
A robust, production-ready template engine that brings **Django's template language** features and syntax to Node.js and Express, fully compliant with modern JavaScript (ES6+), CommonJS, and **ESM** (`import`) support.

---

## 🚀 Features

- **Full Syntax Parity**: Supports variables, dotted lookups, filters (`|`), and block tags (`{% %}`).
- **Template Inheritance**: Multi-level inheritance with `extends`, block overrides, and `{{ block.super }}` support.
- **Express Integration**: Simple, zero-config integration via `app.engine()`.
- **ESM & CommonJS**: Works seamlessly with both `import` and `require` syntax.
- **Security by Default**: Auto-escaping enabled by default with a `SafeString` wrapper.
- **CSRF & CSP Support**: Native tags for `{% csrf_token %}` and `{% csp_nonce_attr %}` to keep apps secure out-of-the-box.
- **Block Partials**: Render a single block from a compiled template via `compiled.renderBlock('block_name')`.
- **Async Rendering**: Support for async filters/tags with `asyncRender()`.
- **Extensible API**: Easy registration for custom tags and filters.
- **No Unsafe Code Execution**: Evaluates expressions securely without using `eval()`.

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

**CommonJS:**
```javascript
const express = require('express');
const { __express: renderDtpl } = require('miki-template');

const app = express();

// Register both .html and .miki extensions
app.engine('html', renderDtpl);
app.engine('miki', renderDtpl);
app.set('view engine', 'miki');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('home', {
    title: 'Django Templates in Node!',
    items: ['Apple', 'Banana', 'Orange']
  });
});

app.listen(3000, () => console.log('App listening on port 3000'));
```

**ESM:**
```javascript
import express from 'express';
import { __express as renderDtpl } from 'miki-template';

const app = express();
app.engine('html', renderDtpl);
app.set('view engine', 'html');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('home', {
    title: 'Django Templates with ESM!',
    items: ['Apple', 'Banana', 'Orange']
  });
});

app.listen(3000, () => console.log('App listening on port 3000'));
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
- **Text**: `upper`, `lower`, `title`, `capfirst`, `slugify`, `wordcount`, `striptags`, `linebreaks`, `linebreaksbr`, `truncatewords:N`, `truncatechars:N`.
- **HTML**: `safe`, `escape`.
- **List**: `length`, `join:","`, `slice:"start:end"`, `dictsort:"key"`, `dictsortreversed:"key"`.
- **Default**: `default:"fallback"`, `default_if_none:"fallback"`.
- **Date/Time**: `date:"Y-m-d"`, `time:"H:i"`, `timesince`, `timeuntil`.
- **Numeric**: `add:5`, `divisibleby:2`, `floatformat:2`.
- **Misc**: `yesno:"yes,no,maybe"`, `pluralize:"suffix"`, `filesizeformat`.

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
- **autoescape on/off**: Control auto-escaping block behavior.
- **verbatim / endverbatim**: Treat raw text inside literally.
- **comment / endcomment**: Block comment ignored during parse.

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

## 🔒 Security
- **HTML Auto-escaping**: Enabled by default to guard against Cross-Site Scripting (XSS).
- **SafeString Wrapper**: Explicitly bypass escaping using the `|safe` filter or marking variables via `markSafe(val)`.
- **No eval() Execution**: Parser evaluates logic statements securely using standard tokens mapping.
