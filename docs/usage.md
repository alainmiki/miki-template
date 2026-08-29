# Usage

```js
const { render, compile } = require('miki-template');

// Simple render (one‑off)
const output = render('Hello {{ name }}!', { name: 'World' });
console.log(output); // "Hello World!"

// Compile for repeated rendering / block rendering
const tpl = `
{% extends "base.html" %}
{% block content %}
  <h1>{{ title }}</h1>
  {% for item in items %}
    <li>{{ item }}</li>
  {% empty %}
    <li>No items</li>
  {% endfor %}
{% endblock %}
`;

const compiled = compile(tpl, { views: './templates' });

// Render full template
console.log(compiled.render({ title: 'Demo', items: [1,2,3] }));

// Render a single block (HTMX style)
console.log(compiled.renderBlock('content', { title: 'Demo', items: [] }));
```

## Key API surface
| Function | Description |
|---|---|
| `render(templateString, context, options?)` | One‑off rendering. |
| `compile(templateString, options?)` | Returns an object with `render(context)`, `renderBlock(blockName, context)`, `renderPartial(name, context)`. |
| `registerTag(name, parserFn)` | Add custom tags. |
| `registerFilter(name, fn)` | Add custom filters. |
| `markSafe(value)` | Mark a value as safe to bypass auto‑escaping. |

---

> Full usage guide located at `c:/Users/Coder Miki/Desktop/miki-template/docs/usage.md`.
