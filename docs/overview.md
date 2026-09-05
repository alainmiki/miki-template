# Overview

Welcome to **miki-template** – a production‑ready, Django‑style template engine for Node.js and Express. This documentation mirrors the layout of popular open‑source libraries (e.g., Django, Jinja2, Mustache) and provides a clear, hierarchical guide for developers of all skill levels.

- **Project structure** – quick glance at the repository layout.
- **Feature list** – exhaustive rundown of supported tags, filters, security helpers, and the new `partialdef` system.
- **Getting started** – installation, basic rendering, and Express integration.
- **Advanced usage** – inheritance, block rendering, custom tags/filters, and performance tips.

---

## Repository layout

```
📦 miki-template/
├─ 📁 src/               # Core engine source files
│  ├─ index.js           # Entry point, compile/render APIs
│  ├─ lexer.js           # Tokenizer
│  ├─ parser.js          # AST builder
│  ├─ context.js         # Scope & partial registry
│  └─ tags/              # Built‑in tag parsers (control, inheritance, util)
│     ├─ control.js      # if, for, with, cycle, partialdef, …
│     ├─ inheritance.js # extends, block, super
│     └─ util.js         # comment, verbatim, etc.
├─ 📁 filters/           # Built‑in filter implementations
├─ 📁 tests/             # Jest‑style test suite
├─ 📁 docs/              # 📖 Documentation (this folder)
├─ README.md            # Project landing page (high‑level intro)
├─ AGENT.md             # Agent guardrails (internal)
├─ ROADMAP.md           # Future roadmap & milestones
└─ package.json         # npm package definition
```

Each module is deliberately **single‑responsibility** and fully typed via JSDoc comments, making it easy to extend.

---

## Where to start

- **Installation** – see `docs/installation.md`.
- **Basic rendering** – see `docs/usage.md`.
- **Tag reference** – see `docs/tags.md`.
- **Filter reference** – see `docs/filters.md`.
- **Partial definitions** – see `docs/partialdef.md`.
- **Security considerations** – see `docs/security.md`.

## Recursive and app-style template discovery

`miki-template` now supports Django-style recursive template discovery. When you configure your views directory (via `miki.setupExpress(app, { views: './views' })` or by passing `views` to `render()`), the engine will:

- Resolve direct paths like `nested/index` relative to each `views` directory.
- If a bare template name (e.g. `card`) is used, recursively scan subfolders of the configured `views` directories to find `card.html` or `card.miki`.
- Discover app-style `templates` directories located under application packages (e.g. `project/apps/product/templates/...`) and include them in the search.

Configuration:

- Programmatically set which folder names should be treated as app template roots via the API:

	- `setAppTemplateDirNames(['templates', 'site_templates'])` — sets the list of folder names that will be discovered under the views root.
	- `getAppTemplateDirNames()` — returns the current list.

Examples:

	- `render('home#card', ctx, { views: './views' })` will search `./views` and any `templates/` subfolders for `home.html` or `home.miki`, and render the `card` partial.
	- If your project places templates under `packages/product/templates/detail.html`, `render('detail', ..., { views: './views' })` will find it automatically.

This behavior is opt‑out by simply clearing the app-dir names: `setAppTemplateDirNames([])` will disable app-style discovery.

For API‑level details (e.g., `compile().renderPartial`) check `docs/api.md`.

---

## Contributing

We follow the standard open‑source workflow. Details are in `docs/contributing.md`.

---

> **Tip**: All documentation files are located under `c:/Users/Coder Miki/Desktop/miki-template/docs/`.
