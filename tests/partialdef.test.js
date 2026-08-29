// tests for partialdef support, including conditionals, loops, and inline rendering
const test = require('node:test');
const assert = require('node:assert');
const { render, compile } = require('../src/index');

// Basic partialdef rendering via {% partial %}
test('Partialdef basic rendering', () => {
  const tpl = `{% partialdef greeting %}Hello {{ name }}{% endpartialdef %}{% partial greeting %}`;
  const out = render(tpl, { name: 'Miki' });
  assert.strictEqual(out, 'Hello Miki');
});

// Partialdef with conditional logic
test('Partialdef with if/else', () => {
  const tpl = `{% partialdef cond %}{% if show %}Visible{% else %}Hidden{% endif %}{% endpartialdef %}{% partial cond %}`;
  assert.strictEqual(render(tpl, { show: true }), 'Visible');
  assert.strictEqual(render(tpl, { show: false }), 'Hidden');
});

// Partialdef with loop and metadata
test('Partialdef with for loop', () => {
  const tpl = `{% partialdef list %}{% for item in items %}{{ item }},{% empty %}none{% endfor %}{% endpartialdef %}{% partial list %}`;
  assert.strictEqual(render(tpl, { items: ['a', 'b'] }), 'a,b,');
  assert.strictEqual(render(tpl, { items: [] }), 'none');
});

// Inline partialdef (renders immediately)
test('Inline partialdef renders inline', () => {
  const tpl = `{% partialdef inline_example inline %}Inline {{ val }}{% endpartialdef %}`;
  const out = render(tpl, { val: 'X' });
  assert.strictEqual(out, 'Inline X');
});

// Rendering a partial via compile.renderPartial API
test('renderPartial API works', () => {
  const tpl = `{% partialdef api %}API {{ data }}{% endpartialdef %}`;
  const compiled = compile(tpl);
  const out = compiled.renderPartial('api', { data: 123 });
  assert.strictEqual(out, 'API 123');
});
