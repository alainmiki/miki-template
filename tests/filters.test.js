const test = require('node:test');
const assert = require('node:assert');
const { getFilter } = require('../src/filters');

test('Filters - Text filters', () => {
  const upper = getFilter('upper');
  assert.strictEqual(upper('hello'), 'HELLO');

  const capfirst = getFilter('capfirst');
  assert.strictEqual(capfirst('hello'), 'Hello');

  const truncatewords = getFilter('truncatewords');
  assert.strictEqual(truncatewords('one two three four', 2), 'one two ...');

  const slugify = getFilter('slugify');
  assert.strictEqual(slugify('Hello World! New-Post'), 'hello-world-new-post');
});

test('Filters - HTML / Security filters', () => {
  const safe = getFilter('safe');
  const escape = getFilter('escape');

  assert.strictEqual(String(escape('<script>')), '&lt;script&gt;');
  // Safe returns SafeString which resolves when cast to string
  assert.strictEqual(String(safe('<p>')), '<p>');
});

test('Filters - List filters', () => {
  const length = getFilter('length');
  assert.strictEqual(length([1, 2, 3]), 3);

  const join = getFilter('join');
  assert.strictEqual(join(['a', 'b', 'c'], '-'), 'a-b-c');

  const slice = getFilter('slice');
  assert.deepEqual(slice([1, 2, 3, 4], '1:3'), [2, 3]);
});

test('Filters - Default filters', () => {
  const def = getFilter('default');
  assert.strictEqual(def(null, 'fallback'), 'fallback');
  assert.strictEqual(def('value', 'fallback'), 'value');
});

test('Filters - Misc filters', () => {
  const pluralize = getFilter('pluralize');
  assert.strictEqual(pluralize(1), '');
  assert.strictEqual(pluralize(2), 's');
  assert.strictEqual(pluralize(1, 'y,ies'), 'y');
  assert.strictEqual(pluralize(2, 'y,ies'), 'ies');
});

test('Filters - urlencode and escapeuri', () => {
  const urlencode = getFilter('urlencode');
  assert.strictEqual(urlencode('hello world'), 'hello+world');
  assert.strictEqual(urlencode('a b c'), 'a+b+c');

  const escapeuri = getFilter('escapeuri');
  assert.ok(escapeuri('http://example.com/path with spaces').includes('path%20with%20spaces'));
});

test('Filters - stringformat', () => {
  const stringformat = getFilter('stringformat');
  assert.strictEqual(stringformat('hello', '%s'), 'hello');
  assert.strictEqual(stringformat(42, '%d'), '42');
  assert.strictEqual(stringformat(3.14159, '%.2f'), '3.14');
});

test('Filters - cut and addslashes', () => {
  const cut = getFilter('cut');
  assert.strictEqual(cut('hello hello', ' '), 'hellohello');

  const addslashes = getFilter('addslashes');
  assert.strictEqual(addslashes('He said "Hi"'), 'He said \\"Hi\\"');
});

test('Filters - length_is', () => {
  const length_is = getFilter('length_is');
  assert.strictEqual(length_is([1, 2, 3], 3), true);
  assert.strictEqual(length_is([1, 2], 3), false);
});

test('Filter chaining via template', () => {
  const { render } = require('../src/index');
  const result = render('{{ value|lower|capfirst }}', { value: 'Hello World' });
  assert.strictEqual(result, 'Hello world');

  const result2 = render('{{ items|length|add:5 }}', { items: [1, 2, 3] });
  assert.strictEqual(result2, '8');
});

test('Filter chaining on string literal', () => {
  const { render } = require('../src/index');
  const result = render('{{ "Hello World"|lower|capfirst }}', {});
  assert.strictEqual(result, 'Hello world');

  const result2 = render('{{ "  trim me  "|cut:" " }}', {});
  assert.strictEqual(result2, 'trimme');
});
