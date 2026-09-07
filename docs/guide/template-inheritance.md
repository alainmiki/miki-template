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

### Three-level example

**base.html:**
```html
<html>
<body>
  {% block content %}Base content{% endblock %}
</body>
</html>
```

**child.html:**
```html
{% extends "base.html" %}

{% block content %}
  <h2>Child content</h2>
  {{ block.super }}
{% endblock %}
```

**grandchild.html:**
```html
{% extends "child.html" %}

{% block content %}
  <h1>Grandchild content</h1>
  {{ block.super }}
{% endblock %}
```

Rendering `grandchild.html` produces:
```html
<html>
<body>
  <h1>Grandchild content</h1>
  <h2>Child content</h2>
  Base content
</body>
</html>
```

## Rendering a Single Block

Compile a template and render only one block:

```javascript
const { compile } = require('miki-template');

const compiled = compile(childTemplate, { views: './templates' });
const html = compiled.renderBlock('content', context);
```

This is useful for AJAX or HTMX responses where you only need a portion of the page.

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `block.super`.

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:
- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root

This means you can organize templates like:

```text
project/
├── views/
│   ├── base.html
│   └── home.html
├── app/
│   └── templates/
│       └── admin/
│           └── dashboard.html
```

And `{% extends "base.html" %}` will be found regardless of where the child template lives.

## Block Default Behavior

If a child template does not override a block, the parent's default content is rendered:

```html
<!-- base.html -->
<html>
<body>
  {% block sidebar %}Default sidebar{% endblock %}
</body>
</html>
```

```html
<!-- child.html -->
{% extends "base.html" %}

{% block content %}Main content{% endblock %}
<!-- sidebar block is not overridden, so "Default sidebar" is used -->
```

## Next Steps

- [Partial Templates](./partial-templates)
- [Tags: extends and block](../guide/tags)
