# Advanced Usage

## Caching

miki-template caches compiled templates automatically. Clear the cache when needed:

```javascript
const { clearCache } = require('miki-template');

clearCache();
```

## Library System

miki-template includes built-in libraries (`humanize`, `cache`, `lorem`) and supports custom libraries:

```javascript
const { registerLibrary, activateLibrary } = require('miki-template');

const myLib = {
  filters: {
    shout: (val) => String(val).toUpperCase() + '!'
  }
};

registerLibrary('mylib', myLib);
activateLibrary('mylib');
```

Use in templates:

```html
{{ name|shout }}
```

## i18n

miki-template supports internationalization:

```javascript
const { registerTranslation, setLanguage } = require('miki-template');

registerTranslation('en', {
  hello: 'Hello',
  goodbye: 'Goodbye'
});

setLanguage('en');
```

Use in templates:

```html
{% trans "hello" %}
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

## Next Steps

- [API Reference](../api/)
- [Performance](./performance)
