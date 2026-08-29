# Changelog

## [1.0.0] - 2026-08-29
### Added
- Full Django‑style template engine with variables, filters, tags, inheritance, partials, and context processors.
- Security features: auto‑escaping, `markSafe`, `csrf_token` and `csp_nonce_attr` tags.
- Extensible API: `registerTag`, `registerFilter`, `markSafe`.
- Express integration via `__express` adapter.
- Comprehensive test suite (39 passing tests) and benchmark suite.
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

[1.0.0]: https://github.com/your-repo/miki-template/releases/tag/v1.0.0
