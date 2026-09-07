# API Reference

## Core Functions

- [render()](./render) — Render a template string or file partial
- [compile()](./compile) — Compile a template into a reusable object with `render()`, `asyncRender()`, `renderBlock()`, `renderPartial()`
- [asyncRender()](./async-render) — Asynchronous rendering (supports async filters/tags)
- [renderPartialFromFile()](./render-partial) — Render a named partial from a file
- [renderPartialFromSource()](./render-partial) — Render a named partial from source
- [setupExpress()](./setup-express) — One-line Express integration

## Tag and Filter Registration

- [registerFilter()](./filters) — Register a custom filter
- [getFilter()](./filters) — Retrieve a registered filter
- [registerTag()](./tags) — Register a custom tag
- [registerHelper()](./helpers) — Register a custom helper

## Utilities

- [findTemplateInViews()](./finder) — Locate a template in views directories
- [setAppTemplateDirNames()](./finder) — Configure app-style template directory names
- [clearCache()](./cache) — Clear the compiled template cache
- [registerContextProcessor()](./context-processors) — Register a global context processor
- [clearContextProcessors()](./context-processors) — Clear all context processors

## Security

- [markSafe()](./security) — Mark a string as safe (bypass escaping)
- [isSafe()](./security) — Check if a value is marked safe
- [escapeHtml()](./security) — Escape HTML special characters
- [SafeString](./security) — SafeString class

## Express Engine Functions

- `__express(filePath, options, callback)` — Express-compatible sync view engine
- `__expressAsync(filePath, options)` — Express 5 async view engine (returns Promise)
- `express(options)` — Returns a view engine function for `app.engine()`
- `expressPartialRenderer()` — Express middleware adding `res.renderPartial()`
- `stripExpressContext(options)` — Remove Express framework keys from context

## i18n

- [registerTranslation()](./i18n) — Register translations for a language
- [unregisterTranslation()](./i18n) — Unregister translations
- [setLanguage()](./i18n) / [getLanguage()](./i18n) — Set/get active language
- [setFallbackLanguage()](./i18n) / [getFallbackLanguage()](./i18n) — Set/get fallback language
- [getAvailableLanguages()](./i18n) — List registered languages

## Libraries

- [registerLibrary()](./libraries) — Register a named library (filters, tags, helpers)
- [activateLibrary()](./libraries) / [registerLibraryFromPath()](./libraries) — Activate or load from file
- [unregisterLibrary()](./libraries) / [hasLibrary()](./libraries) / [getLibraryNames()](./libraries) — Library management
