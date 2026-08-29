# Django-Style Template Engine for Node.js/Express

## 📖 Overview
A custom template engine for Express that replicates **Django’s template language** in Node.js. It supports variables, filters, tags, inheritance, partials, escaping, and extensibility — providing full parity with Django templates while integrating seamlessly into Express.

---

## 🎯 Goals
- Full Django template feature parity in Node.js.
- Simple Express integration via `app.engine`.
- Extensible API for custom tags, filters, and context processors.
- Secure by default (autoescape enabled).
- Production-ready performance (AST caching, error handling).

---

## 🧩 Core Architecture
1. **Lexer** → Tokenizes template into `TEXT`, `VAR`, `BLOCK`.
2. **Parser** → Builds AST nodes for tags/filters.
3. **Renderer** → Walks AST, evaluates expressions, applies filters.
4. **Filter Registry** → Built-in + custom filters.
5. **Tag Handlers** → Functions for each tag (`if`, `for`, `block`, etc.).
6. **Inheritance System** → Block registry + parent merging.
7. **Express Integration** → `app.engine('dtpl', renderFile)`.

---

## 🏷️ Built-in Template Tags

| Tag | Purpose | Node.js Implementation |
|-----|---------|------------------------|
| **autoescape** | Toggle HTML escaping. | Maintain `context.autoescape` flag. |
| **block** | Define overridable content. | Store block AST in registry. |
| **extends** | Template inheritance. | Load parent file, merge blocks. |
| **include** | Insert partial template. | Load file, render with context. |
| **if/elif/else** | Conditional rendering. | Evaluate JS expression safely. |
| **for/empty** | Loop over iterable. | Inject `forloop` vars (`counter`, `first`, `last`). |
| **with** | Assign temporary variable. | Extend context object. |
| **cycle** | Alternate values. | Maintain cycle state per loop. |
| **comment** | Ignore enclosed content. | Strip from AST. |
| **verbatim** | Raw output. | Treat enclosed text as literal. |
| **csrf_token** | CSRF protection. | Insert token from context. |
| **csp_nonce_attr** | CSP nonce attribute. | Render `nonce="value"`. |
| **url** | Generate route URL. | Integrate with Express router. |
| **static** | Reference static files. | Map to Express static dir. |
| **regroup** | Group list by attribute. | Use JS `reduce`. |
| **spaceless** | Strip whitespace. | Regex replace in output. |

---

## 🔧 Built-in Filters

| Filter | Purpose | Node.js Implementation |
|--------|---------|------------------------|
| **Text** | `upper`, `lower`, `title`, `capfirst`, `truncatewords`, `truncatechars`, `wordcount`, `linebreaks`, `linebreaksbr`, `striptags`, `slugify` | JS string methods, regex, libraries. |
| **HTML** | `safe`, `escape` | Use `he` for escaping; safe flag. |
| **List** | `length`, `join`, `slice`, `dictsort`, `dictsortreversed` | JS array methods. |
| **Date/Time** | `date`, `time`, `timesince`, `timeuntil` | Wrap JS `Date` with `Intl.DateTimeFormat`. |
| **Numeric** | `add`, `divisibleby`, `floatformat` | Arithmetic ops; `toFixed`. |
| **Default** | `default`, `default_if_none` | Fallback values. |
| **Misc** | `pluralize`, `yesno`, `filesizeformat` | String transformations; filesize units. |

---

## 🔐 Escaping & Security
- Autoescape enabled by default.
- `safe` filter disables escaping.
- `escape` filter forces escaping.
- Use `he` library for HTML entity encoding.

---

## 🛠️ Extensibility
- **Custom filters**: `filters[name] = fn`.
- **Custom tags**: Register handler functions in tag registry.
- **Context processors**: Middleware to inject globals (e.g., `user`, `request`).

---

## 📋 Development Roadmap

### Phase 1 — Core Foundations
- Lexer, parser, renderer.
- Express integration.

### Phase 2 — Variables & Filters
- Variables with dotted lookups.
- Full filter system (text, list, date, numeric, misc).
- Custom filter API.

### Phase 3 — Control Flow Tags
- `if/elif/else`, `for/empty`, `with`, `cycle`, `comment`, `verbatim`.

### Phase 4 — Template Inheritance
- `extends`, `block`, nested blocks.
- `include` for partials.

### Phase 5 — Utilities & Helpers
- `static`, `url`, `regroup`, `spaceless`.

### Phase 6 — Security
- Autoescape, safe strings, escape filter.

### Phase 7 — Extensibility
- Custom tags/filters.
- Context processors.

### Phase 8 — Advanced Features
- Querystring/context passing.
- Template partials with context overrides.
- Error handling.
- Performance optimizations (AST caching).

### Phase 9 — Developer Experience
- Documentation.
- Testing suite.
- Packaging as npm module.
- Example apps.

---

## 🎯 Final Deliverables
- **Engine core**: Lexer, parser, renderer.
- **Filter library**: All Django filters.
- **Tag handlers**: All Django tags.
- **Inheritance system**: Full block/extends support.
- **Express integration**: `app.engine('dtpl', ...)`.
- **Extensibility API**: Custom tags/filters/context processors.
- **Security**: Autoescape + safe strings.
- **Docs & tests**: Full coverage.

