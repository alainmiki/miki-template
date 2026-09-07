# Advanced Usage

This guide covers advanced miki-template features: caching, library system, i18n, and more.

## Table of Contents

- [Caching](#caching)
- [Library System](#library-system)
- [i18n / Internationalization](#i18n--internationalization)
- [Template Discovery](#template-discovery)
- [Partial Templates](#partial-templates)
- [Extending the Engine](#extending-the-engine)

---

## Caching

miki-template caches compiled templates for performance. The cache is an in-memory LRU with a 100-entry limit.

### Clearing the Cache

=== "CommonJS"

    ```javascript
    const { clearCache } = require('miki-template');

    clearCache();
    ```

=== "ES Modules"

    ```javascript
    import { clearCache } from 'miki-template';

    clearCache();
    ```

### When to Clear Cache

- **Development** — when templates change frequently on disk
- **Tests** — to ensure fresh compilation
- **Runtime filter/tag registration** — when dynamically registering custom tags/filters

```javascript
// Development middleware that clears cache on file changes
const { clearCache } = require('miki-template');

if (process.env.NODE_ENV !== 'production') {
  fs.watch('./views', () => {
    clearCache();
    console.log('Template cache cleared');
  });
}
```

### How Caching Works

- Templates are cached by source string and compile options.
- The cache key combines the template source and the options object (views, custom settings).
- Cached templates are reused across renders, improving performance for repeated templates.

## Library System

Libraries are bundles of filters, tags, and helpers that can be loaded into templates. Built-in libraries (humanize, cache, lorem, markdown, i18n) are auto-activated.

### Registering a Library

=== "CommonJS"

    ```javascript
    const { registerLibrary } = require('miki-template');

    registerLibrary('myutils', {
      filters: {
        shout: (val) => String(val).toUpperCase() + '!',
        whisper: (val) => String(val).toLowerCase() + '...'
      },
      tags: {
        timestamp: (tagContent, parser) => ({
          render: () => new Date().toISOString()
        })
      },
      helpers: {
        formatPrice: (val) => `$${Number(val).toFixed(2)}`
      }
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerLibrary } from 'miki-template';

    registerLibrary('myutils', {
      filters: {
        shout: (val) => String(val).toUpperCase() + '!',
        whisper: (val) => String(val).toLowerCase() + '...'
      },
      tags: {
        timestamp: (tagContent, parser) => ({
          render: () => new Date().toISOString()
        })
      },
      helpers: {
        formatPrice: (val) => `$${Number(val).toFixed(2)}`
      }
    });
    ```

### Loading Libraries in Templates

Once registered, load the library with `{% load %}`:

```html
{% load myutils %}

{{ price|formatPrice }}
{{ message|shout }}
{% timestamp %}
```

### Built-in Libraries

The following libraries are auto-activated (no `{% load %}` needed):

| Library | Features |
|---------|----------|
| `humanize` | Natural date formatting, number formatting |
| `cache` | Cache control tags and filters |
| `lorem` | Lorem ipsum placeholder text |
| `markdown` | `{{ content|markdown }}` filter for Markdown→HTML |
| `i18n` | `{% trans %}` and `{% blocktrans %}` for translations |

### Deactivating and Re-registering

=== "CommonJS"

    ```javascript
    const { unregisterLibrary, activateLibrary } = require('miki-template');

    // Remove a library
    unregisterLibrary('lorem');

    // Re-activate
    activateLibrary('lorem');
    ```

=== "ES Modules"

    ```javascript
    import { unregisterLibrary, activateLibrary } from 'miki-template';

    unregisterLibrary('lorem');
    activateLibrary('lorem');
    ```

## i18n / Internationalization

miki-template includes a built-in i18n system supporting `{% trans %}` and `{% blocktrans %}` tags.

### Registering Translations

=== "CommonJS"

    ```javascript
    const miki = require('miki-template');

    miki.setLanguage('fr');
    miki.registerTranslation('fr', {
      'Hello': 'Bonjour',
      'Goodbye': 'Au revoir',
      'Welcome, {name}!': 'Bienvenue, {name} !'
    });
    ```

=== "ES Modules"

    ```javascript
    import { setLanguage, registerTranslation } from 'miki-template';

    setLanguage('fr');
    registerTranslation('fr', {
      'Hello': 'Bonjour',
      'Goodbye': 'Au revoir',
      'Welcome, {name}!': 'Bienvenue, {name} !'
    });
    ```

### Setting Fallback Language

=== "CommonJS"

    ```javascript
    const { setLanguage, setFallbackLanguage } = require('miki-template');

    setLanguage('fr');
    setFallbackLanguage('en');
    ```

=== "ES Modules"

    ```javascript
    import { setLanguage, setFallbackLanguage } from 'miki-template';

    setLanguage('fr');
    setFallbackLanguage('en');
    ```

### Template Usage

```html
{% trans "Hello" %}
{% blocktrans %}Welcome, {{ name }}!{% endblocktrans %}
```

### Managing Languages

=== "CommonJS"

    ```javascript
    const {
      registerTranslation,
      unregisterTranslation,
      setLanguage,
      getLanguage,
      setFallbackLanguage,
      getFallbackLanguage,
      getAvailableLanguages
    } = require('miki-template');
    ```

=== "ES Modules"

    ```javascript
    import {
      registerTranslation,
      unregisterTranslation,
      setLanguage,
      getLanguage,
      setFallbackLanguage,
      getFallbackLanguage,
      getAvailableLanguages
    } from 'miki-template';
    ```

## Template Discovery

The `findTemplateInViews()` function intelligently locates templates in nested directories.

=== "CommonJS"

    ```javascript
    const { findTemplateInViews, setAppTemplateDirNames } = require('miki-template');

    // Customize which directory names are treated as app template roots
    setAppTemplateDirNames(['templates', 'views', 'pages']);

    // Search for a template by name
    const found = findTemplateInViews('home', ['./views', './app/templates']);
    console.log(found);
    // → /absolute/path/to/app/templates/home.html
    ```

=== "ES Modules"

    ```javascript
    import { findTemplateInViews, setAppTemplateDirNames } from 'miki-template';

    setAppTemplateDirNames(['templates', 'views', 'pages']);
    const found = findTemplateInViews('home', ['./views', './app/templates']);
    console.log(found);
    ```

## Partial Templates

Partials let you define reusable template fragments using `{% partialdef %}` and render them on demand.

### Defining and Rendering Partials

```html
{% partialdef card %}
  <div class="card">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
  </div>
{% endpartialdef %}
```

Render a partial:

=== "CommonJS"

    ```javascript
    const { render, compile } = require('miki-template');

    // Using render() with file partials:
    const html = render('home#card', { user: userData }, { views: './views' });

    // Using compiled.renderPartial():
    const compiled = compile(templateString);
    const partialHtml = compiled.renderPartial('card', { user: userData });
    ```

=== "ES Modules"

    ```javascript
    import { render, compile } from 'miki-template';

    const html = render('home#card', { user: userData }, { views: './views' });

    const compiled = compile(templateString);
    const partialHtml = compiled.renderPartial('card', { user: userData });
    ```

### Partial with Context

```html
{% partialdef greeting %}
  Hello, {{ name }}! You have {{ count }} messages.
{% endpartialdef %}

{% partial greeting with name="Alice" count=3 %}
```

## Extending the Engine

### Registering Custom Tags

=== "CommonJS"

    ```javascript
    const { registerTag } = require('miki-template');

    registerTag('markdown', (tagContent, parser) => {
      const nodelist = parser.parse(['endmarkdown']);
      parser.skipTag();
      const { marked } = require('marked');

      return {
        render: (context) => {
          const body = nodelist.map(n => n.render(context)).join('');
          return markSafe(marked(body));
        }
      };
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, markSafe } from 'miki-template';
    import { marked } from 'marked';

    registerTag('markdown', (tagContent, parser) => {
      const nodelist = parser.parse(['endmarkdown']);
      parser.skipTag();

      return {
        render: (context) => {
          const body = nodelist.map(n => n.render(context)).join('');
          return markSafe(marked(body));
        }
      };
    });
    ```

### Registering Custom Helpers

=== "CommonJS"

    ```javascript
    const { registerHelper } = require('miki-template');

    registerHelper('truncate_words', (str, count) => {
      const words = String(str).split(/\s+/);
      return words.slice(0, count).join(' ') + (words.length > count ? '...' : '');
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerHelper } from 'miki-template';

    registerHelper('truncate_words', (str, count) => {
      const words = String(str).split(/\s+/);
      return words.slice(0, count).join(' ') + (words.length > count ? '...' : '');
    });
    ```

## Next Steps

- [Custom Tags](./custom-tags)
- [Custom Filters](./custom-filters)
- [API Reference: Libraries](../api/libraries)
- [API Reference: Cache](../api/cache)
- [API Reference: i18n](../api/i18n)
