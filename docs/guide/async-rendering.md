# Async Rendering

miki-template supports async rendering for templates that use async filters, async custom tags, or async library components. Use `asyncRender()` instead of `render()` to await these operations.

## Table of Contents

- [When to Use Async Rendering param($m) if ($m.Groups[1].Value -notmatch '\.md
- [asyncRender() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#asyncrender.md' 
- [compiled.asyncRender() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#compiledasyncrender.md' 
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-custom-tags.md' 
- [Express Async Engine param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-async-engine.md' 

---

## When to Use Async Rendering

Use `asyncRender()` when your templates contain any of the following:

- **Async filters** — filters that return Promises
- **Async custom tags** — custom tags whose `render()` returns a Promise
- **Async library components** — i18n translations loaded dynamically
- **Async helpers** — helpers that perform I/O

If you use async features with `render()` or `compiled.render()`, the engine throws:

> Async node encountered during sync render. Use asyncRender() instead.

## asyncRender()

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

### With Views and Partials

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    // Render a single partial from a file
    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

## compiled.asyncRender()

When you pre-compile a template, the returned object has `asyncRender()` and `asyncRenderWith()` methods:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

## Async Filters

Filters that return Promises are automatically awaited when using `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

Usage:

```html
{{ api_endpoint|fetch_url }}
```

**Real-world CMS content fetch:**

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

## Async Custom Tags

Custom tags whose `render()` returns a Promise work with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

## Express Async Engine

For Express apps with async templates, use `__expressAsync` or `express({ async: true })`:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

### Express 5+ Native Promise Support

If you're using Express 5 (which supports Promise-based view engines), use `__expressAsync` directly:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    app.engine('html', miki.__expressAsync);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    app.engine('html', miki.__expressAsync);
    ```

## asyncRenderWith()

Override compile-time options at render time:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

## Next Steps

- [Custom Filters: Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-filters#async-filters.md' 
- [Custom Tags: Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-tags#async-custom-tags.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [asyncRender() param($m) if ($m.Groups[1].Value -notmatch '\.md
- [compiled.asyncRender() param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#compiledasyncrender.md' 
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-custom-tags.md' 
- [Express Async Engine param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-async-engine.md' 

---

## When to Use Async Rendering

Use `asyncRender()` when your templates contain any of the following:

- **Async filters** — filters that return Promises
- **Async custom tags** — custom tags whose `render()` returns a Promise
- **Async library components** — i18n translations loaded dynamically
- **Async helpers** — helpers that perform I/O

If you use async features with `render()` or `compiled.render()`, the engine throws:

> Async node encountered during sync render. Use asyncRender() instead.

## asyncRender()

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

### With Views and Partials

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    // Render a single partial from a file
    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

## compiled.asyncRender()

When you pre-compile a template, the returned object has `asyncRender()` and `asyncRenderWith()` methods:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

## Async Filters

Filters that return Promises are automatically awaited when using `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

Usage:

```html
{{ api_endpoint|fetch_url }}
```

**Real-world CMS content fetch:**

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

## Async Custom Tags

Custom tags whose `render()` returns a Promise work with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

## Express Async Engine

For Express apps with async templates, use `__expressAsync` or `express({ async: true })`:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

### Express 5+ Native Promise Support

If you're using Express 5 (which supports Promise-based view engines), use `__expressAsync` directly:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    app.engine('html', miki.__expressAsync);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    app.engine('html', miki.__expressAsync);
    ```

## asyncRenderWith()

Override compile-time options at render time:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

## Next Steps

- [Custom Filters: Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-filters#async-filters.md' 
- [Custom Tags: Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-tags#async-custom-tags.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [compiled.asyncRender() param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-filters.md' 
- [Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-custom-tags.md' 
- [Express Async Engine param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-async-engine.md' 

---

## When to Use Async Rendering

Use `asyncRender()` when your templates contain any of the following:

- **Async filters** — filters that return Promises
- **Async custom tags** — custom tags whose `render()` returns a Promise
- **Async library components** — i18n translations loaded dynamically
- **Async helpers** — helpers that perform I/O

If you use async features with `render()` or `compiled.render()`, the engine throws:

> Async node encountered during sync render. Use asyncRender() instead.

## asyncRender()

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

### With Views and Partials

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    // Render a single partial from a file
    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

## compiled.asyncRender()

When you pre-compile a template, the returned object has `asyncRender()` and `asyncRenderWith()` methods:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

## Async Filters

Filters that return Promises are automatically awaited when using `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

Usage:

```html
{{ api_endpoint|fetch_url }}
```

**Real-world CMS content fetch:**

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

## Async Custom Tags

Custom tags whose `render()` returns a Promise work with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

## Express Async Engine

For Express apps with async templates, use `__expressAsync` or `express({ async: true })`:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

### Express 5+ Native Promise Support

If you're using Express 5 (which supports Promise-based view engines), use `__expressAsync` directly:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    app.engine('html', miki.__expressAsync);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    app.engine('html', miki.__expressAsync);
    ```

## asyncRenderWith()

Override compile-time options at render time:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

## Next Steps

- [Custom Filters: Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-filters#async-filters.md' 
- [Custom Tags: Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-tags#async-custom-tags.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Async Filters param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#async-custom-tags.md' 
- [Express Async Engine param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-async-engine.md' 

---

## When to Use Async Rendering

Use `asyncRender()` when your templates contain any of the following:

- **Async filters** — filters that return Promises
- **Async custom tags** — custom tags whose `render()` returns a Promise
- **Async library components** — i18n translations loaded dynamically
- **Async helpers** — helpers that perform I/O

If you use async features with `render()` or `compiled.render()`, the engine throws:

> Async node encountered during sync render. Use asyncRender() instead.

## asyncRender()

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

### With Views and Partials

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    // Render a single partial from a file
    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

## compiled.asyncRender()

When you pre-compile a template, the returned object has `asyncRender()` and `asyncRenderWith()` methods:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

## Async Filters

Filters that return Promises are automatically awaited when using `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

Usage:

```html
{{ api_endpoint|fetch_url }}
```

**Real-world CMS content fetch:**

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

## Async Custom Tags

Custom tags whose `render()` returns a Promise work with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

## Express Async Engine

For Express apps with async templates, use `__expressAsync` or `express({ async: true })`:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

### Express 5+ Native Promise Support

If you're using Express 5 (which supports Promise-based view engines), use `__expressAsync` directly:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    app.engine('html', miki.__expressAsync);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    app.engine('html', miki.__expressAsync);
    ```

## asyncRenderWith()

Override compile-time options at render time:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

## Next Steps

- [Custom Filters: Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-filters#async-filters.md' 
- [Custom Tags: Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-tags#async-custom-tags.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Async Custom Tags param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Express Async Engine param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '#express-async-engine.md' 

---

## When to Use Async Rendering

Use `asyncRender()` when your templates contain any of the following:

- **Async filters** — filters that return Promises
- **Async custom tags** — custom tags whose `render()` returns a Promise
- **Async library components** — i18n translations loaded dynamically
- **Async helpers** — helpers that perform I/O

If you use async features with `render()` or `compiled.render()`, the engine throws:

> Async node encountered during sync render. Use asyncRender() instead.

## asyncRender()

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

### With Views and Partials

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    // Render a single partial from a file
    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

## compiled.asyncRender()

When you pre-compile a template, the returned object has `asyncRender()` and `asyncRenderWith()` methods:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

## Async Filters

Filters that return Promises are automatically awaited when using `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

Usage:

```html
{{ api_endpoint|fetch_url }}
```

**Real-world CMS content fetch:**

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

## Async Custom Tags

Custom tags whose `render()` returns a Promise work with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

## Express Async Engine

For Express apps with async templates, use `__expressAsync` or `express({ async: true })`:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

### Express 5+ Native Promise Support

If you're using Express 5 (which supports Promise-based view engines), use `__expressAsync` directly:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    app.engine('html', miki.__expressAsync);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    app.engine('html', miki.__expressAsync);
    ```

## asyncRenderWith()

Override compile-time options at render time:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

## Next Steps

- [Custom Filters: Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-filters#async-filters.md' 
- [Custom Tags: Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-tags#async-custom-tags.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Express Async Engine param($m) if ($m.Groups[1].Value -notmatch '\.md

---

## When to Use Async Rendering

Use `asyncRender()` when your templates contain any of the following:

- **Async filters** — filters that return Promises
- **Async custom tags** — custom tags whose `render()` returns a Promise
- **Async library components** — i18n translations loaded dynamically
- **Async helpers** — helpers that perform I/O

If you use async features with `render()` or `compiled.render()`, the engine throws:

> Async node encountered during sync render. Use asyncRender() instead.

## asyncRender()

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

### With Views and Partials

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    // Render a single partial from a file
    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

## compiled.asyncRender()

When you pre-compile a template, the returned object has `asyncRender()` and `asyncRenderWith()` methods:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

## Async Filters

Filters that return Promises are automatically awaited when using `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

Usage:

```html
{{ api_endpoint|fetch_url }}
```

**Real-world CMS content fetch:**

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

## Async Custom Tags

Custom tags whose `render()` returns a Promise work with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

## Express Async Engine

For Express apps with async templates, use `__expressAsync` or `express({ async: true })`:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

### Express 5+ Native Promise Support

If you're using Express 5 (which supports Promise-based view engines), use `__expressAsync` directly:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    app.engine('html', miki.__expressAsync);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    app.engine('html', miki.__expressAsync);
    ```

## asyncRenderWith()

Override compile-time options at render time:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

## Next Steps

- [Custom Filters: Async Filters param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-filters#async-filters.md' 
- [Custom Tags: Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-tags#async-custom-tags.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 

---

## When to Use Async Rendering

Use `asyncRender()` when your templates contain any of the following:

- **Async filters** — filters that return Promises
- **Async custom tags** — custom tags whose `render()` returns a Promise
- **Async library components** — i18n translations loaded dynamically
- **Async helpers** — helpers that perform I/O

If you use async features with `render()` or `compiled.render()`, the engine throws:

> Async node encountered during sync render. Use asyncRender() instead.

## asyncRender()

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('Hello, {{ name }}!', { name: 'World' });
    console.log(html);
    // → "Hello, World!"
    ```

### With Views and Partials

=== "CommonJS"

    ```javascript
    const { asyncRender } = require('miki-template');

    // Render a single partial from a file
    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

=== "ES Modules"

    ```javascript
    import { asyncRender } from 'miki-template';

    const html = await asyncRender('home#card', { user: userData }, {
      views: './templates'
    });
    ```

## compiled.asyncRender()

When you pre-compile a template, the returned object has `asyncRender()` and `asyncRenderWith()` methods:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const template = `
      {% load markdown %}
      {{ content|markdown }}
    `;

    const compiled = compile(template);
    const html = await compiled.asyncRender({ content: '# Hello World' });
    ```

## Async Filters

Filters that return Promises are automatically awaited when using `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('to_upper', (val) => val.toUpperCase());
    registerFilter('fetch_url', async (url) => {
      const res = await fetch(url);
      return res.text();
    });
    ```

Usage:

```html
{{ api_endpoint|fetch_url }}
```

**Real-world CMS content fetch:**

=== "CommonJS"

    ```javascript
    const { registerFilter, asyncRender } = require('miki-template');

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerFilter, asyncRender } from 'miki-template';

    registerFilter('cms_content', async (id) => {
      const res = await fetch(`https://cms.example.com/api/content/${id}`);
      const data = await res.json();
      return data.html;
    });

    const html = await asyncRender(
      '{% autoescape off %}{{ page_id|cms_content }}{% endautoescape %}',
      { page_id: 'about' }
    );
    ```

## Async Custom Tags

Custom tags whose `render()` returns a Promise work with `asyncRender()`:

=== "CommonJS"

    ```javascript
    const { registerTag, asyncRender } = require('miki-template');

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

=== "ES Modules"

    ```javascript
    import { registerTag, asyncRender } from 'miki-template';

    registerTag('api_data', (tagContent, parser) => {
      const endpoint = tagContent.trim();
      return {
        async render(context) {
          const res = await fetch(context.get(endpoint));
          const data = await res.json();
          return JSON.stringify(data, null, 2);
        }
      };
    });

    const html = await asyncRender(
      '{% api_data api_url %}',
      { api_url: 'https://api.example.com/users' }
    );
    ```

## Express Async Engine

For Express apps with async templates, use `__expressAsync` or `express({ async: true })`:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    const app = express();
    app.engine('html', miki.express({ async: true }));
    app.set('view engine', 'html');
    app.set('views', './views');
    ```

### Express 5+ Native Promise Support

If you're using Express 5 (which supports Promise-based view engines), use `__expressAsync` directly:

=== "CommonJS"

    ```javascript
    const express = require('express');
    const miki = require('miki-template');

    app.engine('html', miki.__expressAsync);
    ```

=== "ES Modules"

    ```javascript
    import express from 'express';
    import miki from 'miki-template';

    app.engine('html', miki.__expressAsync);
    ```

## asyncRenderWith()

Override compile-time options at render time:

=== "CommonJS"

    ```javascript
    const { compile } = require('miki-template');

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

=== "ES Modules"

    ```javascript
    import { compile } from 'miki-template';

    const compiled = compile(template, { views: './views' });

    const html = await compiled.asyncRenderWith(
      { user: userData },
      { views: './other-views', customOption: true }
    );
    ```

## Next Steps

- [Custom Filters: Async Filters param($m) if ($m.Groups[1].Value -notmatch '\.md
- [Custom Tags: Async Custom Tags param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', './custom-tags#async-custom-tags.md' 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [Custom Tags: Async Custom Tags param($m) if ($m.Groups[1].Value -notmatch '\.md
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
) { $m.Groups[1].Value + '.md' + '#' + $m.Groups[2].Value } else { $m.Value } 
- [API Reference: asyncRender param($m) $m.Value -replace '([a-z][a-z0-9/-]*)(?<!\.md)', '../api/async-render.md.md' 
