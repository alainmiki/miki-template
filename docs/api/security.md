# Security API



## markSafe



Mark a string as safe (bypass auto-escaping).



=== "CommonJS"



    ```javascript

    const { markSafe } = require('miki-template');



    const html = markSafe('<b>ok</b>');

    // Will not be escaped

    ```



=== "ES Modules"



    ```javascript

    import { markSafe } from 'miki-template';



    const html = markSafe('<b>ok</b>');

    ```



## isSafe



Check if a value is marked safe.



=== "CommonJS"



    ```javascript

    const { isSafe } = require('miki-template');



    if (isSafe(value)) {

      // value is marked safe

    }

    ```



=== "ES Modules"



    ```javascript

    import { isSafe } from 'miki-template';



    if (isSafe(value)) {

      // value is marked safe

    }

    ```



## escapeHtml



Escape HTML special characters (`&`, `<`, `>`, `"`, `'`, `` ` ``).



=== "CommonJS"



    ```javascript

    const { escapeHtml } = require('miki-template');



    const escaped = escapeHtml('<script>');

    // Output: &lt;script&gt;

    ```



=== "ES Modules"



    ```javascript

    import { escapeHtml } from 'miki-template';



    const escaped = escapeHtml('<script>');

    ```



### Force-Escape SafeString



Pass `true` as the second argument to force-escape a `SafeString` (matching Django's `|escape` filter behavior):



=== "CommonJS"



    ```javascript

    const { escapeHtml, SafeString } = require('miki-template');



    const safe = new SafeString('<b>bold</b>');

    const forced = escapeHtml(safe, true);

    // Output: &lt;b&gt;bold&lt;/b&gt;

    ```



=== "ES Modules"



    ```javascript

    import { escapeHtml, SafeString } from 'miki-template';



    const safe = new SafeString('<b>bold</b>');

    const forced = escapeHtml(safe, true);

    ```



## stripExpressContext



Strip Express-specific framework keys (`_`, `settings`, `cache`) from a context object.



=== "CommonJS"



    ```javascript

    const { stripExpressContext } = require('miki-template');



    const cleanCtx = stripExpressContext(expressOptions);

    // Removes: _locals, settings, cache, and other _ prefixed keys

    ```



=== "ES Modules"



    ```javascript

    import { stripExpressContext } from 'miki-template';



    const cleanCtx = stripExpressContext(expressOptions);

    ```



## SafeString Class



Create a SafeString instance directly.



=== "CommonJS"



    ```javascript

    const { SafeString } = require('miki-template');



    const safe = new SafeString('<b>ok</b>');

    ```



=== "ES Modules"



    ```javascript

    import { SafeString } from 'miki-template';



    const safe = new SafeString('<b>ok</b>');

    ```



## Path Traversal Protection



The `extends` and `include` tags validate that resolved template paths stay within configured views directories. Attempting to traverse outside throws an error:



```html

{% extends "../../etc/passwd" %}  <!-- throws -->

{% include "../../secrets" %}     <!-- throws -->

```



## Next Steps



- [Security Guide](../guide/security.md)

- [API Reference](../index.md)

