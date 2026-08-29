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
