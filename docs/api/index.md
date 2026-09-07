# API Reference

## Core Functions

- [render() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'render.md.md'  — Render a template string or file partial
- [compile() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'compile.md.md'  — Compile a template into a reusable object with `render()`, `asyncRender()`, `renderBlock()`, `renderPartial()`
- [asyncRender() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'async-render.md.md'  — Asynchronous rendering (supports async filters/tags)
- [renderPartialFromFile() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'render-partial.md.md'  — Render a named partial from a file
- [renderPartialFromSource() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'render-partial.md.md'  — Render a named partial from source
- [setupExpress() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'setup-express.md.md'  — One-line Express integration

## Tag and Filter Registration

- [registerFilter() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'filters.md.md'  — Register a custom filter
- [getFilter() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'filters.md.md'  — Retrieve a registered filter
- [registerTag() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'tags.md.md'  — Register a custom tag
- [registerHelper() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'helpers.md.md'  — Register a custom helper

## Utilities

- [findTemplateInViews() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'finder.md.md'  — Locate a template in views directories
- [setAppTemplateDirNames() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'finder.md.md'  — Configure app-style template directory names
- [clearCache() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'cache.md.md'  — Clear the compiled template cache
- [registerContextProcessor() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'context-processors.md.md'  — Register a global context processor
- [clearContextProcessors() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'context-processors.md.md'  — Clear all context processors

## Security

- [markSafe() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'security.md.md'  — Mark a string as safe (bypass escaping)
- [isSafe() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'security.md.md'  — Check if a value is marked safe
- [escapeHtml() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'security.md.md'  — Escape HTML special characters
- [SafeString param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'security.md.md'  — SafeString class

## Express Engine Functions

- `__express(filePath, options, callback)` — Express-compatible sync view engine
- `__expressAsync(filePath, options)` — Express 5 async view engine (returns Promise)
- `express(options)` — Returns a view engine function for `app.engine()`
- `expressPartialRenderer()` — Express middleware adding `res.renderPartial()`
- `stripExpressContext(options)` — Remove Express framework keys from context

## i18n

- [registerTranslation() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'i18n.md.md'  — Register translations for a language
- [unregisterTranslation() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'i18n.md.md'  — Unregister translations
- [setLanguage() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'i18n.md.md'  / [getLanguage() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'i18n.md.md'  — Set/get active language
- [setFallbackLanguage() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'i18n.md.md'  / [getFallbackLanguage() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'i18n.md.md'  — Set/get fallback language
- [getAvailableLanguages() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'i18n.md.md'  — List registered languages

## Libraries

- [registerLibrary() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'libraries.md.md'  — Register a named library (filters, tags, helpers)
- [activateLibrary() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'libraries.md.md'  / [registerLibraryFromPath() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'libraries.md.md'  — Activate or load from file
- [unregisterLibrary() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'libraries.md.md'  / [hasLibrary() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'libraries.md.md'  / [getLibraryNames() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'libraries.md.md'  — Library management
