# Advanced Usage

This document showcases real‑world examples of the **miki‑template** engine.

## 1. Partial Definition & Inclusion
```django
{% partialdef "header" %}
<header>
  <h1>{{ site.title }}</h1>
</header>
{% endpartialdef %}

{% include "header" %}
```
*Result:* Renders a reusable header component.

---
## 2. Custom Tag Helper – Markdown
```js
const { registerHelper } = require('./src/tags/helpers');
const markdownIt = require('markdown-it')();
registerHelper('markdown', (content) => markdownIt.render(content));
```
```django
{% markdown %}
# Hello World
* Item 1
* Item 2
{% endmarkdown %}
```
*Result:* Converts markdown to HTML on‑the‑fly.

---
## 3. Async Rendering with a Sleep Helper
```js
registerHelper('sleep', async (content) => {
  await new Promise(r => setTimeout(r, 50));
  return `Awake after ${content}`;
});
```
```django
{% sleep %}50ms{% endsleep %}
```
```js
const { asyncRender } = require('./src');
asyncRender(template, {} ).then(console.log);
```
*Result:* `Awake after 50ms`

---
## 4. Extended Date Formatting
```django
{{ now|date_format:"yyyy-MM-dd HH:mm:ss" }}
```
*Result:* `2026-08-29 13:48:07`
### Additional Date Filter Examples

```django
{{ now|strftime:"PPpp" }}          {# Full date-fns pattern #}
{{ now|date:"Y-m-d H:i:s" }}        {# Django style with seconds #}
{{ now|time:"H:i:s" }}              {# Time only #}
```

*Result:* Example outputs will appear when rendered.

---
## 5. Performance Benchmark (see `benchmarks/run.js`)
The benchmark renders three template sizes (small, medium, large) synchronously and asynchronously, reporting average render time and cache hit ratio.

---
> **Tip:** All examples work with the default Express integration via `app.engine('dtpl', require('miki-template').__express);`
