# Quick Start

## CommonJS

```javascript
const { render, compile } = require('miki-template');

const template = 'Hello {{ user.name|title }}!';
const context = { user: { name: 'alice' } };

console.log(render(template, context));
// Output: Hello Alice!
```

## ES Modules

```javascript
import { render, compile } from 'miki-template';

const template = 'Hello {{ user.name|title }}!';
const context = { user: { name: 'alice' } };

console.log(render(template, context));
// Output: Hello Alice!
```

## Express Integration

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });

app.get('/', (req, res) => res.render('home', { user: req.user }));
app.get('/card/:id', (req, res) =>
  res.render(`home#card`, { title: 'Hello', body: '...' })
);

app.listen(3000);
```

## Next Steps

- [Partial Templates](./partial-templates)
- [Template Inheritance](./template-inheritance)
- [API Reference](../api/)
