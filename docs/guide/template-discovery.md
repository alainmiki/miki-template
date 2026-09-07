# Smart Template Discovery



miki-template includes a Django-inspired template finder that searches your project structure intelligently. You no longer need to manually configure every views directory or worry about `Failed to lookup view` errors when templates live in nested app folders.



## Table of Contents



- [How It Works](#how-it-works)

- [Supported Layouts](#supported-layouts)

- [Express Integration](#express-integration)

- [Custom Template Directory Names](#custom-template-directory-names)

- [Manual Lookup](#manual-lookup)

- [ESM Import](#esm-import)

- [Next Steps](#next-steps)



---



## How It Works



When you call `res.render('name')` or `render('name', ctx, { views })`, miki-template:



1. Resolves the view name against the configured views directories.

2. Searches recursively through subdirectories for matching files.

3. Recognizes app-style `templates/` directories automatically.

4. Supports custom directory names via `setAppTemplateDirNames()`.



The search order is:



1. **Direct resolution** — if you pass `nested/path`, it resolves relative to each views root.

2. **Recursive search** — if you pass a bare name like `home`, the engine walks subdirectories searching for `home.html` or `home.miki`.

3. **App-style directories** — directories named `templates` (or whatever you configure) are treated as additional view roots at any depth.



## Supported Layouts



```text

project/

├── views/

│   └── home.html

├── app/

│   └── templates/

│       └── dashboard.html

├── packages/

│   └── admin/

│       └── templates/

│           └── settings.html

```



All of these are discoverable without extra configuration.



## Express Integration



When you use `setupExpress()`, the engine automatically expands your views roots to include all directories that contain template files:



=== "CommonJS"



    ```javascript

    const express = require('express');

    const miki = require('miki-template');



    const app = express();

    miki.setupExpress(app, { extension: 'html', views: './views' });



    // Templates placed deeply in your project are found automatically:

    app.get('/', (req, res) => res.render('home'));

    app.get('/admin', (req, res) => res.render('settings'));

    ```



=== "ES Modules"



    ```javascript

    import express from 'express';

    import miki from 'miki-template';



    const app = express();

    miki.setupExpress(app, { extension: 'html', views: './views' });



    app.get('/', (req, res) => res.render('home'));

    app.get('/admin', (req, res) => res.render('settings'));

    ```



You can also pass multiple roots:



```javascript

miki.setupExpress(app, {

  extension: 'html',

  views: ['./views', './app/templates', './packages/*/templates']

});

```



## Custom Template Directory Names



If your project uses a different convention than `templates`, configure it globally:



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



This affects both Express integration and manual `render()` / `findTemplateInViews()` calls.



## Manual Lookup



You can use the finder directly:



=== "CommonJS"



    ```javascript

    const { findTemplateInViews } = require('miki-template');



    const found = findTemplateInViews('home', [

      './views',

      './app/templates'

    ]);



    console.log(found);

    // Output: /absolute/path/to/home.html

    ```



=== "ES Modules"



    ```javascript

    import { findTemplateInViews } from 'miki-template';



    const found = findTemplateInViews('home', [

      './views',

      './app/templates'

    ]);



    console.log(found);

    // Output: /absolute/path/to/home.html

    ```



### Finder Behavior



- Searches recursively through subdirectories for bare template names.

- Tries `.html` and `.miki` extensions when no extension is provided.

- Also searches app-style `templates/` directories nested inside the views root.

- Returns the first match found, or `null` if not found.



### ESM Import



=== "ES Modules"



    ```javascript

    import { findTemplateInViews, setAppTemplateDirNames } from 'miki-template';



    // Set custom directory names

    setAppTemplateDirNames(['templates', 'app_templates']);



    // Find a template

    const path = findTemplateInViews('detail', ['./views', './packages']);

    console.log(path);

    // → /absolute/path/to/packages/product/templates/detail.html

    ```



## Next Steps



- [Partial Templates](./partial-templates.md)

- [Template Inheritance](./template-inheritance.md)

- [Integrations: Express](../integrations/express.md)

