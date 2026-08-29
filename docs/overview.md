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

For API‑level details (e.g., `compile().renderPartial`) check `docs/api.md`.

---

## Contributing

We follow the standard open‑source workflow. Details are in `docs/contributing.md`.

---

> **Tip**: All documentation files are located under `c:/Users/Coder Miki/Desktop/miki-template/docs/`.
