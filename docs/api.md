# API Reference

This document lists the public API exported by **miki-template** for developers to integrate the engine into their projects.

| Function / Export | Signature | Description | Example |
|---|---|---|---|
| `compile(templateStr, options?)` | `compile(string, object?) → { render, asyncRender, renderBlock, renderPartial }` | Compiles a template string into a renderable object. Optional `options` can include `views` directories, custom tags/filters, etc. | `const tpl = compile('Hello {{ name }}');` |
| `render(templateStr, context?, options?)` | `render(string, object?, object?) → string` | One‑off rendering of a template string with the provided context. | `render('Hello {{ name }}', { name: 'World' });` |
| `asyncRender(templateStr, context?, options?)` | `asyncRender(string, object?, object?) → Promise<string>` | Asynchronous rendering (useful with async helpers). | `await asyncRender(tpl, ctx);` |
| `__express(filePath, options, callback)` | `__express(string, object, function)` | Express view engine adapter – reads the file at `filePath` and renders it. | `app.set('view engine', 'miki');` |
| `registerTag(name, parserFn)` | `registerTag(string, function)` | Register a custom tag parser. Must be called before compiling templates. | `registerTag('mytag', parserFn);` |
| `registerFilter(name, fn)` | `registerFilter(string, function)` | Register a custom filter. | `registerFilter('reverse', str => str.split('').reverse().join(''));` |
| `registerHelper(name, fn)` | `registerHelper(string, function)` | Register a helper function available inside templates. | `registerHelper('upper', s => s.toUpperCase());` |
| `registerContextProcessor(fn)` | `registerContextProcessor(function)` | Add a context processor that mutates the rendering context before each render. | `registerContextProcessor(ctx => ({ ...ctx, csrf_token: '123' }));` |
| `SafeString` | `class SafeString` | Wrapper class for values that should bypass auto‑escaping. Returned by `markSafe`. |
| `markSafe(value)` | `markSafe(any) → SafeString` | Marks a value as safe, preventing HTML escaping. |
| `isSafe(value)` | `isSafe(any) → boolean` | Checks if a value is a `SafeString`. |
| `escapeHtml(str)` | `escapeHtml(string) → string` | Escapes HTML special characters. Used internally for auto‑escaping. |

All of the above are exported from `src/index.js` and can be imported via:

### CommonJS
```js
const {
  compile,
  render,
  asyncRender,
  __express,
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

### ES Modules (ESM)
```js
import {
  compile,
  render,
  asyncRender,
  __express,
  registerTag,
  registerFilter,
  registerHelper,
  registerContextProcessor,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml
} from 'miki-template';

// Or import all as default
import miki from 'miki-template';
const { render: mikiRender } = miki;
```

For detailed usage, refer to the corresponding sections in the documentation:
- **Usage** – `docs/usage.md`
- **Tags** – `docs/tags.md`
- **Filters** – `docs/filters.md`
- **Security** – `docs/security.md`
