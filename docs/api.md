# API Reference

This document lists the public API exported by **miki-template** for developers to integrate the engine into their projects.

| Function / Export | Signature | Description | Example |
|---|---|---|---|
| `compile(templateStr, options?)` | `compile(string, object?) → { render, asyncRender, renderBlock, renderPartial }` | Compiles a template string into a renderable object. Optional `options` can include `views` directories, custom tags/filters, etc. | `const tpl = compile('Hello {{ name }}');` |
| `render(templateStr, context?, options?)` | `render(string, object?, object?) → string` | One‑off rendering of a template string with the provided context. | `render('Hello {{ name }}', { name: 'World' });` |
| `asyncRender(templateStr, context?, options?)` | `asyncRender(string, object?, object?) → Promise<string>` | Asynchronous rendering (useful with async helpers). | `await asyncRender(tpl, ctx);` |
| `__express(filePath, options, callback)` | `__express(string, object, function)` | Express view engine adapter – reads the file at `filePath` and renders it. Honors `view#partial` suffixes for HTMX-style partial responses. | `app.engine('html', miki.__express);` |
| `__expressAsync(filePath, options)` | `__expressAsync(string, object) → Promise<string>` | Async Express 5+ view engine adapter. Returns a Promise that resolves to rendered HTML. Also honors `view#partial` suffixes. | `app.engine('html', miki.__expressAsync);` |
| `express(options?)` | `express(object?) → function` | Factory that returns a view-engine function suitable for `app.engine(...)`. Honors `view#partial` selectors. | `app.engine('html', miki.express());` |
| `setupExpress(app, opts?)` | `setupExpress(expressApp, object?) → void` | **One-line Express integration.** Wires `app.engine(...)`, `app.set('views')`, and patches `res.render` so `res.render('view#partial', ...)` returns just that partial. Options: `{ extension?, views?, async? }`. | `miki.setupExpress(app, { extension: 'html', views: './views' });` |
| `expressPartialRenderer()` | `expressPartialRenderer() → function` | Express middleware that adds `res.renderPartial(view, locals)`. Useful as a drop-in HTMX helper without the full `setupExpress` shim. | `app.use(miki.expressPartialRenderer());` |
| `renderPartialFromFile(filePath, partialName, context?, options?)` | `renderPartialFromFile(string, string, object?, object?) → string` | Load a file from disk and render only the named `{% partialdef %}`. | `miki.renderPartialFromFile('views/home.html', 'card', { user });` |
| `renderPartialFromSource(source, partialName, context?, options?)` | `renderPartialFromSource(string, string, object?, object?) → string` | Render a single named partial directly from a template string. Walks the AST (and `extends` chain) to discover partials nested inside blocks. | `miki.renderPartialFromSource(src, 'card', ctx, { views });` |
| `stripExpressContext(options)` | `stripExpressContext(object) → object` | Remove Express framework keys (`_locals`, `settings`, `cache`) from an options object. | `const ctx = stripExpressContext(res.locals);` |
| `clearCache()` | `clearCache() → void` | Clear the in-memory compiled template cache. | `clearCache();` |
| `registerTag(name, parserFn)` | `registerTag(string, function)` | Register a custom tag parser. Must be called before compiling templates. | `registerTag('mytag', parserFn);` |
| `registerFilter(name, fn)` | `registerFilter(string, function)` | Register a custom filter. | `registerFilter('reverse', str => str.split('').reverse().join(''));` |
| `getFilter(name)` | `getFilter(string) → function` | Retrieve a registered filter function by name. | `const upper = getFilter('upper');` |
| `registerHelper(name, fn)` | `registerHelper(string, function)` | Register a helper function available inside templates. | `registerHelper('upper', s => s.toUpperCase());` |
| `registerContextProcessor(fn)` | `registerContextProcessor(function)` | Add a context processor that mutates the rendering context before each render. | `registerContextProcessor(ctx => ({ ...ctx, csrf_token: '123' }));` |
| `registerTranslation(lang, messages)` | `registerTranslation(string, object) → void` | Register translation messages for a language. | `registerTranslation('fr', { 'Hello': 'Bonjour' });` |
| `setLanguage(lang)` | `setLanguage(string) → void` | Set the active language for all subsequent renders. | `setLanguage('fr');` |
| `getLanguage()` | `getLanguage() → string` | Get the currently active language. | `const lang = getLanguage();` |
| `setFallbackLanguage(lang)` | `setFallbackLanguage(string) → void` | Set the fallback language for missing translations. | `setFallbackLanguage('en');` |
| `getAvailableLanguages()` | `getAvailableLanguages() → string[]` | List all registered language codes. | `const langs = getAvailableLanguages();` |
| `registerLibrary(name, def)` | `registerLibrary(string, object) → void` | Register a plugin library of tags, filters, and helpers. | `registerLibrary('humanize', { filters: { intcomma } });` |
| `registerLibraryFromPath(name, path)` | `registerLibraryFromPath(string, string) → object` | Load a library from a JS file on disk. | `registerLibraryFromPath('myLib', './libs/my-lib.js');` |
| `activateLibrary(name)` | `activateLibrary(string) → void` | Activate a registered library (makes its tags/filters available). | `activateLibrary('humanize');` |
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
  __expressAsync,
  express,
  setupExpress,
  expressPartialRenderer,
  renderPartialFromFile,
  renderPartialFromSource,
  stripExpressContext,
  clearCache,
  registerTag,
  registerFilter,
  getFilter,
  registerHelper,
  registerContextProcessor,
  clearContextProcessors,
  registerTranslation,
  setLanguage,
  getLanguage,
  setFallbackLanguage,
  getAvailableLanguages,
  registerLibrary,
  registerLibraryFromPath,
  activateLibrary,
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
  __expressAsync,
  express,
  setupExpress,
  expressPartialRenderer,
  renderPartialFromFile,
  renderPartialFromSource,
  stripExpressContext,
  clearCache,
  registerTag,
  registerFilter,
  getFilter,
  registerHelper,
  registerContextProcessor,
  clearContextProcessors,
  registerTranslation,
  setLanguage,
  getLanguage,
  setFallbackLanguage,
  getAvailableLanguages,
  registerLibrary,
  registerLibraryFromPath,
  activateLibrary,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml
} from 'miki-template';

// Or import all as default
import miki from 'miki-template';
const { render: mikiRender, setupExpress } = miki;
```

For detailed usage, refer to the corresponding sections in the documentation:
- **Usage** – `docs/usage.md`
- **Tags** – `docs/tags.md`
- **Filters** – `docs/filters.md`
- **Security** – `docs/security.md`
