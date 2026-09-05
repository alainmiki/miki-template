# Changelog

## [1.3.4] - 2026-09-05
### Fixed
- **Express views path resolution** — normalize `views` entries and ensure miki treats file paths as directories when resolving templates and `#partial` lookups. This fixes `Failed to lookup view "home" in views directory ".../dir"` when `miki-template` is used from a host project's `node_modules` and `views` is passed as a file path.

## [1.3.3] - 2026-09-04
### Fixed
- **`date` and `time` filters** — multi-character tokens (`yyyy`, `MM`, `dd`, `HH`, `mm`, `ii`, `ss`) now work correctly. Previously `"yyyy-MM-dd"` rendered as `"24242424-JunJun-1515"` because each character was treated as an independent token. The fix uses longest-first token matching and adds backward-compatible single-character aliases (`m`/`d`/`H`/`i`/`s` for Django-style unpadded values).

### Performance
- **Inheritance parent-source cache** — `{% extends %}` no longer re-reads the parent template from disk on every render. A 64-entry LRU cache in `src/cache.js` (`getParentSource` / `hasParentSource`) memoises the parent source. Inheritance rendering improved from ~481 rps to **~2,056 rps** in the stress benchmark (4.3× faster, no functional change).

### Tooling
- **`benchmarks/stress.mjs`** — comprehensive 37-check stress benchmark covering correctness, compile speed, render speed, cache behavior, scale, endurance, partial rendering, async, and concurrency. Run with `node benchmarks/stress.mjs`. Exits with code 1 on any failure.
- **`eslint.config.mjs`** — added `URL`, `URLSearchParams`, `TextEncoder`, `TextDecoder`, `fetch`, `crypto`, `performance` to the Node 18+ globals list so `no-undef` no longer flags standard Web APIs.
- Removed dead code flagged by the linter: unused `elifBranches` variable in `parseIfChanged`, unused `extractPluralMappings` function in `i18n.js`. Renamed unused tag-parser `parser` parameters to `_parser` in `lorem` library and `parseLoad`.

### Verification
- `npx eslint src/**/*.js` — 0 errors, 0 warnings
- `npm test` — 397/397 passing
- `node benchmarks/stress.mjs` — 37/37 passing

## [1.3.1] - 2026-09-03
### Highlights
- **One-line Express integration**: `miki.setupExpress(app, { extension: 'html', views: dir })` — wires the view engine, `views` directory, and a `res.render` shim that lets you do `res.render('home#card', ...)` for HTMX-style partial responses. No more boilerplate, no extra middleware.
- **Render-any-partial-from-string**: `renderPartialFromSource(source, partialName, ctx, opts)` loads a template string and returns only the named `{% partialdef %}` body. This is what powers `res.render('view#partial')` and HTMX responses.
- **True built-in libraries**: `humanize`, `cache`, and `lorem` are now auto-activated on module load — `{% lorem %}` works without `{% load lorem %}`. Existing libraries now also expose helpers, not just tags.
- **Comprehensive integration test suite**: 382 tests covering every tag, filter, and feature under both CommonJS and ESM, all running against a **real Express HTTP server** on ephemeral ports.

### Added
- `miki.setupExpress(app, { extension, views, async })` — one-line Express bootstrap. Sets `view engine`, registers the engine, and patches `res.render` to handle `view#partial` selectors. Replaces the need to call `app.engine()`, `app.set('views')`, and `app.set('view engine')` manually.
- `miki.express()` — factory that returns a view-engine function suitable for `app.engine(...)`. Honors `view#partial` suffixes.
- `miki.expressPartialRenderer()` — middleware that adds `res.renderPartial(view, locals)`. Useful as a drop-in HTMX helper.
- `renderPartialFromSource(source, partialName, context, options)` — render a single named partial from a template string. Resolves `extends` chains so partials defined inside `{% block %}` tags are discoverable. Walks the AST and registers every `PartialDefNode` it finds, even when nested inside `{% for %}` or `{% if %}` blocks that won't render during partial lookup.
- `renderPartialFromFile(filePath, partialName, context, options)` — file-based convenience wrapper.
- `Context.get(name)` now returns `undefined` for missing keys (was `''`). This lets `default_if_none` distinguish "not provided" from an explicit empty string, matching Django.
- `escapeHtml(value, force = false)` — added a `force` flag so the `|escape` filter re-escapes even a `SafeString` (Django parity).
- `Context` constructor now supports `partialDefs` and `options` for cloning the partial registry.
- New exports: `setupExpress`, `express`, `expressPartialRenderer`, `renderPartialFromFile`, `renderPartialFromSource`, `clearContextProcessors`.
- ESM surface (`src/esm.mjs`) now exposes all the new helpers, with the same `default` + named import shape.
- Lorem library now ships a real `{% lorem N method %}` tag, a `lorem` filter, plus helpers. Built-in and auto-activated.
- `library.activate(name)` now also activates helpers and `registerTag` functions, not just filters.

### Changed
- Context processors now follow Django semantics: **existing context values win** over processor defaults. If you render with `{ user: req.user }` and a processor returns `{ user: 'Guest' }`, the explicit value is preserved.
- `__express` and `__expressAsync` now detect a `#partial` suffix in the view name and delegate to `renderPartialFromSource` automatically. This makes `app.engine('html', miki.__express)` already HTMX-ready — `setupExpress` just adds convenience.
- `cache.getCompiled` ignores function-valued and `undefined` options when building cache keys, so passing the same `urlHelper` function to multiple `compile()` calls no longer causes cache misses.
- Lexer rewritten with brace-depth counting for more reliable `{{ }}` and `{% %}` tokenization in templates with nested braces, escaped braces, and unusual whitespace.
- Filters now receive the rendering `context` as a final argument, so custom filters can read other context variables (e.g. for locale-aware formatting).
- `for` and `with` tags fully reworked for the user-reported edge cases:
  - `{% with x=1, y=2 as pair %}` — pair list followed by an alias.
  - `{% with value=expr %}` — single pair (no comma).
  - `{% with x=1, y=2 %}` — pure pair list (no alias).
  - Quoted values containing commas (`{% with a="x,y" %}`) parse correctly.
  - Pair values may be context variables.
- `partial` now accepts `with` kwargs and overrides context for the partial scope.
- `include` now supports `file#partial` syntax — the same partial-selector pattern works with `{% include %}` as with `res.render`.
- `url` tag respects `urlHelper` more cleanly: kwargs (a trailing object literal) are passed as the last argument instead of being conflated with positional args.
- `static` tag normalizes leading slashes; prefix can be customized.
- `csrf_token` and `csp_nonce_attr` outputs are properly escaped to prevent attribute injection.

### Fixed
- `with a=x b=y` (multi-pair) was previously treated as a single value/expression. Now correctly binds each pair.
- `cycle` with `as` form emits nothing but stores the value, matching Django.
- `block.super` works inside partials that override blocks.
- `extends` resolves `views` from `options.settings.views` (Express's normal path), `options.views`, or the default.
- Path traversal protection now applies to `extends` *and* `include`, including `include "file#partial"` form.
- `if` conditions handle dotted lookup, function auto-call, and missing variables without throwing.
- `default` vs `default_if_none`: `default` falls back on empty string, `null`, and `undefined`; `default_if_none` only on `null`/`undefined`. Both now match Django exactly.
- `removetags` filter now accepts multiple tag names.
- `safe` / `escape` filters correctly re-escape `SafeString` only when forced.
- `Context.get('a.b.c')` no longer stringifies `undefined` to `''`, fixing `{% if x %}` checks against missing variables.
- Cache key collisions when passing the same template string with different function-valued options (e.g. `urlHelper`).

### Compatibility
- No breaking changes. All existing public APIs continue to work. New APIs are opt-in.

## [1.2.0] - 2026-09-01
### Added
- Full **ESM** support via `src/esm.mjs` wrapper and conditional `package.json` exports.
- **TypeScript** type definitions (`src/types.d.ts`).
- **Async Express 5+** adapter: `__expressAsync(filePath, options) → Promise<string>`.
- **i18n**: `trans` tag/filter, `blocktrans`, `language`, plural rules, `registerTranslation`.
- **Plugin/library system**: `registerLibrary`, `registerLibraryFromPath`, built-ins (`humanize`, `cache`, `lorem`).
- **`load` tag** now activates registered libraries (no longer a stub).
- **`widthratio`** tag for proportional width calculations.
- **`debug`** tag for dumping template context during development.
- **`regroup`** filter for grouping arrays by attribute.
- **`strftime`** filter with full `date-fns` format support.
- **Unclosed tag validation**: throws descriptive errors for missing `endif`/`endfor`/`endwith`.
- **Filter chaining on string literals**: `{{ "Hello"|lower|capfirst }}` now works.
- New exports: `getFilter`, `stripExpressContext`, `activateLibrary`.

### Fixed
- `for` loop now supports filter expressions in iterable path (e.g. `items|regroup:"category"`).
- `Context.reset()` properly clears cycle state and blocks between renders.
- `__express` strips Express framework keys (`_locals`, `settings`, `cache`) from context.
- `renderPartial` renders only the named partial, not the full template.
- `with` tag correctly handles multiple `key=value` assignments and quoted values.
- `if` tag condition evaluation handles `not`, `and`, `or`, and operator precedence correctly.
- `forloop.parentloop` correctly propagates for nested loops.
- `floatformat` default behavior matches Django (1 decimal place).
- `timesince`/`timeuntil` handle seconds, minutes, hours, days correctly.
- `pluralize` correctly handles singular vs plural forms.
- `default` filter treats empty string `''` as falsy like Django.
- `striptags` correctly removes HTML tags and handles edge cases.
- Spaceless tag preserves whitespace inside tag attributes correctly.

### Changed
- Condition evaluation rewritten to use shunting-yard algorithm for correct operator precedence.
- Simplified `for` loop to use `[key, value]` tuples internally for cleaner unpacking.
- Improved `partialdef` to support both quoted and unquoted partial names.
- `floatformat` with `-1` argument now removes all decimals.

## [1.1.0] - 2026-08-31
### Added
- Missing `comment`/`endcomment` tag support for block comments.
- `firstof` tag to return the first non-falsy value from arguments.
- `length_is` filter for comparing length to a value.
- `urlencode`, `escapeuri`, `stringformat`, `cut`, `addslashes`, `removetags` filters for Django parity.
- `Context.reset()` method for clearing state between renders.
- `firstof` filter variant for inline first-truthy selection.

### Fixed
- Malformed code in `inheritance.js` with extra closing braces.
- `__express` was not exported from the module.
- `__express` now strips Express framework keys (`_locals`, `settings`, etc.) from context.
- `renderPartial` now properly extracts and renders only the named partial definition.
- `with` tag now correctly handles multiple `key=value` assignments and quoted values.
- `if` tag condition evaluation now properly handles `not`, `and`, `or`, and operator precedence.
- `for` loop now correctly unpacks `key, value` from objects and `item, index` from arrays.
- `forloop.parentloop` now correctly chains for nested loops.
- Cycle state (`cycleStates`) now resets per render via `Context.reset()`.
- Async helpers now work correctly with `asyncRender`.
- Partial definitions now collected at compile time for proper `renderPartial` support.
- Path traversal protection added to `extends` tag (previously only on `include`).
- `floatformat` default behavior now matches Django (1 decimal place).
- `timesince`/`timeuntil` now handles seconds, minutes, hours, days correctly.
- `pluralize` now correctly handles singular vs plural forms.
- `default` filter now treats empty string `''` as falsy like Django.
- `striptags` now correctly removes HTML tags and handles edge cases.
- Spaceless tag now preserves whitespace inside tag attributes correctly.

### Changed
- Rewrote condition evaluation to use shunting-yard algorithm for correct operator precedence.
- Simplified `for` loop to use `[key, value]` tuples internally for cleaner unpacking.
- Improved `partialdef` to support both quoted and unquoted partial names.
- `floatformat` with `-1` argument now removes all decimals.

## [1.0.0] - 2026-08-29
### Added
- Full Django‑style template engine with variables, filters, tags, inheritance, partials, and context processors.
- Security features: auto‑escaping, `markSafe`, `csrf_token` and `csp_nonce_attr` tags.
- Extensible API: `registerTag`, `registerFilter`, `markSafe`.
- Express integration via `__express` adapter.
- Comprehensive test suite (40 passing tests) and benchmark suite.
- Detailed documentation hierarchy (`docs/`): overview, installation, usage, tags, filters, partialdef, security, API reference, contribution guide.
- CI workflow using GitHub Actions.
- Project scaffolding, linting, and contribution guardrails (`AGENT.md`).

### Fixed
- Auto‑escaping now respects `SafeString` values.
- Context processors correctly propagate returned context.
- Fixed tag parsing edge cases in `IfNode` and `PartialDefNode`.

### Changed
- Updated README with npm version and CI badges.
- Added `CHANGELOG.md` for release notes.

[1.2.0]: https://github.com/your-repo/miki-template/releases/tag/v1.2.0
[1.1.0]: https://github.com/your-repo/miki-template/releases/tag/v1.1.0
[1.0.0]: https://github.com/your-repo/miki-template/releases/tag/v1.0.0
