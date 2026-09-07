# Template Inheritance

miki-template supports Django-style template inheritance via `{% extends %}` and `{% block %}`. This lets you build layout hierarchies where child templates override parent blocks.

## Table of Contents

- [Basic Inheritance param($m) if ($m.Groups[1].Value -notmatch '\.md
- [block.super param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#blocksuper.md' 
- [Multi-Level Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#multi-level-inheritance.md' 
- [Rendering a Single Block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-a-single-block.md' 
- [block Default Behavior param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#block-default-behavior.md' 
- [Path Traversal Protection param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#path-traversal-protection.md' 
- [Smart Template Discovery for Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#smart-template-discovery-for-inheritance.md' 

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#inheritance-tags.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [block.super param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Multi-Level Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#multi-level-inheritance.md' 
- [Rendering a Single Block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-a-single-block.md' 
- [block Default Behavior param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#block-default-behavior.md' 
- [Path Traversal Protection param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#path-traversal-protection.md' 
- [Smart Template Discovery for Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#smart-template-discovery-for-inheritance.md' 

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#inheritance-tags.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Multi-Level Inheritance param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Rendering a Single Block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#rendering-a-single-block.md' 
- [block Default Behavior param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#block-default-behavior.md' 
- [Path Traversal Protection param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#path-traversal-protection.md' 
- [Smart Template Discovery for Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#smart-template-discovery-for-inheritance.md' 

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#inheritance-tags.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Rendering a Single Block param($m) if ($m.Groups[1].Value -notmatch '\.md
- [block Default Behavior param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#block-default-behavior.md' 
- [Path Traversal Protection param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#path-traversal-protection.md' 
- [Smart Template Discovery for Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#smart-template-discovery-for-inheritance.md' 

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#inheritance-tags.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [block Default Behavior param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Path Traversal Protection param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#path-traversal-protection.md' 
- [Smart Template Discovery for Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#smart-template-discovery-for-inheritance.md' 

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#inheritance-tags.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Path Traversal Protection param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Smart Template Discovery for Inheritance param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#smart-template-discovery-for-inheritance.md' 

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#inheritance-tags.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Smart Template Discovery for Inheritance param($m) if ($m.Groups[1].Value -notmatch '\.md

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './tags#inheritance-tags.md' 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 

---

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

**Key behaviors:**

- The child template's text outside `{% block %}` tags is **ignored** — only the blocks are used to override the parent.
- Any blocks not overridden in the child use the parent's default content.
- The parent is located using the `views` option (or Express's `views` directory).

## block.super

Inside a block, `{{ block.super }}` renders the parent template's version of that block. This is useful for augmentation rather than replacement.

=== "Example"

    ```html
    {% extends "base.html" %}

    {% block content %}
      <h1>My Content</h1>
      {{ block.super }}
    {% endblock %}
    ```

If `base.html`'s content block is `<p>Original</p>`, the output is:

```html
<h1>My Content</h1>
<p>Original</p>
```

**Real-world sidebar that adds to the parent:**

```html
<!-- base.html -->
{% block sidebar %}
  <ul class="nav">
    <li><a href="/">Home</a></li>
  </ul>
{% endblock %}

<!-- admin.html -->
{% extends "base.html" %}
{% block sidebar %}
  {{ block.super }}
  <li><a href="/admin">Admin Panel</a></li>
{% endblock %}
```

## Multi-Level Inheritance

Inheritance chains can be arbitrarily deep:

```text
base.html
  └── child.html
        └── grandchild.html
```

Each level can override blocks from its parent, and `{{ block.super }}` traverses the chain correctly.

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

Compile a template and render only one block — useful for AJAX or HTMX responses where you only need a portion of the page:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(childTemplateStr, { views: './templates' });
    const partialHtml = compiled.renderBlock('content', context);
    ```

### renderBlock behavior

- If the block is not found, throws `Block 'blockName' not found in template`.
- If the block has no overrides, renders the default body.
- If the block has overrides, renders the child-most block first, then traverses up for `{{ block.super }}`.

**Real-world HTMX use case:**

```html
<!-- layout.html -->
{% block main %}
  <div id="main-content">
    <!-- default content -->
  </div>
{% endblock %}
```

```javascript
// Return only the main block for an AJAX update
app.get('/ajax/content', (req, res) => {
  const compiled = miki.compile(template, { views: './views' });
  res.send(compiled.renderBlock('main', { user: req.user }));
});
```

## block Default Behavior

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

## Dynamic extends

You can use expressions in `extends` for device-specific or conditional layouts:

```html
{% extends device_type|default:"base.html" %}
```

```html
{% extends user.theme|default:"default.html" %}
```

## Path Traversal Protection

`{% extends %}` and `{% include %}` paths are validated to prevent directory traversal attacks:

```html
{% extends "../../etc/passwd" %}  {# REJECTED #}
{% include "../../secrets" %}      {# REJECTED #}
```

The engine checks that resolved paths stay within the allowed views directories. An `Error` with message starting `path traversal` is thrown if a path escapes the views root.

## Smart Template Discovery for Inheritance

When using `setupExpress()`, the engine automatically searches for parent templates in:

- The configured `views` directory
- Nested `templates/` directories inside the views root
- Subdirectories of the views root
- App-style `app/templates/...`, `packages/*/templates/...`, etc.

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

## Next Steps

- [Partial Templates param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'partial-templates.md.md' 
- [Tags: extends and block param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Template Discovery param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', 'template-discovery.md.md' 
