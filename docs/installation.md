# Installation

## npm
```bash
npm install miki-template
```

## Prerequisites
- **Node.js** >= 14 (ES6+ support)
- **npm** (or **yarn**) for package management

## Optional dependencies
- **express** – for server‑side rendering integration (recommended).
- **eslint** – for linting your project (dev dependency).

## Module System Support

`miki-template` supports both **CommonJS** (`require`) and **ESM** (`import`).

### CommonJS (CJS)

```js
const { render, compile, __express, SafeString, markSafe } = require('miki-template');
```

### ES Modules (ESM)

```js
// Named imports
import { render, compile, __express, SafeString, markSafe } from 'miki-template';

// Default import (all exports)
import miki from 'miki-template';
const result = miki.render('Hello {{ name }}', { name: 'World' });
```

> **Note:** When using ESM in Node.js, either name your files `.mjs` or set `"type": "module"` in your `package.json`.

## Publishing to npm

This project is configured for automatic npm publishing via GitHub Actions. When you push to `main`, the CI workflow runs tests and, if they pass, publishes the package to npm.

### Prerequisites for publishing

1. You must have an npm account and be a maintainer of the `miki-template` package on npm.
2. In your GitHub repository, go to **Settings → Secrets and variables → Actions**.
3. Add a new repository secret named `NPM_TOKEN` with your npm automation token.
   - Generate it at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Select **Automation** as the token type.

The CI workflow will then automatically publish on every push to `main`.

### Manual publishing

```bash
npm version patch   # or minor/major
npm publish --access public
```

---

## Quick Start

### 1. Add the engine to your project

**CJS:**
```js
const { render, compile } = require('miki-template');
```

**ESM:**
```js
import { render, compile } from 'miki-template';
```

### 2. (Express) Register the view engine

**CJS:**
```js
const express = require('express');
const { __express: renderDtpl } = require('miki-template');
const app = express();
app.engine('html', renderDtpl);
app.set('view engine', 'html');
app.set('views', './views');
```

**ESM:**
```js
import express from 'express';
import { __express as renderDtpl } from 'miki-template';

const app = express();
app.engine('html', renderDtpl);
app.set('view engine', 'html');
app.set('views', './views');
```

### 3. Run the test suite to verify

```bash
npm test
```

---

