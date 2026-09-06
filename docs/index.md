---
layout: home

hero:
  name: miki-template
  text: Django-style templates for Node.js
  tagline: Blazing fast partials, smart template discovery, and zero friction for HTMX
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/alainmiki/miki-template

features:
  - icon: ⚡
    title: Blazing Fast
    details: Compiled AST engine delivers ~150× better performance on realistic templates than pug, handlebars, and ejs.
  - icon: 🧩
    title: Partial Templates
    details: Define reusable chunks with {% partialdef %} and render by name with render('home#card'). Built for HTMX.
  - icon: 🔍
    title: Smart Template Discovery
    details: Django-like auto-discovery across templates/, app/templates/, and nested directories. No more hardcoded view paths.
  - icon: 🛡️
    title: Secure by Default
    details: Auto-escaping, SafeString wrappers, CSRF/CSP tags, and no eval(). Django security semantics out of the box.
  - icon: 🔌
    title: Express Integration
    details: One-line setup: miki.setupExpress(app). HTMX partials, async rendering, and full ESM/CJS support.
  - icon: 📦
    title: Full Django Parity
    details: Variables, filters, tags, inheritance, blocks, i18n, and more. If Django has it, miki likely does too.

---
