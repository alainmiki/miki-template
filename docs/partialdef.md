# Partial Definition (`partialdef`)

`partialdef` is the cornerstone feature that brings Django‑style **named template fragments** to Node.js. It allows you to define a reusable block once and render it multiple times, optionally **inline** for immediate output.

## Syntax
```html
{% partialdef name [inline] %}
  ...template code...
{% endpartialdef %}
```
- `name` – identifier used with `{% partial name %}`.
- Optional `inline` – if present, the block is rendered **where it is defined**; no separate `{% partial %}` call is required.

## Rendering a Partial
```html
{% partial greeting %}
```
The engine looks up the definition in the current rendering **Context** (`context.partialDefs`) and injects the rendered output.

## API Usage
```js
const tpl = `{% partialdef api %}API {{ data }}{% endpartialdef %}`;
const compiled = compile(tpl);
const out = compiled.renderPartial('api', { data: 123 }); // "API 123"
```

## Features
- **Full tag parity** – conditionals (`if`), loops (`for`), variable scoping (`with`) work inside a `partialdef`.
- **Nested partials** – you can define a partial inside another; inner definitions are registered first and can be used by the outer.
- **Scope isolation** – each rendering of a partial receives its own scope, mirroring Django’s behavior.
- **Inline rendering** – render inline without an extra `{% partial %}` tag (`{% partialdef foo inline %}…{% endpartialdef %}`).
- **Performance** – partials are compiled once per template; subsequent renders reuse the compiled AST.

## Common Pitfalls
| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing partial name | `{% partial %}` renders nothing | Ensure the name matches a defined `partialdef`. |
| Variable not found | Appears empty | Variables are resolved in the current context; use `{% with %}` inside the partial if you need a local alias. |
| Inline vs non‑inline confusion | Duplicate output | Use `inline` only when you want immediate rendering. |

> Implementation lives in `src/tags/control.js` (class `PartialDefNode` and `PartialNode`).
