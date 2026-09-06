# Template Inheritance

miki-template supports Django-style template inheritance via `{% extends %}` and `{% block %}`. This lets you build layout hierarchies where child templates override parent blocks.

## Basic Inheritance

### base.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>{% block title %}Default Title{% endblock %}</title>
</head>
<body>
  <header>{% block header %}Default Header{% endblock %}</header>
  <main>{% block content %}Default Content{% endblock %}</main>
  <footer>{% block footer %}Default Footer{% endblock %}</footer>
</body>
</html>
```

### child.html

```html
{% extends "base.html" %}

{% block title %}My Page{% endblock %}

{% block content %}
  <h1>Hello, {{ user.name }}!</h1>
  {% for item in items %}
    <p>{{ item }}</p>
  {% endfor %}
{% endblock %}
```

## block.super

Inside a block, `{{ block.super }}` renders the parent block's content:

```html
{% extends "base.html" %}

{% block content %}
  <h1>My Content</h1>
  {{ block.super }}
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `block.super` traverses the chain correctly.

## Rendering a Single Block

Compile a template and render only one block:

```javascript
const { compile } = require('miki-template');

const compiled = compile(childTemplate, { views: './templates' });
const html = compiled.renderBlock('content', context);
```

This is useful for AJAX or HTMX responses where you only need a portion of the page.

## Path Traversal Protection

`{% extends %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
```

## Next Steps

- [Partial Templates](./partial-templates)
- [Tags: extends and block](../guide/tags)
