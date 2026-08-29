# Security

`miki-template` is built with **secure defaults**. All variables are **auto‑escaped** unless explicitly marked safe.

## Auto‑escaping
- Every string output goes through `escapeHtml` before being concatenated.
- Use the `|safe` filter or `markSafe(value)` to bypass escaping when you trust the data.

## CSRF Protection
- The `{% csrf_token %}` tag renders a hidden `<input>` containing the `csrf_token` value from the rendering context.
- Example:
  ```html
  <form method="post">{% csrf_token %} ... </form>
  ```
- It is a thin wrapper; you must generate and store `csrf_token` in your Express middleware.

## CSP Nonce
- `{% csp_nonce_attr %}` injects `nonce="{{ csp_nonce }}"` when `csp_nonce` is present in the context.
- Useful for inline scripts when you have a CSP policy with `script-src 'nonce-...';`.

## SafeString Wrapper
- Filters returning `SafeString` bypass auto‑escaping. The wrapper is applied automatically by the `safe` filter.

## No `eval`
- Template expressions are parsed into an AST and evaluated using a sandboxed evaluator that **never calls `eval` or `new Function`**.

> Security‑related code lives in `src/security.js` and the tag implementations in `src/tags/control.js`.
