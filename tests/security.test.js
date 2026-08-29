const test = require('node:test');
const assert = require('node:assert');
const { render, markSafe } = require('../src/index');

test('Security - HTML Auto-escaping enabled by default', () => {
  const tpl = '{{ value }}';
  const output = render(tpl, { value: '<script>alert("xss")</script>' });
  assert.strictEqual(output, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
});

test('Security - safe filter disables escaping', () => {
  const tpl = '{{ value|safe }}';
  const output = render(tpl, { value: '<b>Hello</b>' });
  assert.strictEqual(output, '<b>Hello</b>');
});

test('Security - escape filter forces escaping', () => {
  // In autoescape off mode, escape filter still escapes
  const tpl = '{% autoescape off %}{{ value|escape }}{% endautoescape %}';
  const output = render(tpl, { value: '<b>Hello</b>' });
  assert.strictEqual(output, '&lt;b&gt;Hello&lt;/b&gt;');
});

test('Security - markSafe variables bypassed', () => {
  const tpl = '{{ value }}';
  const output = render(tpl, { value: markSafe('<h1>Title</h1>') });
  assert.strictEqual(output, '<h1>Title</h1>');
});
