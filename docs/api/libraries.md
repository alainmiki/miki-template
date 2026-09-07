# Libraries API

## registerLibrary

Register a library — a named bundle of filters, tags, and helpers.

=== "CommonJS"

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

=== "ES Modules"

    ```javascript
    import { registerLibrary } from 'miki-template';

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

Activate a library so its filters and tags become available.

=== "CommonJS"

    ```javascript
    const { activateLibrary } = require('miki-template');

    activateLibrary('mylib');
    ```

=== "ES Modules"

    ```javascript
    import { activateLibrary } from 'miki-template';

    activateLibrary('mylib');
    ```

Built-in libraries (`humanize`, `cache`, `lorem`, `markdown`, `i18n`) are auto-activated on import.

## unregisterLibrary

=== "CommonJS"

    ```javascript
    const { unregisterLibrary } = require('miki-template');

    // Unregister specific library
    unregisterLibrary('mylib');

    // Unregister all libraries
    unregisterLibrary();
    ```

=== "ES Modules"

    ```javascript
    import { unregisterLibrary } from 'miki-template';

    unregisterLibrary('mylib');
    ```

## hasLibrary

=== "CommonJS"

    ```javascript
    const { hasLibrary } = require('miki-template');

    if (hasLibrary('humanize')) {
      // library is registered
    }
    ```

=== "ES Modules"

    ```javascript
    import { hasLibrary } from 'miki-template';

    if (hasLibrary('humanize')) {
      // library is registered
    }
    ```

## getLibrary

Retrieve a library by name.

=== "CommonJS"

    ```javascript
    const { getLibrary } = require('miki-template');

    const lib = getLibrary('humanize');
    console.log(Object.keys(lib.filters));
    ```

=== "ES Modules"

    ```javascript
    import { getLibrary } from 'miki-template';

    const lib = getLibrary('humanize');
    ```

## getLibraryNames

=== "CommonJS"

    ```javascript
    const { getLibraryNames } = require('miki-template');

    console.log(getLibraryNames());
    // ['humanize', 'cache', 'lorem']
    ```

=== "ES Modules"

    ```javascript
    import { getLibraryNames } from 'miki-template';

    console.log(getLibraryNames());
    ```

## registerLibraryFromPath

Load a library from a JavaScript file on disk. The file must export `{ tags, filters, helpers }`.

=== "CommonJS"

    ```javascript
    const { registerLibraryFromPath } = require('miki-template');

    registerLibraryFromPath('mylib', './libs/mylib.js');
    ```

=== "ES Modules"

    ```javascript
    import { registerLibraryFromPath } from 'miki-template';

    await registerLibraryFromPath('mylib', './libs/mylib.mjs');
    ```

## Built-in Libraries

### humanize

Provides natural formatting filters: `intcomma`, `intword`, `ordinal`, `naturalday`, `naturaltime`.

| Filter | Description |
|--------|-------------|
| `intcomma` | `1234567` → `1,234,567` |
| `intword` | `1234567` → `1.2M` |
| `ordinal` | `1` → `1st`, `2` → `2nd` |
| `naturalday` | Format dates as "today", "yesterday" |
| `naturaltime` | Format times as "just now", "2 hours ago" |
| `ordinal` | Convert numbers to ordinal (1st, 2nd, 3rd) |

### cache

Provides `{% cache timeout key %}...{% endcache %}` tag for caching template fragments.

### lorem

Provides `{% lorem count random_words %}` tag and `lorem` filter for placeholder text.

### markdown

Provides `markdown` filter for Markdown→HTML conversion.

### i18n

Provides `{% trans %}`, `{% blocktrans %}`, `{% language %}` tags and translation functions.

## Next Steps

- [Advanced Usage: Libraries](../guide/advanced-usage#library-system)
- [API Reference](../)
