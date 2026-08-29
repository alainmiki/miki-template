// tests/asyncRender.test.js
const test = require('node:test');
const { asyncRender, registerHelper } = require('../src');

// Register a simple async helper that sleeps
registerHelper('sleep', async (content) => {
  const ms = parseInt(content, 10) || 0;
  await new Promise(r => setTimeout(r, ms));
  return `slept ${ms}ms`;
});

test('asyncRender with sleep helper', async () => {
  const tmpl = `{% sleep %}30{% endsleep %}`;
  const result = await asyncRender(tmpl, {});
  const assert = require('node:assert');
  assert.strictEqual(result, 'slept 30ms');
});
