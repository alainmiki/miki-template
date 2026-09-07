# Installation

Complete guide to installing and verifying miki-template in different environments.

## Requirements

- **Node.js** 18.x or 20.x (Node 18+ required for `URL`, `fetch`, and other Web API globals used by the engine)
- **npm** 9+, **pnpm**, or **yarn**
- **Bun** (optional) — miki-template is fully compatible with Bun

## Install via npm

```bash
npm install miki-template
```

## Install via pnpm

```bash
pnpm add miki-template
```

## Install via yarn

```bash
yarn add miki-template
```

## Install via Bun

```bash
bun add miki-template
```

## Package.json `"type"` Considerations

miki-template ships a dual CommonJS/ESM package:

- **CommonJS** entry: `src/index.js` — importable via `require('miki-template')` or `import` (Node auto-detects the `import` condition).
- **ESM** entry: `src/esm.mjs` — importable via `import ... from 'miki-template'`.

| Your project uses | How to import |
|---|---|
| CommonJS (`"type": "commonjs"` or no `type` field) | `const miki = require('miki-template')` |
| ES Modules (`"type": "module"`) | `import miki from 'miki-template'` or `import { render } from 'miki-template'` |
| TypeScript /Bun | Same as ESM — `import` syntax works directly |

> **Tip:** If your project is ESM-only (no `"type"` field but using `.mjs` files), use named imports: `import { render, compile } from 'miki-template'`.

## Verifying the Installation

=== "CommonJS"

    ```javascript
    const miki = require('miki-template');
    console.log(miki.render('Hello {{ name }}!', { name: 'World' }));
    // Output: Hello World!
    ```

=== "ES Modules"

    ```javascript
    import { render } from 'miki-template';
    console.log(render('Hello {{ name }}!', { name: 'World' }));
    // Output: Hello World!
    ```

=== "Bun / TypeScript"

    ```typescript
    import { render } from 'miki-template';
    console.log(render('Hello {{ name }}!', { name: 'World' }));
    // Output: Hello World!
    ```

## Troubleshooting

### "Cannot find module 'miki-template'"

Ensure the package is installed in the correct `node_modules` directory. If you're working in a monorepo, run `npm install` from the package root.

### Auto-escaping produces `&amp;` where you expect `&`

This is by design — miki-template escapes all variables by default to prevent XSS. Use `|safe` or `markSafe()` for trusted HTML:

```html
{{ htmlContent|safe }}
```

See [Security param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'security.md.md'  for details.

## Next Steps

- [Quick Start param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'quick-start.md.md' 
- [What is miki-template? param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'what-is-miki-template.md.md' 
