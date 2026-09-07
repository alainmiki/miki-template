# Installation

## Requirements

- Node.js 18.x or 20.x
- npm 9+ or pnpm or yarn

## Install via npm

```bash
npm install miki-template
```

## Install via pnpm

```bash
pnpm add miki-template
```

## Install via yarn

```bash
yarn add miki-template
```

## Verify Installation

```javascript
const miki = require('miki-template');
console.log(miki.render('Hello {{ name }}!', { name: 'World' }));
// Output: Hello World!
```

## Next Steps

- [Quick Start](./quick-start)
- [Usage Guide](./quick-start)
