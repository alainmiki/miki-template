// Context Processors test using node:test
const test = require('node:test');
const assert = require('node:assert');
const { registerContextProcessor, clearContextProcessors } = require('../src/context_processors');
const { compile } = require('../src');

test('Context processor injects variable', () => {
  clearContextProcessors();
  registerContextProcessor(() => ({ siteName: 'DemoSite' }));
  const tmpl = '{{ siteName }}';
  const rendered = compile(tmpl).render({});
  assert.strictEqual(rendered, 'DemoSite');
});
