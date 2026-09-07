# Libraries API

## registerLibrary

Register a library.

```javascript
const { registerLibrary } = require('miki-template');

registerLibrary('mylib', {
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
});
```

## activateLibrary

Activate a registered library.

```javascript
const { activateLibrary } = require('miki-template');

activateLibrary('mylib');
```

## unregisterLibrary

Unregister a library.

```javascript
const { unregisterLibrary } = require('miki-template');

// Unregister specific library
unregisterLibrary('mylib');

// Unregister all libraries
unregisterLibrary();
```

## hasLibrary

Check if a library is registered.

```javascript
const { hasLibrary } = require('miki-template');

if (hasLibrary('humanize')) {
  // ...
}
```

## getLibraryNames

List all registered library names.

```javascript
const { getLibraryNames } = require('miki-template');

console.log(getLibraryNames());
// ['humanize', 'cache', 'lorem']
```

## registerLibraryFromPath

Load a library from a JavaScript file on disk.

```javascript
const { registerLibraryFromPath } = require('miki-template');

registerLibraryFromPath('mylib', './libs/mylib.js');
```

The file must export `{ tags, filters, helpers }`.

## Built-in Libraries

### humanize

Provides human-readable formatting filters: `intcomma`, `intword`, `apnumber`, `ordinal`, `naturalday`.

### cache

Provides `{% cache timeout key %}` tag for caching template fragments.

### lorem

Provides `{% lorem %}` tag and `lorem` filter for placeholder text.

## Next Steps

- [Advanced Usage: Libraries](../guide/advanced-usage#library-system)
- [API Reference](../)
