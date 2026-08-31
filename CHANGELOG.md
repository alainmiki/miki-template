# Changelog

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

[1.1.0]: https://github.com/your-repo/miki-template/releases/tag/v1.1.0
[1.0.0]: https://github.com/your-repo/miki-template/releases/tag/v1.0.0
