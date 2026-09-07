# Quick Start



A hands-on tour of the most common miki-template workflows. Each example shows **CommonJS** and **ES Modules** side by side — pick the tab that matches your project.



## 1. Render a Template String



The `render()` function compiles and renders in one call. Perfect for email templates, static-site generation, or testing snippets.



=== "CommonJS (require)"



    ```javascript

    const { render } = require('miki-template');



    const template = 'Hello {{ user.name|title }}! Roles: {{ user.roles|join:", " }}';

    const context = {

      user: {

        name: 'miki coder',

        roles: ['admin', 'developer']

      }

    };



    const result = render(template, context);

    console.log(result);

    // Output: "Hello Miki Coder! Roles: admin, developer"

    ```



=== "ES Modules (import)"



    ```javascript

    import { render } from 'miki-template';



    const template = 'Hello {{ user.name|title }}! Roles: {{ user.roles|join:", " }}';

    const context = {

      user: {

        name: 'miki coder',

        roles: ['admin', 'developer']

      }

    };



    const result = render(template, context);

    console.log(result);

    // Output: "Hello Miki Coder! Roles: admin, developer"

    ```



## 2. Compile and Reuse



When you render the same template many times (e.g. an email template or a partial), use `compile()` to parse it once and reuse the compiled AST across many renders.



=== "CommonJS"



    ```javascript

    const { compile } = require('miki-template');



    const template = compile(

      '<h1>Hello {{ name|title }}!</h1><p>{{ body|truncatewords:20 }}</p>'

    );



    console.log(template.render({ name: 'alice', body: 'A long body of text...' }));

    console.log(template.render({ name: 'bob',   body: 'Another long body...'  }));

    ```



=== "ES Modules"



    ```javascript

    import { compile } from 'miki-template';



    const template = compile(

      '<h1>Hello {{ name|title }}!</h1><p>{{ body|truncatewords:20 }}</p>'

    );



    console.log(template.render({ name: 'alice', body: 'A long body of text...' }));

    console.log(template.render({ name: 'bob',   body: 'Another long body...'  }));

    ```



### Compiled Template Methods



The object returned by `compile()` exposes several render methods:



| Method | Description |

|--------|-------------|

| `render(context)` | Synchronous render. |

| `renderWith(context, callOptions)` | Sync render with per-call option overrides (e.g. a different `views` root). |

| `asyncRender(context)` | Async render — awaits Promise-returning helpers/filters. |

| `asyncRenderWith(context, callOptions)` | Async render with per-call option overrides. |

| `renderBlock(blockName, context)` | Render only a single `{% block %}` — ideal for HTMX/AJAX slices. |

| `renderPartial(partialName, context)` | Render only a `{% partialdef %}` block by name. |



## 3. Express: Full Page + HTMX Partials



`setupExpress()` wires everything in one call. After that, `res.render('home')` renders the full template, and `res.render('home#card')` renders only the `card` partial — no extra middleware required.



=== "CommonJS"



    ```javascript

    const express = require('express');

    const miki = require('miki-template');



    const app = express();

    miki.setupExpress(app, { extension: 'html', views: './views' });



    // Full page

    app.get('/', (req, res) => res.render('home', { user: req.user }));



    // HTMX / partial response — just append #partialName to the view name

    app.get('/partials/:name', (req, res) =>

      res.render(`home#${req.params.name}`, { user: req.user })

    );



    app.listen(3000);

    ```



=== "ES Modules"



    ```javascript

    import express from 'express';

    import miki from 'miki-template';



    const app = express();

    miki.setupExpress(app, { extension: 'html', views: './views' });



    app.get('/', (req, res) => res.render('home', { user: req.user }));

    app.get('/partials/:name', (req, res) =>

      res.render(`home#${req.params.name}`, { user: req.user })

    );



    app.listen(3000);

    ```



### Manual Express Setup (if you prefer full control)



=== "CommonJS"



    ```javascript

    const express = require('express');

    const { __express } = require('miki-template');



    const app = express();

    app.engine('html', __express);

    app.set('view engine', 'html');

    app.set('views', './views');

    ```



=== "ES Modules"



    ```javascript

    import express from 'express';

    import { __express } from 'miki-template';



    const app = express();

    app.engine('html', __express);

    app.set('view engine', 'html');

    app.set('views', './views');

    ```



## 4. Async Rendering



When your templates use async helpers or async filters, use `asyncRender()` (or `compiled.asyncRender()`).



=== "CommonJS"



    ```javascript

    const { asyncRender } = require('miki-template');



    const html = await asyncRender(

      'Hello {{ name }} — {{ fetchGreeting user.id }}',

      { name: 'World', userId: 42 }

    );

    ```



=== "ES Modules"



    ```javascript

    import { asyncRender } from 'miki-template';



    const html = await asyncRender(

      'Hello {{ name }} — {{ fetchGreeting userId }}',

      { name: 'World', userId: 42 }

    );

    ```



## 5. Defining and Rendering a Partial



Partials are reusable template fragments defined with `{% partialdef %}`.



=== "Template (home.html)"



    ```html

    {% partialdef card %}

      <div class="card">

        <h3>{{ title|default:"Untitled" }}</h3>

        <p>{{ body|truncatewords:30 }}</p>

      </div>

    {% endpartialdef %}



    {% partial card with title=entry.title body=entry.body %}

    ```



=== "CommonJS"



    ```javascript

    const { compile } = require('miki-template');



    const compiled = compile('template string here', { views: './views' });

    const html = compiled.renderPartial('card', { title: 'Hi', body: 'World' });

    ```



=== "ES Modules"



    ```javascript

    import { compile } from 'miki-template';



    const compiled = compile('template string here', { views: './views' });

    const html = compiled.renderPartial('card', { title: 'Hi', body: 'World' });

    ```



## Next Steps



- [Partial Templates](./partial-templates.md)

- [Template Inheritance](./template-inheritance.md)

- [Filters](./filters.md)

- [Tags](./tags.md)

- [API Reference](../api/index.md)

