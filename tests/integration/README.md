# Express Integration Test (CommonJS + ESM)

This is a **real**, end-to-end integration test for `miki-template` with Express. It:

- Spins up **actual Express HTTP servers** (one CJS, one ESM).
- Uses `app.engine('html', renderDtpl)` AND `app.engine('miki', renderDtpl)`.
- Verifies both file extensions render correctly via real `res.render()`.
- Performs real HTTP `fetch` requests against the listening servers and asserts the rendered HTML.
- Verifies ESM `import` syntax (named + default) and CommonJS `require` syntax both work.

## What it proves to users

```js
// CommonJS
const express = require('express');
const { __express: renderDtpl } = require('miki-template');
const app = express();
app.engine('html', renderDtpl);
app.engine('miki', renderDtpl);
```

```js
// ESM
import express from 'express';
import { __express as renderDtpl } from 'miki-template';
import mikiTemplate from 'miki-template'; // default import also works
const app = express();
app.engine('html', renderDtpl);
app.engine('miki', renderDtpl);
```

Both forms register the engine for `.html` and `.miki` extensions, just as the README documents.
