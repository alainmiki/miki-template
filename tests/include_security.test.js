const test = require('node:test');
const assert = require('node:assert');
const { render } = require('../src/index');

test('Security - include path traversal prevented', () => {
  const tpl = `{% include "../secret.html" %}`;
  // Expect an error indicating path traversal
  assert.throws(() => render(tpl, {}, { views: '.' }), /path traversal/);
});
