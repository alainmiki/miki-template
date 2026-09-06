# Getting Started

Get up and running with miki-template in under a minute.

## Installation

```bash
npm install miki-template
```

## Quick Example

```javascript
const express = require('express');
const miki = require('miki-template');

const app = express();
miki.setupExpress(app, { extension: 'html', views: './views' });

app.get('/', (req, res) => res.render('home', { user: req.user }));

app.listen(3000);
```

## Next Steps

- [What is miki-template?](./what-is-miki-template)
- [Why miki-template?](./why-miki-template)
- [Installation Guide](./installation)
- [Quick Start](./quick-start)
