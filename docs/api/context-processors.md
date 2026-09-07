# Context Processors API



## registerContextProcessor



Register a context processor function that runs before every render. The returned object is merged into the rendering context, with explicit context values always winning.



=== "CommonJS"



    ```javascript

    const { registerContextProcessor } = require('miki-template');



    registerContextProcessor((context) => {

      return {

        siteName: 'My App',

        currentYear: new Date().getFullYear()

      };

    });

    ```



=== "ES Modules"



    ```javascript

    import { registerContextProcessor } from 'miki-template';



    registerContextProcessor((context) => {

      return {

        siteName: 'My App',

        currentYear: new Date().getFullYear()

      };

    });

    ```



### Signature



```typescript

type ContextProcessor = (context: Context) => Record<string, any> | null

```



- Receives the `Context` object, allowing inspection of existing values via `context.get('key')`.

- Must return a plain object. Returning `null` or `undefined` is treated as `{}`.

- Must be synchronous — no async/await or Promises.



## clearContextProcessors



Clear all registered context processors. Useful in tests or when re-configuring.



=== "CommonJS"



    ```javascript

    const { clearContextProcessors } = require('miki-template');



    clearContextProcessors();

    ```



=== "ES Modules"



    ```javascript

    import { clearContextProcessors } from 'miki-template';



    clearContextProcessors();

    ```



## Precedence Rules



1. **Context processors run first** — their key/value pairs are added to the context.

2. **Your explicit context is applied last** — explicit values always override processor values.



```javascript

// Processor sets: { siteName: 'My App', theme: 'dark' }

// You render with: { theme: 'light' }

// Result: { siteName: 'My App', theme: 'light' }

```



## Next Steps



- [Context Processors Guide](../guide/context-processors.md)

- [API Reference](../index.md)

