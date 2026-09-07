# API Reference



## Core Functions



- [render()](./render.md) — Render a template string or file partial

- [compile()](./compile.md) — Compile a template into a reusable object with `render()`, `asyncRender()`, `renderBlock()`, `renderPartial()`

- [asyncRender()](./async-render.md) — Asynchronous rendering (supports async filters/tags)

- [renderPartialFromFile()](./render-partial.md) — Render a named partial from a file

- [renderPartialFromSource()](./render-partial.md) — Render a named partial from source

- [setupExpress()](./setup-express.md) — One-line Express integration



## Tag and Filter Registration



- [registerFilter()](./filters.md) — Register a custom filter

- [getFilter()](./filters.md) — Retrieve a registered filter

- [registerTag()](./tags.md) — Register a custom tag

- [registerHelper()](./helpers.md) — Register a custom helper



## Utilities



- [findTemplateInViews()](./finder.md) — Locate a template in views directories

- [setAppTemplateDirNames()](./finder.md) — Configure app-style template directory names

- [clearCache()](./cache.md) — Clear the compiled template cache

- [registerContextProcessor()](./context-processors.md) — Register a global context processor

- [clearContextProcessors()](./context-processors.md) — Clear all context processors



## Security



- [markSafe()](./security.md) — Mark a string as safe (bypass escaping)

- [isSafe()](./security.md) — Check if a value is marked safe

- [escapeHtml()](./security.md) — Escape HTML special characters

- [SafeString](./security.md) — SafeString class



## Express Engine Functions



- `__express(filePath, options, callback)` — Express-compatible sync view engine

- `__expressAsync(filePath, options)` — Express 5 async view engine (returns Promise)

- `express(options)` — Returns a view engine function for `app.engine()`

- `expressPartialRenderer()` — Express middleware adding `res.renderPartial()`

- `stripExpressContext(options)` — Remove Express framework keys from context



## i18n



- [registerTranslation()](./i18n.md) — Register translations for a language

- [unregisterTranslation()](./i18n.md) — Unregister translations

- [setLanguage()](./i18n.md) / [getLanguage()](./i18n.md) — Set/get active language

- [setFallbackLanguage()](./i18n.md) / [getFallbackLanguage()](./i18n.md) — Set/get fallback language

- [getAvailableLanguages()](./i18n.md) — List registered languages



## Libraries



- [registerLibrary()](./libraries.md) — Register a named library (filters, tags, helpers)

- [activateLibrary()](./libraries.md) / [registerLibraryFromPath()](./libraries.md) — Activate or load from file

- [unregisterLibrary()](./libraries.md) / [hasLibrary()](./libraries.md) / [getLibraryNames()](./libraries.md) — Library management

