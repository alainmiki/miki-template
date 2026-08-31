# Tags Reference

This document provides a detailed reference for every built-in block tag in **miki-template**, grouped by function.

---

## Control Flow Tags

### `{% if %} / {% elif %} / {% else %} / {% endif %}`

Conditionally renders content based on an expression.

```html
{% if user.is_authenticated %}
  <p>Hello, {{ user.name }}!</p>
{% elif user.is_guest %}
  <p>Welcome, guest!</p>
{% else %}
  <p>Please log in.</p>
{% endif %}
```

**Supported operators:**

| Operator | Meaning |
|----------|---------|
| `==` | Equal |
| `!=` | Not equal |
| `<` | Less than |
| `<=` | Less than or equal |
| `>` | Greater than |
| `>=` | Greater than or equal |
| `in` | Membership (item in list) |
| `not in` | Non-membership |
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |

**Operator precedence** (highest to lowest): comparison → `and` → `or`

```html
{% if user.age >= 18 and user.is_verified %}
  <p>Eligible to vote.</p>
{% endif %}

{% if item not in cart %}
  <button>Add to cart</button>
{% endif %}
```

---

### `{% for %} / {% empty %} / {% endfor %}`

Iterates over arrays or objects.

```html
<ul>
{% for user in users %}
  <li>{{ user.name }}</li>
{% empty %}
  <li>No users found.</li>
{% endfor %}
</ul>
```

**Object iteration** — unpacks key and value:

```html
{% for key, value in config %}
  <dt>{{ key }}</dt>
  <dd>{{ value }}</dd>
{% endfor %}
```

**Tuple unpacking** — unpacks index and item:

```html
{% for item, index in items %}
  {{ forloop.counter }}. {{ item }}
{% endfor %}
```

**Loop metadata** — `forloop` object is available inside the loop:

| Property | Type | Description |
|----------|------|-------------|
| `forloop.counter` | integer | Current iteration (1-indexed) |
| `forloop.counter0` | integer | Current iteration (0-indexed) |
| `forloop.revcounter` | integer | Iterations remaining (counting down from 1) |
| `forloop.revcounter0` | integer | Iterations remaining (counting down from 0) |
| `forloop.first` | boolean | True on first iteration |
| `forloop.last` | boolean | True on last iteration |
| `forloop.parentloop` | object | Reference to parent loop's `forloop` |

**Nested loops example:**

```html
{% for category in categories %}
  <h2>{{ category.name }}</h2>
  {% for product in category.products %}
    {# forloop.counter = position in category #}
    {# forloop.parentloop.counter = position in categories #}
    <p>{{ forloop.parentloop.counter }}.{{ forloop.counter }}: {{ product }}</p>
  {% endfor %}
{% endfor %}
```

---

### `{% with %} / {% endwith %}`

Creates scoped aliases for variables or expressions.

```html
{% with user.profile as profile %}
  <img src="{{ profile.avatar }}">
  <a href="{{ profile.url }}">{{ profile.display_name }}</a>
{% endwith %}
```

**Multiple assignments** (Django-style):

```html
{% with a=1 b=items.0.name c="static" %}
  {{ a }} | {{ b }} | {{ c }}
{% endwith %}
```

You can also unpack tuple-like values:

```html
{% with key, value in item %}
  <li>{{ key }}: {{ value }}</li>
{% endwith %}
```

---

### `{% cycle %}`

Outputs one of its arguments for each iteration of a loop.

```html
{% for row in rows %}
  <tr class="{% cycle 'row-even' 'row-odd' %}">
    <td>{{ row.name }}</td>
  </tr>
{% endfor %}
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

---

### `{% firstof %}`

Outputs the first argument that evaluates to `true`.

```html
{% firstof user.display_name user.username "Anonymous" %}
```

With `{% else %}` for a fallback:

```html
{% firstof user.display_name user.username %}
  {{ firstof_output }}
{% else %}
  Anonymous
{% endif %}
```

---

## Template Inheritance Tags

### `{% extends %}`

Must be the first tag in a child template. Specifies the parent template.

```html
{% extends "base.html" %}
```

Can use expressions for dynamic parent (e.g., mobile vs desktop):

```html
{% extends device|default:"base.html" %}
```

**Security:** Path traversal is blocked — the template name must resolve within the configured `views` directories.

---

### `{% block %} / {% endblock %}`

Defines a replaceable section that child templates can override.

```html
<!-- base.html -->
{% block content %}
  Default content
{% endblock %}
```

```html
<!-- child.html -->
{% extends "base.html" %}
{% block content %}
  Overridden content
{% endblock %}
```

**`{{ block.super }}`** — renders the parent template's block content within an override:

```html
{% block content %}
  {{ block.super }}
  <p>Additional content from child</p>
{% endblock %}
```

---

### `{% block.super %}`

A special variable, not a tag. When used inside a `{% block %}`, it renders the parent template's version of that block.

---

## Include and Partial Tags

### `{% include %}`

Includes another template file at render time. The included template gets a copy of the current context.

```html
{% include "header.html" %}
{% include "sidebar.html" with active_section="home" %}
{% include "footer.html" without context %}
```

**Security:** Path traversal is blocked to prevent reading arbitrary files outside the views directory.

---

### `{% partialdef %} / {% endpartialdef %}`

Defines a reusable fragment that can be rendered later via `{% partial %}`.

```html
{% partialdef card %}
  <div class="card">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
{% endpartialdef %}

{% partial card with title="Hello" description="World" %}
```

**Options:**

| Option | Description |
|--------|-------------|
| `inline` | Renders the definition inline at its location during parse. |
| `lazy` | Defers parsing until first use (default is eager parsing). |

**Programmatic access:**

```javascript
const compiled = compile(template);
compiled.renderPartial('card', { title: 'Hi', description: 'There' });
```

---

### `{% partial %}`

Renders a previously defined partial.

```html
{% partial card %}
{% partial card with title="Custom" %}
```

Supports passing context variables:

```html
{% partial greeting with name=user.name %}
```

---

## Utility Tags

### `{% comment %} / {% endcomment %}`

Block comment that is stripped from the output entirely.

```html
{% comment %}
  This section is deprecated.
  It will be removed in the next release.
{% endcomment %}
```

Short form (single tag, self-closing):

```html
{% comment %} This will not appear in output {% endcomment %}
```

---

### `{% verbatim %} / {% endverbatim %}`

Prevents all tag/variable parsing inside the block.

```html
{% verbatim %}
  {{ this_is_not_a_variable }}
  {% if this_is_not_a_tag %}Ignored{% endif %}
{% endverbatim %}
```

---

### `{% load %}`

Loads additional filter libraries (for future extensibility).

```html
{% load i18n %}
{% load custom_filters %}
```

---

### `{% spaceless %} / {% endspaceless %}`

Removes whitespace between HTML tags.

```html
{% spaceless %}
  <div>  <p>Hello</p>  </div>
{% endspaceless %}
<!-- → <div><p>Hello</p></div> -->
```

---

### `{% static %}`

Generates the URL for a static asset.

```html
<img src="{% static "css/app.css" %}">
<script src="{% static "js/bundle.js" %}"></script>
```

Configure the prefix:
```javascript
compile(template, { staticUrl: '/assets/' });
```

---

### `{% url %}`

Generates a URL for a named route using the provided `urlHelper` function.

```html
<a href="{% url "home" %}">Home</a>
<a href="{% url "user-profile" user.id %}">Profile</a>
<a href="{% url "search" query=search_query %}">Search</a>
```

Configure:
```javascript
compile(template, {
  urlHelper: (name, params, kwargs) => {
    // return resolved URL string
  }
});
```

---

### `{% csrf_token %}`

Outputs a CSRF token hidden input for forms.

```html
<form method="post">
  {% csrf_token %}
  <input type="text" name="title">
  <button type="submit">Submit</button>
</form>
```

Provide `csrf_token` in context:
```javascript
res.render('form', { csrf_token: req.csrfToken() });
```

---

### `{% csp_nonce_attr %}`

Outputs a `nonce="..."` attribute for Content Security Policy.

```html
<script {% csp_nonce_attr %}>
  console.log('CSP nonce');
</script>
```

Provide `csp_nonce` in context:
```javascript
res.render('page', { csp_nonce: req.nonce });
```

---

### `{% regroup %}`

Regroups a list by a common attribute.

```html
{% regroup users by department as departments %}
{% for dept in departments %}
  <h3>{{ dept.grouper }}</h3>
  {% for user in dept.list %}
    <p>{{ user.name }}</p>
  {% endfor %}
{% endfor %}
```

---

### `{% trans "key" %}`

Outputs a translated string from the i18n registry.

```html
{% trans "Hello, World!" %}
```

With arguments:

```html
{% trans "Hello, %s!" name=user.name %}
```

With context:

```html
{% trans context "verb" "He runs" %}
```

---

### `{% blocktrans %}...{% endblocktrans %}`

Translates a block of text. Supports `{% with name=value %}` and `{% plural count name=value %}`.

```html
{% blocktrans with name=user.name count items|length %}
  {{ name }} has {{ items|length }} item.
{% plural %}
  {{ name }} has {{ items|length }} items.
{% endblocktrans %}
```

---

### `{% language "xx" %}...{% endlanguage %}`

Switches the active language for the enclosed block.

```html
{% language "fr" %}
  {% trans "Welcome" %}
{% endlanguage %}
```

---

### `{% widthratio value max max_width %}`

Calculates a proportional width, commonly used for bar charts or progress indicators.

```html
{% widthratio 25 100 150 %}  <!-- → 37 (floor of 25/100*150) -->
```

---

### `{% debug %}`

Dumps the current template context as a formatted HTML `<pre>` block. Useful during development.

```html
<pre>
{% debug %}
</pre>
```

---

### `{% load library1 library2 %}`

Loads one or more plugin libraries, making their tags, filters, and helpers available.

```html
{% load i18n humanize cache %}
```

Built-in libraries:
- `i18n` — `trans`, `blocktrans`, `language`
- `humanize` — `intcomma`, `intword`, `apnumber`, `ordinal`, `naturalday`
- `cache` — `{% cache timeout key %}...{% endcache %}`
- `lorem` — `lorem` filter for placeholder text

---

## Custom Filters

Register custom filters with `registerFilter`:

```javascript
const { registerFilter } = require('miki-template');

// Simple filter
registerFilter('reverse', (val) => String(val).split('').reverse().join(''));

// Filter with argument
registerFilter('truncate', (val, length) => {
  const str = String(val);
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
});

// Chaining works automatically:
// {{ name|reverse|truncate:5 }}
```

---

## Custom Tags

Register custom block tags with `registerTag`:

```javascript
const { registerTag } = require('miki-template');

registerTag('markdown', (tagContent, parser) => {
  const body = parser.parse(['endmarkdown']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endmarkdown') {
    parser.advance();
  }
  const md = require('markdown-it')();
  return {
    render(context) {
      const html = body.map(n => n.render(context)).join('');
      return md.render(html);
    }
  };
});
```

Usage in templates:
```html
{% markdown %}
# Hello World
{% endmarkdown %}
```

---

## Filter Argument Types

Filters accept the following argument types:

| Syntax | Type | Example |
|--------|------|---------|
| Unquoted | Variable lookup | `{{ value|filter:count }}` |
| Double-quoted | String literal | `{{ value|filter:"hello" }}` |
| Single-quoted | String literal | `{{ value|filter:'world' }}` |
| Number | Integer literal | `{{ value|truncatewords:10 }}` |

```html
{{ user.name|default:"Guest" }}           <!-- String default -->
{{ items|slice:"1:3" }}                  <!-- Slice notation -->
{{ price|floatformat:2 }}                 <!-- Decimal places -->
```
