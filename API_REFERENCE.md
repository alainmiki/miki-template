# API Reference - Django-Style Template Engine

This document provides details for the public APIs exported by the `django-templates-express` engine.

---

## 📦 Core Exports

```javascript
const {
  compile,
  render,
  __express,
  registerTag,
  registerFilter,
  SafeString,
  markSafe
} = require('django-templates-express');
```

---

### `compile(templateStr, options)`
Compiles a raw template string into a reusable compiled template object.
- **Parameters**:
  - `templateStr` (string): The raw template string to compile.
  - `options` (object): Config parameters (e.g., `views`, `staticUrl`, `urlHelper`).
- **Returns**: An object containing a `render(context)` function.
- **Example**:
  ```javascript
  const template = compile('Hello {{ name }}');
  const output = template.render({ name: 'Miki' });
  ```

---

### `render(templateStr, context, options)`
A convenience function to compile and render a template string in a single step.
- **Parameters**:
  - `templateStr` (string): Raw template.
  - `context` (object): Scope variables to evaluate.
  - `options` (object): Config parameters.
- **Returns**: Rendered HTML string.

---

### `__express(filePath, options, callback)`
Express-compatible template engine adapter.
- **Parameters**:
  - `filePath` (string): Absolute path to the template file.
  - `options` (object): Scope context passed from `res.render()`.
  - `callback` (function): Returns `(err, html)`.

---

### `registerFilter(name, filterFn)`
Registers a custom filter function.
- **Parameters**:
  - `name` (string): Filter tag identifier.
  - `filterFn` (function): The filter execution body. Takes `(value, argument)`.

---

### `registerTag(name, parserFn)`
Registers a custom block tag parser.
- **Parameters**:
  - `name` (string): Tag identifier word (e.g. `if`, `for`).
  - `parserFn` (function): Parser function taking `(tagContent, parserInstance)`. Returns an AST node object.

---

### `markSafe(value)`
Wraps a string value inside a `SafeString` wrapper, instructing the engine to bypass HTML auto-escaping.
- **Parameters**:
  - `value` (string): String to mark safe.
- **Returns**: A `SafeString` object.
