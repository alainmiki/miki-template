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

### Disabling auto-escaping

Use `{% autoescape off %}` to disable escaping for a block:

```html
{% autoescape off %}
  {{ trusted_html }}  {# not escaped #}
{% endautoescape %}
```

### Re-enabling auto-escaping

```html
{% autoescape on %}
  {{ user_input }}  {# escaped again #}
{% endautoescape %}
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

### Checking if a value is safe

```javascript
const { isSafe } = require('miki-template');

if (isSafe(value)) {
  // value is marked safe
}
```

## Escaping Even Safe Content

The `escape` filter forces escaping even on SafeString:

```html
{{ trusted_html|escape }}
```

This matches Django's `{{ value|escape }}` semantics.

## CSRF Protection

Use the `{% csrf_token %}` tag to output a hidden input with the CSRF token:

```html
<form method="post">
  {% csrf_token %}
  ...
</form>
```

The token value is escaped to prevent attribute injection. The output is:

```html
<input type="hidden" name="csrfmiddlewaretoken" value="escaped_token_value">
```

### How it works

- The tag looks for `csrf_token` in the template context.
- If found, it outputs a hidden input with the escaped token value.
- If not found, it outputs an empty hidden input.

Provide `csrf_token` in context:

```javascript
res.render('form', { csrf_token: req.csrfToken() });
```

## CSP Nonce

Use the `{% csp_nonce_attr %}` tag to output a `nonce` attribute when `csp_nonce` is in the context:

```html
<script {% csp_nonce_attr %} src="app.js"></script>
```

If `csp_nonce` is present, the output is:

```html
<script nonce="value" src="app.js"></script>
```

If `csp_nonce` is missing, the tag outputs nothing.

Provide `csp_nonce` in context:

```javascript
res.render('page', { csp_nonce: req.nonce });
```

## Path Traversal Protection

`{% extends %}`, `{% include %}`, and `{% partialdef %}` paths are validated to prevent directory traversal:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
{% partialdef "../../etc/passwd" %} {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories.

## No Unsafe Code Execution

miki-template never uses `eval()`. Expressions are parsed and evaluated safely using the AST. This prevents code injection attacks.

## HTML Escaping Details

miki-template uses the `he` library for HTML escaping, which converts:

| Character | Escaped |
|-----------|---------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#x27;` |
| ``` ` ``` | `&#96;` |

## Context Processor Security

Context processors run before every render and can inject global variables. Be careful not to expose sensitive data:

```javascript
const { registerContextProcessor } = require('miki-template');

registerContextProcessor((context) => {
  return {
    siteName: 'My App',
    // Don't inject secrets here - they'll be available in all templates
  };
});
```

## Next Steps

- [Integrations](../integrations/)
- [API Reference: Security](../api/security)
