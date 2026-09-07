# Cache API



## clearCache



Clear the compiled template cache. Templates are cached in-memory (LRU, 100 entries max). Call this when templates change on disk during development, in tests, or when dynamically registering tags/filters.



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



## How Caching Works



- Templates are cached by a key combining the source string and compile options (views, custom settings).

- The cache is an in-memory LRU cache limited to 100 entries.

- Cached compiled templates are reused across renders, improving performance for repeated templates.

- Partials defined via `{% partialdef %}` are cached along with their parent template.



## When to Clear Cache



- During development when templates change frequently on disk

- In tests to ensure fresh compilation

- When dynamically registering custom tags/filters at runtime



### Development File Watcher



=== "CommonJS"



    ```javascript

    const fs = require('fs');

    const { clearCache } = require('miki-template');



    if (process.env.NODE_ENV !== 'production') {

      fs.watch('./views', () => {

        clearCache();

        console.log('Template cache cleared');

      });

    }

    ```



=== "ES Modules"



    ```javascript

    import fs from 'node:fs';

    import { clearCache } from 'miki-template';



    if (process.env.NODE_ENV !== 'production') {

      fs.watch('./views', () => {

        clearCache();

        console.log('Template cache cleared');

      });

    }

    ```



## cache Library



The built-in `cache` library (auto-activated) provides a template tag for caching fragments:



```html

{% load cache %}



{% cache 300 sidebar_key %}

  <div class="sidebar">

    {% for item in sidebar_items %}

      <a href="{{ item.url }}">{{ item.title }}</a>

    {% endfor %}

  </div>

{% endcache %}

```



The first argument is the TTL in seconds. The second is a cache key. Additional arguments serve as key components.



## Next Steps



- [Advanced Usage: Caching](../guide/advanced-usage#caching.md)

- [API Reference](../)

