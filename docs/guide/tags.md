# Tags

Tags control template logic and structure. They use `{% %}` syntax.

## Control Flow

### if / elif / else / endif

```html
{% if user.role == 'admin' %}
  <p>Admin panel</p>
{% elif user.is_staff %}
  <p>Staff dashboard</p>
{% else %}
  <p>Guest view</p>
{% endif %}
```

Supported operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `and`, `or`, `not`.

You can combine operators with parentheses for grouping:

```html
{% if (user.role == 'admin' or user.is_staff) and user.is_active %}
  <p>Active staff</p>
{% endif %}
```

Operator precedence (highest to lowest): comparison → `and` → `or`

```html
{% if user.age >= 18 and user.is_verified %}
  <p>Eligible to vote.</p>
{% endif %}

{% if item not in cart_items %}
  <button>Add to cart</button>
{% endif %}
```

### for / empty / endfor

```html
{% for item in items %}
  <li>{{ item }}</li>
{% empty %}
  <li>No items found</li>
{% endfor %}
```

The loop supports filters on the iterable:

```html
{% for group in items|regroup:"category" %}
  <h3>{{ group.grouper }}</h3>
{% endfor %}
```

#### forloop Metadata

Inside a `{% for %}` loop, use `forloop`:

| Variable | Description |
|----------|-------------|
| `forloop.counter` | 1-based index |
| `forloop.counter0` | 0-based index |
| `forloop.revcounter` | Reverse 1-based index |
| `forloop.revcounter0` | Reverse 0-based index |
| `forloop.first` | True on first iteration |
| `forloop.last` | True on last iteration |
| `forloop.parentloop` | Parent loop context (nested loops) |

#### Dictionary iteration

```html
{% for key, value in dict %}
  <p>{{ key }}: {{ value }}</p>
{% endfor %}
```

#### Nested loops

```html
{% for outer in outers %}
  {% for inner in outer.items %}
    {{ forloop.parentloop.counter }}.{{ forloop.counter }}: {{ inner }}
  {% endfor %}
{% endfor %}
```

### with / endwith

Scope a variable alias or assignment:

```html
{% with user.profile.address as addr %}
  <p>{{ addr.city }}, {{ addr.zip }}</p>
{% endwith %}
```

Multiple assignments:

```html
{% with greeting="Hello", who="World" %}
  <p>{{ greeting }} {{ who }}</p>
{% endwith %}
```

Combined alias:

```html
{% with greeting="Hello", who="World" as msg %}
  <p>{{ msg }}</p>
{% endwith %}
```

### cycle

Cycle through values on each iteration:

```html
{% for row in rows %}
  <tr class="{% cycle 'row-odd' 'row-even' %}">...</tr>
{% endfor %}
```

With `as` to store without output:

```html
{% cycle 'row-odd' 'row-even' as row_class %}
<tr class="{{ row_class }}">
```

Named cycle for resumable state:

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

Return the first truthy value:

```html
{% firstof var1 var2 var3 "fallback" %}
```

## Variable Assignment

### set

Assign a value to a variable:

```html
{% set total = price * quantity %}
{% set greeting %}Hello {{ name }}{% endset %}
```

Variables set with `{% set %}` persist in the current scope and can be used after the tag.

## Change Detection

### ifchanged / endifchanged

Render body only when value changes:

```html
{% for item in items %}
  {% ifchanged item.category %}
    <h2>{{ item.category }}</h2>
  {% endifchanged %}
  <p>{{ item.name }}</p>
{% endfor %}
```

With `else`:

```html
{% for item in items %}
  {% ifchanged item.category %}
    <h2>{{ item.category }}</h2>
  {% else %}
    <p>Same category</p>
  {% endifchanged %}
{% endfor %}
```

## Date and Time

### now

Output the current date/time:

```html
{% now "Y-m-d H:i:s" %}
{% now "F j, Y" %}
```

Uses the same format codes as the `date` filter.

## Utility Tags

### static

Generate a static file URL:

```html
{% static "css/style.css" %}
```

Configure the prefix:

```javascript
compile(template, { staticUrl: '/assets/' });
```

### url

Build a URL from a route name:

```html
{% url 'user.profile' user.id %}
{% url 'posts.show' post.id tab='comments' %}
```

Deep routing with dots:

```html
{% url 'user.profile.posts.show' user.id post.id %}
```

Configure:

```javascript
compile(template, {
  urlHelper: (name, ...args) => {
    // return resolved URL string
  }
});
```

### regroup

Group a list by a common attribute:

```html
{% regroup users by department as departments %}
{% for dept in departments %}
  <h3>{{ dept.grouper }}</h3>
  {% for user in dept.list %}
    <p>{{ user.name }}</p>
  {% endfor %}
{% endfor %}
```

### spaceless

Remove whitespace between HTML tags:

```html
{% spaceless %}
  <div>
    <span>  hello  </span>
  </div>
{% endspaceless %}
```

Output: `<div><span>  hello  </span></div>`

### widthratio

Calculate a ratio for bar widths or similar:

```html
{% widthratio 25 100 150 %}
<!-- → 37 (floor of 25/100*150) -->
```

### debug

Dump the current template context:

```html
{% debug %}
```

Outputs a `<pre>` block with all context variables.

## Security Tags

### csrf_token

Output a hidden CSRF token input:

```html
<form method="post">
  {% csrf_token %}
  <button>Submit</button>
</form>
```

Provide `csrf_token` in context:

```javascript
res.render('form', { csrf_token: req.csrfToken() });
```

### csp_nonce_attr

Output a `nonce` attribute when `csp_nonce` is in context:

```html
<script {% csp_nonce_attr %} src="app.js"></script>
```

Provide `csp_nonce` in context:

```javascript
res.render('page', { csp_nonce: req.nonce });
```

## Comments and Raw Output

### comment / endcomment

Block comments ignored during parsing:

```html
{% comment %}
  This is a comment.
{% endcomment %}
```

### verbatim / endverbatim

Treat content as raw text:

```html
{% verbatim %}
  {{ this_will_not_be_parsed }}
{% endverbatim %}
```

## Autoescape

Control escaping for a block:

```html
{% autoescape on %}
  {{ html }}  {# escaped #}
{% endautoescape %}

{% autoescape off %}
  {{ html }}  {# not escaped #}
{% endautoescape %}
```

## Library Loading

### load

Activate a template library:

```html
{% load lorem %}
{% load humanize %}
{% load i18n %}
{% load cache %}
```

Built-in libraries:
- `i18n` — `trans`, `blocktrans`, `language`
- `humanize` — `intcomma`, `intword`, `apnumber`, `ordinal`, `naturalday`
- `cache` — `{% cache timeout key %}...{% endcache %}`
- `lorem` — `lorem` filter and tag for placeholder text

## Template Tags

### templatetag

Output a literal template tag token:

```html
{% templatetag openblock %} if user.is_admin {% templatetag closeblock %}
```

Available tokens: `openblock`, `closeblock`, `openvariable`, `closevariable`, `openbrace`, `closebrace`, `opencomment`, `closecomment`.

## Inheritance Tags

### extends

Inherit from a parent template:

```html
{% extends "base.html" %}
```

Can use expressions for dynamic parent:

```html
{% extends device|default:"base.html" %}
```

**Security:** Path traversal is blocked.

### block / endblock

Define a block that can be overridden:

```html
{% block content %}
  <p>Default content</p>
{% endblock %}
```

### block.super

A special variable, not a tag. When used inside a `{% block %}`, it renders the parent template's version of that block:

```html
{% block content %}
  {{ block.super }}
  <p>Additional content from child</p>
{% endblock %}
```

### include

Include another template:

```html
{% include "header.html" %}
{% include "header.html" with title="Hello" %}
{% include "header.html#partial_name" %}
```

**Security:** Path traversal is blocked.

## Partial Tags

### partialdef / endpartialdef

Define a reusable partial:

```html
{% partialdef card %}
  <div class="card">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
{% endpartialdef %}
```

Inline partial:

```html
{% partialdef notice %}
  <div class="alert">{{ message }}</div>
{% endpartialdef %}
```

Options:

| Option | Description |
|--------|-------------|
| `inline` | Renders the definition inline at its location during parse. |

Programmatic access:

```javascript
const compiled = compile(template);
compiled.renderPartial('card', { title: 'Hi', description: 'There' });
```

### partial

Render a named partial:

```html
{% partial card %}
{% partial card with title="Custom" %}
```

Supports passing context variables:

```html
{% partial greeting with name=user.name %}
```

## i18n Tags

### trans

Translate a string:

```html
{% trans "Hello, world!" %}
{% trans "Hello, %s!" name=user.name %}
```

With context:

```html
{% trans context "verb" "He runs" %}
```

### blocktrans / endblocktrans

Translate a block of text:

```html
{% blocktrans with name=user.name %}
  Hello, {{ name }}!
{% endblocktrans %}
```

With pluralization:

```html
{% blocktrans count items|length %}
  {{ count }} item
{% plural %}
  {{ count }} items
{% endblocktrans %}
```

### language / endlanguage

Switch language temporarily:

```html
{% language "fr" %}
  {% trans "Hello" %}
{% endlanguage %}
```

## Next Steps

- [Filters](./filters)
- [Template Inheritance](./template-inheritance)
