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

### for / empty / endfor

```html
{% for item in items %}
  <li>{{ item }}</li>
{% empty %}
  <li>No items found</li>
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

### cycle

Cycle through values on each iteration:

```html
{% for row in rows %}
  <tr class="{% cycle 'row-odd' 'row-even' %}">...</tr>
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
{% ifchanged item.category %}
  <h2>{{ item.category }}</h2>
{% else %}
  <p>Same category</p>
{% endifchanged %}
```

## Date and Time

### now

Output the current date/time:

```html
{% now "Y-m-d H:i:s" %}
{% now "F j, Y" %}
```

## Utility Tags

### static

Generate a static file URL:

```html
{% static "css/style.css" %}
```

### url

Build a URL from a route name:

```html
{% url 'user.profile' user.id %}
{% url 'posts.show' post.id tab='comments' %}
```

### regroup

Group a list by a common attribute:

```html
{% for group in items|regroup:"category" %}
  <h3>{{ group.grouper }}</h3>
  {% for item in group.list %}
    <p>{{ item.name }}</p>
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
{% widthratio this_value max_value max_width %}
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

### csp_nonce_attr

Output a `nonce` attribute when `csp_nonce` is in context:

```html
<script {% csp_nonce_attr %} src="app.js"></script>
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
```

## Template Tags

### templatetag

Output a literal template tag token:

```html
{% templatetag openblock %} if user.is_admin {% templatetag closeblock %}
```

Available tokens: `openblock`, `closeblock`, `openvariable`, `closevariable`, `openbrace`, `closebrace`, `opencomment`, `closecomment`.

## Next Steps

- [Filters](./filters)
- [Template Inheritance](./template-inheritance)
