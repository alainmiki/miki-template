const test = require('node:test');
const assert = require('node:assert');
const { tokenize } = require('../src/lexer');

test('Lexer - plain text tokenizing', () => {
  const tokens = tokenize('Hello World');
  assert.strictEqual(tokens.length, 1);
  assert.strictEqual(tokens[0].type, 'text');
  assert.strictEqual(tokens[0].content, 'Hello World');
});

test('Lexer - variable tokenizing', () => {
  const tokens = tokenize('Hello {{ name }}!');
  assert.strictEqual(tokens.length, 3);
  assert.strictEqual(tokens[0].content, 'Hello ');
  assert.strictEqual(tokens[1].type, 'var');
  assert.strictEqual(tokens[1].content, 'name');
  assert.strictEqual(tokens[2].content, '!');
});

test('Lexer - block tag tokenizing', () => {
  const tokens = tokenize('{% if active %}Yes{% endif %}');
  assert.strictEqual(tokens.length, 3);
  assert.strictEqual(tokens[0].type, 'block');
  assert.strictEqual(tokens[0].content, 'if active');
  assert.strictEqual(tokens[1].content, 'Yes');
  assert.strictEqual(tokens[2].type, 'block');
  assert.strictEqual(tokens[2].content, 'endif');
});

test('Lexer - inline comment exclusion', () => {
  const tokens = tokenize('Before {# comment #} After');
  assert.strictEqual(tokens.length, 2);
  assert.strictEqual(tokens[0].content, 'Before ');
  assert.strictEqual(tokens[1].content, ' After');
});

test('Lexer - verbatim tag handling', () => {
  const tokens = tokenize('Text {% verbatim %} {{ unparsed }} {% endverbatim %} End');
  assert.strictEqual(tokens.length, 3);
  assert.strictEqual(tokens[0].content, 'Text ');
  assert.strictEqual(tokens[1].type, 'text');
  assert.strictEqual(tokens[1].content, ' {{ unparsed }} ');
  assert.strictEqual(tokens[2].content, ' End');
});
