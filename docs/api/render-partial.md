# renderPartialFromFile / renderPartialFromSource



Render a named partial from a template file or source string.



## renderPartialFromFile



Render a named partial from a template file.



```javascript

renderPartialFromFile(fileName, partialName, contextObj, options)

```



### Parameters



| Parameter | Type | Description |

|-----------|------|-------------|

| `fileName` | `string` | Template file name (without extension) |

| `partialName` | `string` | Name of the partial to render |

| `contextObj` | `object` | Variables to inject |

| `options` | `object` | Options including `views` directories |



### Example



=== "CommonJS"



    ```javascript

    const { renderPartialFromFile } = require('miki-template');



    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });

    ```



=== "ES Modules"



    ```javascript

    import { renderPartialFromFile } from 'miki-template';



    const html = renderPartialFromFile('home', 'card', { title: 'Hello' }, { views: './views' });

    ```



## renderPartialFromSource



Render a named partial from a template source string.



```javascript

renderPartialFromSource(fileContent, partialName, contextObj, options, filePath?)

```



### Parameters



| Parameter | Type | Description |

|-----------|------|-------------|

| `fileContent` | `string` | Template source string |

| `partialName` | `string` | Name of the partial to render |

| `contextObj` | `object` | Variables to inject |

| `options` | `object` | Options |

| `filePath` | `string?` | Optional file path for error messages |



### Example



=== "CommonJS"



    ```javascript

    const { renderPartialFromSource } = require('miki-template');



    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;

    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });

    ```



=== "ES Modules"



    ```javascript

    import { renderPartialFromSource } from 'miki-template';



    const source = `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`;

    const html = renderPartialFromSource(source, 'card', { title: 'Hello' });

    ```



## Related



- [render()](./render.md)

- [compile()](./compile.md)

