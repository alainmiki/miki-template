// tests for partialdef support, including conditionals, loops, and inline rendering
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { render, compile, renderPartialFromSource } = require('../src/index');

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

// Bug fix: partials defined inside for loops are found by renderPartialFromSource
test('renderPartialFromSource finds partials inside for loops', () => {
  const tpl = `{% for item in items %}{% partialdef loop_item %}{{ item }}{% endpartialdef %}{% endfor %}`;
  const out = renderPartialFromSource(tpl, 'loop_item', { item: 'X' });
  assert.strictEqual(out, 'X');
});

// Bug fix: include with partial selector does not leak other partials from included file
test('include with partial selector does not leak other partials', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'miki-partial-'));
  fs.writeFileSync(path.join(dir, 'main.html'), `{% include "frag.html#only_me" %}`);
  fs.writeFileSync(path.join(dir, 'frag.html'), `{% partialdef only_me %}ME{% endpartialdef %}{% partialdef secret %}SECRET{% endpartialdef %}`);
  
  const mainTpl = fs.readFileSync(path.join(dir, 'main.html'), 'utf8');
  assert.throws(
    () => renderPartialFromSource(mainTpl, 'secret', {}, { views: dir }),
    /Partial 'secret' not found/
  );
  
  fs.rmSync(dir, { recursive: true });
});

// Bug fix: full include makes all partials from included file available
test('full include makes all included partials available', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'miki-partial-full-'));
  fs.writeFileSync(path.join(dir, 'main.html'), `{% include "frag.html" %}`);
  fs.writeFileSync(path.join(dir, 'frag.html'), `{% partialdef only_me %}ME{% endpartialdef %}{% partialdef secret %}SECRET{% endpartialdef %}`);
  
  const mainTpl = fs.readFileSync(path.join(dir, 'main.html'), 'utf8');
  const out = renderPartialFromSource(mainTpl, 'secret', {}, { views: dir });
  assert.strictEqual(out, 'SECRET');
  
  fs.rmSync(dir, { recursive: true });
});

