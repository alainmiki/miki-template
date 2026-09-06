# Security

miki-template is secure by default. It follows Django's security semantics to protect against common web vulnerabilities.

## Auto-Escaping

All variable output is HTML-escaped by default:

```html
{{ user_input }}
```

If `user_input` is `<script>alert(1)</script>`, the output is:

```html
&lt;script&gt;alert(1)&lt;/script&gt;
```

## SafeString

Use the `safe` filter or `markSafe()` to mark content as trusted:

```html
{{ trusted_html|safe }}
```

```javascript
const { markSafe } = require('miki-template');

const html = markSafe('<b>ok</b>');
// Will not be escaped
```

## Escaping Even Safe Content

The `escape` filter forces escaping even on SafeString:

```html
{{ trusted_html|escape }}
```

## CSRF Protection

Use the `{% csrf_token %}` tag to output a hidden input with the CSRF token:

```html
<form method="post">
  {% csrf_token %}
  ...
</form>
```

The token value is escaped to prevent attribute injection.

## CSP Nonce

Use the `{% csp_nonce_attr %}` tag to output a `nonce` attribute when `csp_nonce` is in the context:

```html
<script {% csp_nonce_attr %} src="app.js"></script>
```

If `csp_nonce` is missing, the tag outputs nothing.

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

## No Unsafe Code Execution

miki-template never uses `eval()`. Expressions are parsed and evaluated safely using the AST.

## Next Steps

- [Integrations](../integrations/)
- [API Reference](../api/)
