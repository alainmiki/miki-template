# Security



miki-template follows Django's security semantics to protect against common web vulnerabilities.



## Table of Contents



- [Auto-Escaping](#auto-escaping)

- [SafeString](#safestring)

- [CSRF Protection](#csrf-protection)

- [CSP Nonce](#csp-nonce)

- [Path Traversal Protection](#path-traversal-protection)

- [No Unsafe Code Execution](#no-unsafe-code-execution)

- [HTML Escaping Details](#html-escaping-details)

- [Context Processor Security](#context-processor-security)



---



## Auto-Escaping



All variable output is HTML-escaped by default. This means any `<`, `>`, `&`, `"`, `'`, and `` ` `` characters in your data are converted to HTML entities before rendering.



```html

{{ user_input }}

```



If `user_input` is `<script>alert(1)</script>`, the output is:



```html

&lt;script&gt;alert(&quot;1&quot;)&lt;/script&gt;

```



This prevents XSS (Cross-Site Scripting) attacks where malicious users inject executable JavaScript.



### Disabling Auto-Escaping



Use `{% autoescape off %}` to disable escaping for a block:



```html

{% autoescape off %}

  {{ trusted_html }}  {# not escaped #}

{% endautoescape %}

```



### Re-enabling Auto-Escaping



```html

{% autoescape on %}

  {{ user_input }}  {# escaped again #}

{% endautoescape %}

```



**Real-world blog post:**



```html

<article>

  <!-- Post body is trusted CMS content -->

  {% autoescape off %}

    {{ post.body_html }}

  {% endautoescape %}



  <!-- User comment is untrusted -->

  <div class="comments">

    {% for comment in comments %}

      <p>{{ comment.text }}</p>

    {% endfor %}

  </div>

</article>

```



## SafeString



Use the `safe` filter or `markSafe()` to mark content as trusted (bypassing auto-escaping):



=== "Template (safe filter)"



    ```html

    {{ trusted_html|safe }}

    ```



=== "CommonJS (markSafe)"



    ```javascript

    const { markSafe } = require('miki-template');



    const html = markSafe('<b>ok</b>');

    // Will not be escaped when rendered

    ```



=== "ES Modules (markSafe)"



    ```javascript

    import { markSafe } from 'miki-template';



    const html = markSafe('<b>ok</b>');

    ```



### SafeString Class



You can also create `SafeString` instances directly:



=== "CommonJS"



    ```javascript

    const { SafeString } = require('miki-template');



    const html = new SafeString('<b>Bold</b>');

    // {{ html }} renders as <b>Bold</b>, NOT &lt;b&gt;Bold&lt;/b&gt;

    ```



=== "ES Modules"



    ```javascript

    import { SafeString } from 'miki-template';



    const html = new SafeString('<b>Bold</b>');

    ```



### Checking if a value is safe



=== "CommonJS"



    ```javascript

    const { isSafe } = require('miki-template');



    if (isSafe(value)) {

      // value is marked safe

    }

    ```



=== "ES Modules"



    ```javascript

    import { isSafe } from 'miki-template';



    if (isSafe(value)) {

      // value is marked safe

    }

    ```



## HTML Filters



### safe



Mark a string as safe (no escaping):



```html

{{ content|safe }}

```



### escape



Force HTML escaping, even on SafeString values. This matches Django's `{{ value|escape }}` semantics:



```html

<!-- Even if content is marked safe, escape forces HTML entities -->

{{ content|escape }}

```



**Real-world: render user-generated content with a safe wrapper**



```html

<!-- In a filter -->

{{ user.bio|default:"No bio yet."|escape }}

```



## CSRF Protection



Use the `{% csrf_token %}` tag to output a hidden input with the CSRF token:



```html

<form method="post">

  {% csrf_token %}

  <button type="submit">Submit</button>

</form>

```



The token value is HTML-escaped to prevent attribute injection. The output is:



```html

<input type="hidden" name="csrfmiddlewaretoken" value="escaped_token_value">

```



### How it works



- The tag looks for `csrf_token` in the template context.

- If found, it outputs a hidden input with the escaped token value.

- If not found, it outputs an empty hidden input.



Provide `csrf_token` in context:



=== "CommonJS (Express + csurf)"



    ```javascript

    const csrf = require('csurf');



    app.use(csrf({ cookie: true }));

    app.use((req, res, next) => {

      res.locals.csrf_token = req.csrfToken();

      next();

    });

    ```



=== "ES Modules"



    ```javascript

    app.use((req, res, next) => {

      res.locals.csrf_token = req.csrfToken();

      next();

    });

    ```



## CSP Nonce



Use the `{% csp_nonce_attr %}` tag to output a `nonce` attribute when `csp_nonce` is in the context. This is essential for Content-Security-Policy-compliant inline scripts:



```html

<script {% csp_nonce_attr %} src="/js/app.js"></script>

```



If `csp_nonce` is present in context, the output is:



```html

<script nonce="abc123" src="/js/app.js"></script>

```



If `csp_nonce` is missing, the tag outputs nothing — the `<script>` tag is rendered without a nonce.



Provide `csp_nonce` in context:



=== "CommonJS"



    ```javascript

    app.use((req, res, next) => {

      res.locals.csp_nonce = crypto.randomBytes(16).toString('base64');

      next();

    });

    ```



=== "ES Modules"



    ```javascript

    import crypto from 'node:crypto';



    app.use((req, res, next) => {

      res.locals.csp_nonce = crypto.randomBytes(16).toString('base64');

      next();

    });

    ```



## Path Traversal Protection



`{% extends %}`, `{% include %}`, and `{% extends %}` paths are validated to prevent directory traversal attacks:



```html

{% extends "../../etc/passwd" %}  {# REJECTED #}

{% include "../../secrets" %}      {# REJECTED #}

```



The engine checks that resolved paths stay within the allowed views directories. An error with message starting with `path traversal` is thrown if the resolved path escapes the views root.



## No Unsafe Code Execution



miki-template never uses `eval()`. Expressions are parsed and evaluated safely using the AST-based expression evaluator. This prevents code injection attacks — template expressions like `{{ user.name }}` are resolved through property lookups, never by executing arbitrary JavaScript.



## HTML Escaping Details



miki-template uses the [`he`](https://github.com/mathiasbynetworks/he) library for HTML escaping, which converts:



| Character | Escaped |

|-----------|---------|

| `&` | `&amp;` |

| `<` | `&lt;` |

| `>` | `&gt;` |

| `"` | `&quot;` |

| `'` | `&#x27;` |

| `` ` `` | `&#96;` |



```javascript

// Access escaping directly

const { escapeHtml } = require('miki-template');

// or

import { escapeHtml } from 'miki-template';



const escaped = escapeHtml('<script>alert("xss")</script>');

// → "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"



// Force-escape even SafeString values (third argument)

const reescaped = escapeHtml(safeStringInstance, true);

```



### Programmatic Escaping



=== "CommonJS"



    ```javascript

    const { escapeHtml } = require('miki-template');



    const escaped = escapeHtml('<script>');

    // Output: &lt;script&gt;

    ```



=== "ES Modules"



    ```javascript

    import { escapeHtml } from 'miki-template';



    const escaped = escapeHtml('<script>');

    // Output: &lt;script&gt;

    ```



## Context Processor Security



Context processors run before every render and can inject global variables. Be careful not to expose sensitive data:



=== "CommonJS"



    ```javascript

    const { registerContextProcessor } = require('miki-template');



    registerContextProcessor((context) => {

      return {

        siteName: 'My App',

        // Don't inject secrets here - they'll be available in ALL templates

      };

    });

    ```



=== "ES Modules"



    ```javascript

    import { registerContextProcessor } from 'miki-template';



    registerContextProcessor((context) => {

      return {

        siteName: 'My App',

      };

    });

    ```



**Key behavior:** Context processor values respect Django semantics — existing context values **win** over processor defaults. If you render with `{ user: req.user }` and a processor returns `{ user: 'Guest' }`, the explicit `req.user` is preserved.



## Next Steps



- [Integrations](../integrations/index.md)

- [API Reference: Security](../api/security.md)

