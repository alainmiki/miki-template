# Installation

```bash
npm install miki-template
```

## Prerequisites
- **Node.js** >= 14 (ES6+ support)
- **npm** (or **yarn**) for package management

## Optional dependencies
- **express** – for server‑side rendering integration (recommended).
- **eslint** – for linting your project (dev dependency).

## Steps
1. **Add the engine** to your project:
   ```js
   const { render, compile } = require('miki-template');
   ```
2. **(Express) Register the view engine**:
   ```js
   const express = require('express');
   const { __express: renderDtpl } = require('miki-template');
   const app = express();
   app.engine('html', renderDtpl);
   app.set('view engine', 'html');
   app.set('views', './views');
   ```
3. **Run the test suite** to verify the installation:
   ```bash
   npm test
   ```

---

> The installation guide lives at `c:/Users/Coder Miki/Desktop/miki-template/docs/installation.md`.
