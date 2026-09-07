# Advanced Usage

## Caching

miki-template caches compiled templates automatically. Clear the cache when needed:

```javascript
const { clearCache } = require('miki-template');

clearCache();
```

### How caching works

- Templates are cached by source string and compile options.
- The cache is an in-memory LRU cache limited to 100 entries.
- Cached templates are reused across renders, improving performance.

## Library System

miki-template includes built-in libraries (`humanize`, `cache`, `lorem`) and supports custom libraries:

```javascript
const { registerLibrary, activateLibrary } = require('miki-template');

const myLib = {
  filters: {
    shout: (val) => String(val).toUpperCase() + '!'
  },
  tags: {
    hello: (tagContent, parser) => ({
      render: (context) => 'Hello!'
    })
  },
  helpers: {
    bold: (inner, context) => `<b>${inner}</b>`
  }
};

registerLibrary('mylib', myLib);
activateLibrary('mylib');
```

Use in templates:

```html
{{ name|shout }}
{% hello %}
{% bold %}text{% endbold %}
```

### Built-in Libraries

#### humanize

Provides human-readable formatting filters:

| Filter | Description | Example |
|--------|-------------|---------|
| `intcomma` | Add comma separators | `{{ views \| intcomma }}` → `1,234` |
| `intword` | Convert to human word | `{{ 1000000 \| intword }}` → `1.0 million` |
| `apnumber` | Convert 0-19 to words | `{{ 3 \| apnumber }}` → `three` |
| `ordinal` | Add ordinal suffix | `{{ 1 \| ordinal }}` → `1st` |
| `naturalday` | Convert date to relative day | `{{ date \| naturalday }}` → `today` |

Usage:

```html
{% load humanize %}
{{ views|intcomma }}
{{ count|ordinal }}
```

#### cache

Provides a `{% cache %}` tag for caching template fragments:

```html
{% cache 3600 sidebar %}
  <div class="sidebar">
    {% for item in sidebar_items %}
      <p>{{ item }}</p>
    {% endfor %}
  </div>
{% endcache %}
```

The first argument is the timeout in seconds. Optional additional arguments form a cache key:

```html
{% cache 3600 user_id user.id %}
```

#### lorem

Provides placeholder text generation:

```html
{% load lorem %}

{% lorem %}           {# one block of Lorem ipsum #}
{% lorem 3 p %}       {# 3 paragraphs #}
{% lorem 5 w %}       {# 5 words #}
{% lorem 2 w random %} {# 2 random words #}
```

## i18n

miki-template supports internationalization:

```javascript
const { registerTranslation, setLanguage } = require('miki-template');

registerTranslation('en', {
  hello: 'Hello',
  goodbye: 'Goodbye'
});

registerTranslation('fr', {
  hello: 'Bonjour',
  goodbye: 'Au revoir'
});

setLanguage('en');
```

Use in templates:

```html
{% trans "hello" %}
```

### blocktrans

Translate blocks of text with variable interpolation:

```html
{% blocktrans with name=user.name %}
  Hello, {{ name }}!
{% endblocktrans %}
```

### Pluralization

```html
{% blocktrans count items|length %}
  {{ count }} item
{% plural %}
  {{ count }} items
{% endblocktrans %}
```

### Language Switching

```html
{% language "fr" %}
  {% trans "hello" %}
{% endlanguage %}
```

## Block Rendering

Render a single block from a compiled template:

```javascript
const { compile } = require('miki-template');

const compiled = compile(templateString, { views: './templates' });
const html = compiled.renderBlock('content', context);
```

## Partial API

Render partials programmatically:

```javascript
const { renderPartialFromSource, renderPartialFromFile } = require('miki-template');

// From source string
const html = renderPartialFromSource(source, 'partialName', context);

// From file
const html2 = renderPartialFromFile('home.html', 'card', context, { views: './views' });
```

## Library API

### registerLibrary(name, definition)

Register a library:

```javascript
const { registerLibrary } = require('miki-template');

registerLibrary('mylib', {
  filters: { ... },
  tags: { ... },
  helpers: { ... }
});
```

### activateLibrary(name)

Activate a registered library:

```javascript
const { activateLibrary } = require('miki-template');

activateLibrary('mylib');
```

### unregisterLibrary(name)

Unregister a library:

```javascript
const { unregisterLibrary } = require('miki-template');

// Unregister specific library
unregisterLibrary('mylib');

// Unregister all libraries
unregisterLibrary();
```

### hasLibrary(name)

Check if a library is registered:

```javascript
const { hasLibrary } = require('miki-template');

if (hasLibrary('humanize')) {
  // ...
}
```

### getLibraryNames()

List all registered library names:

```javascript
const { getLibraryNames } = require('miki-template');

console.log(getLibraryNames());
// ['humanize', 'cache', 'lorem']
```

## Compiled Template API

When you call `compile()`, you get an object with these methods:

| Method | Description |
|--------|-------------|
| `render(contextObj)` | Synchronous render |
| `renderWith(contextObj, callOptions)` | Render with options override |
| `asyncRender(contextObj)` | Async render |
| `asyncRenderWith(contextObj, callOptions)` | Async render with options override |
| `renderBlock(blockName, contextObj)` | Render a single block |
| `renderPartial(partialName, contextObj)` | Render a named partial |

## Template Finder API

### findTemplateInViews(templateName, viewsDirs)

Find a template file by name:

```javascript
const { findTemplateInViews } = require('miki-template');

const found = findTemplateInViews('home', ['./views', './app/templates']);
console.log(found);
// Output: /absolute/path/to/home.html
```

### setAppTemplateDirNames(names)

Configure which directory names are treated as app-style template directories:

```javascript
const { setAppTemplateDirNames } = require('miki-template');

setAppTemplateDirNames(['templates', 'views', 'pages']);
```

## Context Object

The rendering context provides:

| Property/Method | Description |
|-----------------|-------------|
| `context.get('var')` | Get a variable value |
| `context.push(scope)` | Push a new scope |
| `context.pop()` | Pop the top scope |
| `context.registerPartial(name, node)` | Register a partial |
| `context.getPartial(name)` | Get a registered partial |
| `context.autoescape` | Current autoescape setting |
| `context.blocks` | Block definitions for inheritance |
| `context.cycleStates` | Cycle tag state |
| `context.parentTemplate` | Parent template name for extends |
| `context.partialDefs` | Partial definitions map |

## Next Steps

- [API Reference](../api/)
- [Performance](../performance)
