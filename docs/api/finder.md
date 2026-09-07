# Finder API

## findTemplateInViews

Find a template file by name in the provided views directories.

=== "CommonJS"

    ```javascript
    const { findTemplateInViews } = require('miki-template');

    const found = findTemplateInViews('home', ['./views', './app/templates']);
    console.log(found);
    // Output: /absolute/path/to/home.html
    ```

=== "ES Modules"

    ```javascript
    import { findTemplateInViews } from 'miki-template';

    const found = findTemplateInViews('home', ['./views', './app/templates']);
    console.log(found);
    ```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `templateName` | `string` | Template name to search for (with or without extension) |
| `viewsDirs` | `string[]` | Array of views directories to search |

### Returns

`string | null` — Absolute path to the template file, or `null` if not found.

### Behavior

- Searches recursively through subdirectories for bare template names (no `/` in name).
- Tries `.html` and `.miki` extensions when no extension is provided.
- Also searches app-style `templates/` directories nested inside the views root.
- Returns the **first match found**.

## setAppTemplateDirNames

Configure which directory names are treated as app-style template directories.

=== "CommonJS"

    ```javascript
    const { setAppTemplateDirNames } = require('miki-template');

    setAppTemplateDirNames(['templates', 'views', 'pages']);
    ```

=== "ES Modules"

    ```javascript
    import { setAppTemplateDirNames } from 'miki-template';

    setAppTemplateDirNames(['templates', 'views', 'pages']);
    ```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `names` | `string \| string[]` | Directory name(s) to recognize |

## getAppTemplateDirNames

Get the current app template directory names.

=== "CommonJS"

    ```javascript
    const { getAppTemplateDirNames } = require('miki-template');

    console.log(getAppTemplateDirNames());
    // ['templates']
    ```

=== "ES Modules"

    ```javascript
    import { getAppTemplateDirNames } from 'miki-template';

    console.log(getAppTemplateDirNames());
    ```

## Next Steps

- [Guide: Smart Template Discovery](../guide/template-discovery)
- [API Reference](../)
