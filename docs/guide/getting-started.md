# Getting Started



Get up and running with miki-template in under a minute.



## Prerequisites



- **Node.js** 18.x or 20.x (or later, including Bun)

- **npm** 9+, **pnpm**, or **yarn**



## Installation



=== "npm"



    ```bash

    npm install miki-template

    ```



=== "pnpm"



    ```bash

    pnpm add miki-template

    ```



=== "yarn"



    ```bash

    yarn add miki-template

    ```



## Quick Example: Render a Template String



The simplest way to use miki-template is the `render()` convenience function. It compiles the template, applies any registered context processors, and returns the HTML — all in one call.



=== "CommonJS (require)"



    ```javascript

    const { render } = require('miki-template');



    const html = render('Hello {{ name|title }}!', { name: 'alice' });

    console.log(html); // "Hello Alice!"

    ```



=== "ES Modules (import)"



    ```javascript

    import { render } from 'miki-template';



    const html = render('Hello {{ name|title }}!', { name: 'alice' });

    console.log(html); // "Hello Alice!"

    ```



## Quick Example: Express App



The real power of miki-template comes with `setupExpress()` — a single function that registers the view engine, configures the views directory, and patches `res.render` so you can render partials with the `view#partial` syntax.



=== "CommonJS (require)"



    ```javascript

    const express = require('express');

    const miki = require('miki-template');



    const app = express();

    miki.setupExpress(app, { extension: 'html', views: './views' });



    app.get('/', (req, res) => res.render('home', { user: req.user }));



    app.listen(3000, () => console.log('Listening on :3000'));

    ```



=== "ES Modules (import)"



    ```javascript

    import express from 'express';

    import miki from 'miki-template';



    const app = express();

    miki.setupExpress(app, { extension: 'html', views: './views' });



    app.get('/', (req, res) => res.render('home', { user: req.user }));



    app.listen(3000, () => console.log('Listening on :3000'));

    ```



=== "Bun"



    ```typescript

    import { setupExpress } from 'miki-template';

    import express from 'express';



    const app = express();

    // Named import works; default import also works (`import miki from ...`)

    setupExpress(app, { extension: 'html', views: './views' });

    ```



## Next Steps



- [What is miki-template?](./what-is-miki-template.md)

- [Why miki-template?](./why-miki-template.md)

- [Installation Guide](./installation.md)

- [Quick Start](./quick-start.md)

- [Template Syntax & Tags](./tags.md)

- [Filters](./filters.md)

