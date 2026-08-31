# API Reference - miki-template

This document provides complete details for the public APIs exported by the **miki-template** engine — a Django-style template engine for Node.js and Express.

---

## Core Exports

```javascript
const {
  compile,
  render,
  asyncRender,
  __express,
  clearCache,
  registerTag,
  registerFilter,
  registerHelper,
  registerContextProcessor,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml
} = require('miki-template');
```

---

### `compile(templateStr, options)`

Compiles a raw template string into a reusable compiled template object. The compiled template caches its AST internally.

**Parameters**:
- `templateStr` (string): The raw template string to compile.
- `options` (object): Config parameters:
  - `views` (string|string[]): Directories to search for templates when using `extends` or `include`.
  - `staticUrl` (string): Prefix for the `{% static %}` tag. Defaults to `/static/`.
  - `urlHelper` (function): Custom URL resolver for `{% url %}` tag.

**Returns**: An object containing:
- `render(context)` — Synchronously renders the template.
- `asyncRender(context)` — Returns a Promise for async rendering.
- `renderBlock(blockName, context)` — Renders a specific block by name.
- `renderPartial(partialName, context)` — Renders a defined partial by name.

**Example**:
```javascript
const { compile } = require('miki-template');

const template = compile('Hello {{ name }}!');
const output = template.render({ name: 'World' });
console.log(output); // Hello World!
```

---

### `render(templateStr, context, options)`

One-step convenience function that compiles and renders a template.

**Parameters**:
- `templateStr` (string): Raw template string.
- `context` (object): Variables available to the template.
- `options` (object): Same as `compile()` options.

**Returns**: Rendered HTML string.

---

### `asyncRender(templateStr, context, options)`

Asynchronous rendering for templates with async helpers or async context processors.

**Parameters**: Same as `render()`.

**Returns**: `Promise<string>` — resolved rendered HTML.

**Example**:
```javascript
const { asyncRender } = require('miki-template');
const html = await asyncRender('Hello {{ name }}!', { name: 'Async' });
```

---

### `__express(filePath, options, callback)`

Express-compatible view engine adapter. Use with `app.engine()`.

**Parameters**:
- `filePath` (string): Absolute path to the template file.
- `options` (object): Express `res.render()` context (view engine strips `_locals`, `settings`, and other Express internals).
- `callback` (function): Node.js callback `(err, html)`.

**Example**:
```javascript
const express = require('express');
const { __express } = require('miki-template');

const app = express();
app.engine('html', __express);
app.set('view engine', 'html');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('home', { title: 'Home Page' });
});
```

---

### `registerTag(name, parserFn)`

Registers a custom block tag parser. Must be called **before** compiling templates that use the tag.

**Parameters**:
- `name` (string): Tag identifier word (e.g. `mytag` for `{% mytag %}`).
- `parserFn` (function): `(tagContent: string, parser: Parser) => ASTNode`. Receives the raw tag content and the parser instance.

**Returns**: `undefined`.

**Example**:
```javascript
const { registerTag } = require('miki-template');

registerTag('greet', (tagContent, parser) => {
  const name = tagContent.slice(5).trim(); // strip 'greet'
  return {
    render: (context) => `Hello ${context.get(name) || 'Guest'}!`
  };
});

// In template: {% greet user.name %}
```

---

### `registerFilter(name, filterFn)`

Registers a custom filter function.

**Parameters**:
- `name` (string): Filter name used after the pipe `|`.
- `filterFn` (function): `(value: any, arg?: any) => any`. Receives the filtered value and optional argument.

**Returns**: `undefined`.

**Example**:
```javascript
const { registerFilter } = require('miki-template');

registerFilter('reverse', (val) => {
  return String(val).split('').reverse().join('');
});

// In template: {{ name|reverse }}
```

---

### `registerHelper(name, fn)`

Registers a custom block helper tag. The helper receives the **rendered** inner content as a string.

**Parameters**:
- `name` (string): Tag name (e.g. `markdown` creates `{% markdown %}...{% endmarkdown %}`).
- `fn` (function): `(innerContent: string, context: Context) => string | Promise<string>`.

**Returns**: `undefined`.

**Example**:
```javascript
const { registerHelper } = require('miki-template');
const markdownIt = require('markdown-it')();
registerHelper('markdown', (content) => markdownIt.render(content));

// In template:
// {% markdown %}
// # Hello
// {% endmarkdown %}
```

---

### `registerContextProcessor(fn)`

Adds a context processor function. Similar to Django's custom context processors.

**Parameters**:
- `fn` (function): `(context: object) => object | undefined`. Receives the render context and returns extra key-value pairs to merge in.

**Returns**: `undefined`.

**Example**:
```javascript
const { registerContextProcessor } = require('miki-template');

registerContextProcessor((ctx) => ({
  siteName: 'MySite',
  currentYear: new Date().getFullYear()
}));

// Available in all templates as {{ siteName }} and {{ currentYear }}
```

---

### `SafeString`

Class for values that should **bypass HTML auto-escaping**. Construct directly or use `markSafe()`.

**Example**:
```javascript
const { SafeString } = require('miki-template');

const html = new SafeString('<b>Bold</b>');
// {{ html }} renders as <b>Bold</b>, NOT &lt;b&gt;Bold&lt;/b&gt;
```

---

### `markSafe(value)`

Wraps any value in a `SafeString`, instructing the engine to skip HTML escaping for that value.

**Parameters**:
- `value` (any): Value to mark as safe.

**Returns**: `SafeString`.

**Example**:
```javascript
const { markSafe } = require('miki-template');

const html = markSafe('<script>alert("xss")</script>');
// {{ html }} outputs the script tag literally (use with caution)
```

---

### `isSafe(value)`

Checks whether a value is a `SafeString` instance.

**Parameters**:
- `value` (any): Value to check.

**Returns**: `boolean`.

---

### `escapeHtml(str)`

Programmatically escapes HTML special characters (`<`, `>`, `&`, `"`, `'`).

**Parameters**:
- `str` (string): String to escape.

**Returns**: `string`.

---

### `clearCache()`

Clears the in-memory AST cache. Useful for development or when templates change at runtime.

**Example**:
```javascript
const { clearCache } = require('miki-template');

app.on('restart', () => clearCache());
```

---

## Compiled Template API

`compile()` returns an object with these methods:

### `compiled.render(context)`

Synchronously renders the template with the given context.

```javascript
const compiled = compile('Hello {{ name }}!');
compiled.render({ name: 'World' }); // "Hello World!"
```

### `compiled.asyncRender(context)`

Renders asynchronously, awaiting any Promise-returning helpers.

```javascript
const html = await compiled.asyncRender({ name: 'Async' });
```

### `compiled.renderBlock(blockName, context)`

Renders **only** the named block. Useful for HTMX or AJAX partial responses.

```javascript
// Template: {% extends "base.html" %}
//          {% block content %}Main{% endblock %}
compiled.renderBlock('content', {}); // "Main"
```

### `compiled.renderPartial(partialName, context)`

Renders a `{% partialdef %}` block by name.

```javascript
// Template: {% partialdef header %}My Header{% endpartialdef %}
compiled.renderPartial('header', {}); // "My Header"
```
