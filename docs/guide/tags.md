# Tags



Tags control template logic and structure. They use `{% %}` syntax.



## Table of Contents



- [Control Flow](#control-flow)

- [Variable Assignment](#variable-assignment)

- [Change Detection](#change-detection)

- [Date and Time](#date-and-time)

- [Utility Tags](#utility-tags)

- [Security Tags](#security-tags)

- [Comments and Raw Output](#comments-and-raw-output)

- [Autoescape](#autoescape)

- [Library Loading](#library-loading)

- [Template Tags](#template-tags)

- [Inheritance Tags](#inheritance-tags)

- [Partial Tags](#partial-tags)

- [i18n Tags](#i18n-tags)



---



## Control Flow



### if / elif / else / endif



Conditional rendering with a wide range of operators.



=== "Basic if"



    ```html

    {% if user.is_authenticated %}

      <p>Welcome back, {{ user.name }}!</p>

    {% else %}

      <p>Please <a href="/login">log in</a>.</p>

    {% endif %}

    ```



=== "Multiple conditions with elif"



    ```html

    {% if user.role == 'admin' %}

      <p>Admin panel</p>

    {% elif user.is_staff %}

      <p>Staff dashboard</p>

    {% else %}

      <p>Guest view</p>

    {% endif %}

    ```



=== "Combined conditions with parentheses"



    ```html

    {% if (user.role == 'admin' or user.is_staff) and user.is_active %}

      <p>Active staff member</p>

    {% endif %}



    {% if item not in cart_items %}

      <button>Add to cart</button>

    {% endif %}

    ```



**Supported operators:** `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `and`, `or`, `not`



**Operator precedence** (highest to lowest): comparison → `and` → `or`



### for / empty / endfor



Loop over arrays and objects. Injects `forloop` meta tracking.



=== "Basic loop"



    ```html

    <ul>

    {% for item in items %}

      <li>{{ forloop.counter }}: {{ item }}</li>

    {% empty %}

      <li>No items found</li>

    {% endfor %}

    </ul>

    ```



=== "Loop with filters"



    ```html

    {% for group in items|regroup:"category" %}

      <h3>{{ group.grouper }}</h3>

      {% for item in group.list %}- {{ item.name }}

      {% endfor %}

    {% endfor %}

    ```



=== "Dictionary iteration"



    ```html

    {% for key, value in config %}

      <dt>{{ key }}</dt>

      <dd>{{ value }}</dd>

    {% endfor %}

    ```



=== "Nested loops"



    ```html

    {% for department in departments %}

      <h2>{{ department.name }}</h2>

      {% for employee in department.employees %}

        <span>#{{ forloop.parentloop.counter }}.{{ forloop.counter }} {{ employee.name }}</span>

      {% endfor %}

    {% endfor %}

    ```



#### forloop Metadata



| Variable | Description |

|----------|-------------|

| `forloop.counter` | 1-based index |

| `forloop.counter0` | 0-based index |

| `forloop.revcounter` | Reverse 1-based index |

| `forloop.revcounter0` | Reverse 0-based index |

| `forloop.first` | `true` on first iteration |

| `forloop.last` | `true` on last iteration |

| `forloop.parentloop` | Parent loop context (nested loops) |



**Real-world table with alternating row classes:**



```html

<table>

{% for row in rows %}

  <tr class="{% cycle 'row-odd' 'row-even' %}">

    <td>{{ row.name }}</td>

    <td>{{ row.value }}</td>

  </tr>

{% endfor %}

</table>

```



### with / endwith



Scope localized variables.



=== "Alias a variable"



    ```html

    {% with user.profile.address as addr %}

      <p>{{ addr.city }}, {{ addr.zip }}</p>

    {% endwith %}

    ```



=== "Multiple assignments"



    ```html

    {% with greeting="Hello", who="World" %}

      <p>{{ greeting }} {{ who }}</p>

    {% endwith %}

    ```



=== "Combined alias"



    ```html

    {% with a=5, b=10 as total %}

      <p>Total: {{ total }}</p>

    {% endwith %}

    ```



### cycle



Cycle through values sequentially.



=== "Alternating CSS classes"



    ```html

    {% for row in rows %}

      <tr class="{% cycle 'row-odd' 'row-even' %}">...</tr>

    {% endfor %}

    ```



=== "Store without output (as)"



    ```html

    {% cycle 'row-odd' 'row-even' as row_class %}

    <tr class="{{ row_class }}">

    ```



=== "Named cycle for resumable state"



    ```html

    {% for item in items %}

      {% cycle 'a' 'b' 'c' as marker silent %}

      {% if marker == 'b' %}

        <strong>{{ item }}</strong>

      {% else %}

        {{ item }}

      {% endif %}

    {% endfor %}

    ```



### firstof



Return the first truthy value.



```html

{% firstof user.display_name user.username "Anonymous" %}

```



---



## Variable Assignment



### set



Assign a value to a variable.



=== "Inline assignment"



    ```html

    {% set total = price * quantity %}

    <p>Total: ${{ total|floatformat:2 }}</p>

    ```



=== "Block form (captures rendered output)"



    ```html

    {% set greeting %}

      Hello {{ user.name|title }}, welcome to {{ site.name }}!

    {% endset %}



    <h1>{{ greeting|safe }}</h1>

    ```



=== "Multiple variables"



    ```html

    {% set tax_rate = 0.08, tax = subtotal|mult:tax_rate %}

    ```



Variables set with `{% set %}` persist in the current scope and can be used after the tag.



---



## Change Detection



### ifchanged / endifchanged



Render the body only when a value changes.



=== "Basic (no argument)"



    ```html

    {% for item in changelog %}

      {% ifchanged item.timestamp %}

        <h3>{{ item.timestamp|date:"Y-m-d" }}</h3>

      {% endifchanged %}

      <p>{{ item.change }}</p>

    {% endfor %}

    ```



=== "With else"



    ```html

    {% for item in items %}

      {% ifchanged item.category %}

        <h2>{{ item.category }}</h2>

      {% else %}

        <p>Same category as above</p>

      {% endifchanged %}

    {% endfor %}

    ```



---



## Date and Time



### now



Output the current date/time.



```html

<p>Current time: {% now "Y-m-d H:i:s" %}</p>

<p>Pretty date: {% now "F j, Y" %}</p>

```



Uses the same format codes as the `date` filter (Django-style tokens like `Y`, `m`, `d`, `H`, `i`, `s`, `F`).



**Real-world copyright footer:**



```html

<footer>

  &copy; {{ "now"|date:"Y" }} {{ site.name }}. All rights reserved.

</footer>

```



---



## Utility Tags



### static



Generate a static file URL.



```html

<link rel="stylesheet" href="{% static "css/main.css" %}">

<script src="{% static "js/app.js" %}"></script>

<img src="{% static "images/logo.svg" }}" alt="{{ site.name }}">

```



Configure the prefix at compile time:



=== "CommonJS"



    ```javascript

    const { compile } = require('miki-template');

    const template = compile(source, { staticUrl: '/assets/' });

    ```



=== "ES Modules"



    ```javascript

    import { compile } from 'miki-template';

    const template = compile(source, { staticUrl: '/assets/' });

    ```



### url



Build a URL from a route name.



=== "Basic"



    ```html

    <a href="{% url 'user.profile' user.id %}">Profile</a>

    ```



=== "With keyword arguments"



    ```html

    {% url 'posts.show' post.id tab='comments' %}

    ```



=== "Deep routing with dots"



    ```html

    {% url 'user.profile.posts.show' user.id post.id %}

    ```



Configure with a custom resolver:



=== "CommonJS"



    ```javascript

    const { compile } = require('miki-template');

    const template = compile(source, {

      urlHelper: (routeName, ...args) => {

        // Convert "user.profile" + [42] → "/user/profile/42"

        return '/' + routeName.split('.').join('/') + '/' + args.join('/');

      }

    });

    ```



=== "ES Modules"



    ```javascript

    import { compile } from 'miki-template';

    const template = compile(source, {

      urlHelper: (routeName, ...args) => {

        return '/' + routeName.split('.').join('/') + '/' + args.join('/');

      }

    });

    ```



### regroup



Group a list by a common attribute.



```html

{% regroup people by gender as departments %}

{% for dept in departments %}

  <h3>{{ dept.grouper }}</h3>

  {% for person in dept.list %}

    <p>{{ person.name }}</p>

  {% endfor %}

{% endfor %}

```



You can also use `regroup` as a filter inside a `{% for %}` loop:



```html

{% for group in items|regroup:"category" %}

  <h3>{{ group.grouper }}</h3>

  {% for item in group.list %}

    <p>{{ item.name }}</p>

  {% endfor %}

{% endfor %}

```



### spaceless



Remove whitespace between HTML tags.



```html

{% spaceless %}

  <div>

    <span>  hello  </span>

  </div>

{% endspaceless %}

```



Output: `<div><span>  hello  </span></div>`



### widthratio



Calculate ratios for progress bars or scaling.



```html

<!-- Calculate 25 out of 100 scaled to max-width 150 -->

{% widthratio score 100 150 %}

<!-- → 37 (floor of 25/100*150) -->



<!-- Progress bar width -->

<div class="bar" style="width: {% widthratio value max_value 100 %}px;"></div>

```



### debug



Dump the current template context for debugging.



```html

{% debug %}

```



Outputs a `<pre>` block with all context variables.



---



## Security Tags



### csrf_token



Output a hidden CSRF token input.



```html

<form method="post">

  {% csrf_token %}

  <button type="submit">Submit</button>

</form>

```



The token value is HTML-escaped to prevent attribute injection. Requires `csrf_token` to be present in the template context.



=== "CommonJS (Express middleware)"



    ```javascript

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



### csp_nonce_attr



Output a `nonce` attribute when `csp_nonce` is in the context.



```html

<script {% csp_nonce_attr %} src="/js/app.js"></script>

```



If `csp_nonce` is present in context, the output is:



```html

<script nonce="abc123" src="/js/app.js"></script>

```



If `csp_nonce` is not present, the tag outputs nothing.



---



## Comments and Raw Output



### comment / endcomment



Block comments ignored during parsing.



```html

{% comment %}

  This is a comment.

  It can span multiple lines.

{% endcomment %}

```



### verbatim / endverbatim



Treat content as raw text — template syntax is not parsed.



```html

{% verbatim %}

  This will NOT be parsed: {{ user.name }}

  And this won't either: {% if x %}

{% endverbatim %}

```



You can also name a verbatim block:



```html

{% verbatim myscript %}

  {{ angularExpression }}

{% endverbatim %}

```



---



## Autoescape



Control HTML escaping for a block.



```html

{% autoescape on %}

  {{ user_input }}  {# escaped → &lt;script&gt;... #}

{% endautoescape %}



{% autoescape off %}

  {{ trusted_html }}  {# not escaped → raw HTML #}

{% endautoescape %}

```



---



## Library Loading



### load



Activate a template library. Built-in libraries (`humanize`, `cache`, `lorem`) are auto-activated — you only need `{% load %}` for custom libraries you've registered.



```html

{% load humanize %}

{{ views|intcomma }}

{{ count|ordinal }}

```



=== "CommonJS (registering a library)"



    ```javascript

    const { registerLibrary } = require('miki-template');



    registerLibrary('myutils', {

      filters: {

        shout: (val) => String(val).toUpperCase() + '!'

      }

    });

    ```



=== "ES Modules"



    ```javascript

    import { registerLibrary } from 'miki-template';



    registerLibrary('myutils', {

      filters: {

        shout: (val) => String(val).toUpperCase() + '!'

      }

    });

    ```



Then use in templates:



```html

{% load myutils %}

{{ name|shout }}

```



**Built-in libraries:**



- `i18n` — `{% trans %}`, `{% blocktrans %}`, `{% language %}`

- `humanize` — `intcomma`, `intword`, `apnumber`, `ordinal`, `naturalday`

- `cache` — `{% cache timeout key %}...{% endcache %}`

- `lorem` — `{% lorem %}` tag and `lorem` filter



---



## Template Tags



### templatetag



Output literal template tag tokens. Useful when generating documentation or when the template syntax conflicts with another templating layer.



```html

{% templatetag openblock %} if user.is_admin {% templatetag closeblock %}

<!-- Renders: {% if user.is_admin %} -->



{% templatetag openvariable %} name {% templatetag closevariable %}

<!-- Renders: {{ name }} -->

```



Available tokens:



| Token | Output |

|-------|--------|

| `openblock` | `{%` |

| `closeblock` | `%}` |

| `openvariable` | `{{` |

| `closevariable` | `}}` |

| `openbrace` | `{` |

| `closebrace` | `}` |

| `opencomment` | `{#` |

| `closecomment` | `#}` |



---



## Inheritance Tags



### extends



Inherit from a parent template.



```html

{% extends "base.html" %}

```



Can use expressions for dynamic parent selection:



```html

{% extends device|default:"desktop/base.html" %}

```



**Security:** Path traversal is blocked — `{% extends "../../etc/passwd" %}` is rejected.



### block / endblock



Define a block that can be overridden by child templates.



```html

<!-- base.html -->

<html>

  <body>

    {% block content %}Default content{% endblock %}

  </body>

</html>

```



```html

<!-- child.html -->

{% extends "base.html" %}

{% block content %}

  <h1>Child content</h1>

  {{ block.super }}

{% endblock %}

```



### block.super



A special variable (not a tag). When used inside a `{% block %}`, it renders the parent template's version of that block.



See [Template Inheritance](template-inheritance.md) for a detailed guide.



### include



Include another template's content inline.



```html

{% include "header.html" %}

{% include "header.html" with title="Hello" %}

{% include "header.html#partial_name" %}

{% include "header.html" with title="Hello" %}

```



**Security:** Path traversal is blocked.



---



## Partial Tags



### partialdef / endpartialdef



Define a reusable partial block.



```html

{% partialdef card %}

  <div class="card">

    <h3>{{ title|default:"Untitled" }}</h3>

    <p>{{ body|truncatewords:30 }}</p>

    {% if featured %}<em>Featured</em>{% endif %}

  </div>

{% endpartialdef %}

```



**Options:**



| Option | Description |

|--------|-------------|

| `inline` | Renders the definition inline at its location during parse (the body appears in output AND registers for later use). |



```html

{% partialdef greeting inline %}

  Hello {{ name }}!

{% endpartialdef %}

<!-- Above line ALSO outputs "Hello World!" when rendered -->

```



**Programmatic access:**



=== "CommonJS"



    ```javascript

    const { compile } = require('miki-template');

    const compiled = compile(template);

    compiled.renderPartial('card', { title: 'Hi', body: 'There' });

    ```



=== "ES Modules"



    ```javascript

    import { compile } from 'miki-template';

    const compiled = compile(template);

    compiled.renderPartial('card', { title: 'Hi', body: 'There' });

    ```



### partial



Render a named partial.



```html

{% partial card %}

{% partial card with title="Custom" body="World" %}

{% partial greeting with name=user.name %}

```



See [Partial Templates](partial-templates.md) for a detailed guide.



---



## i18n Tags



### trans



Translate a string.



```html

{% trans "Hello, world!" %}

{% trans "Hello, %s!" name=user.name %}

{% trans context "verb" "He runs" %}

```



### blocktrans / endblocktrans



Translate a block of text with variable interpolation and pluralization.



```html

{% blocktrans with name=user.name %}

  Hello, {{ name }}!

{% endblocktrans %}



{% blocktrans count items|length %}

  {{ count }} item

{% plural %}

  {{ count }} items

{% endblocktrans %}

```



### language / endlanguage



Switch language temporarily for a block.



```html

{% language "fr" %}

  {% trans "Hello" %} → renders in French

{% endlanguage %}

```



---



## Next Steps



- [Filters](./filters.md)

- [Template Inheritance](./template-inheritance.md)

- [Partial Templates](./partial-templates.md)

- [Custom Tags](./custom-tags.md)

