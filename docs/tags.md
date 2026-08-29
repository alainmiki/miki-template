# Tags Reference

This document enumerates every built‑in control tag provided by **miki-template** and mirrors the style of Django's tag reference.

| Tag | Description | Syntax |
|-----|-------------|--------|
| `if / elif / else / endif` | Conditional rendering. Supports `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `and`, `or`, `not`. | `{% if condition %} … {% elif other %} … {% else %} … {% endif %}` |
| `for / empty / endfor` | Loop over arrays or objects. Provides `forloop` metadata (`counter`, `first`, `last`). | `{% for item in items %} … {% empty %} … {% endfor %}` |
| `with / endwith` | Creates a scoped alias for a variable or expression. | `{% with user.profile as profile %} … {% endwith %}` |
| `cycle` | Cycles through a list of values each iteration. | `{% cycle 'odd' 'even' %}` |
| `comment / endcomment` | Block comment – ignored during parsing. | `{% comment %} … {% endcomment %}` |
| `verbatim / endverbatim` | Render raw text without parsing tags/variables. | `{% verbatim %} {% raw {{ not parsed }} %} {% endverbatim %}` |
| `include` | Inserts another template file at render time. Relative to the `views` directory. | `{% include "header.html" %}` |
| `extends` | Declares template inheritance – must be the first tag in a file. | `{% extends "base.html" %}` |
| `block / endblock` | Defines a replaceable block for inheritance. Supports `{{ block.super }}`. | `{% block content %} … {% endblock %}` |
| `partialdef` | Defines a reusable fragment that can be rendered later via `{% partial name %}`. Supports optional `inline` flag. | `{% partialdef name [inline] %} … {% endpartialdef %}` |
| `partial` | Renders a previously defined partial. | `{% partial name %}` |

### Advanced notes
- **Nested tags** are fully supported; you can place any control tag inside another (e.g., `if` inside `for`).
- **Partial definitions** are evaluated before any `{% partial %}` tags, ensuring they are available during rendering.
- **Inheritance order**: `extends` → `{% block %}` → `{{ block.super }}` → child overrides.

> All tag implementations live under `src/tags/` – see `control.js`, `inheritance.js`, and `util.js` for the source code.
