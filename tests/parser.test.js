const test = require('node:test');
const assert = require('node:assert');
const { parseVariableExpression } = require('../src/parser');
const { Context } = require('../src/context');

test('Parser - variable expression parsing', () => {
  const res = parseVariableExpression('user.name|lower|default:"Guest"');
  assert.strictEqual(res.varPath, 'user.name');
  assert.strictEqual(res.filters.length, 2);
  
  assert.strictEqual(res.filters[0].name, 'lower');
  assert.strictEqual(res.filters[0].arg, null);

  assert.strictEqual(res.filters[1].name, 'default');
  assert.strictEqual(res.filters[1].arg.type, 'literal');
  assert.strictEqual(res.filters[1].arg.value, 'Guest');
});

test('Context - basic dotted lookups', () => {
  const ctx = new Context({
    user: {
      profile: {
        name: 'Miki',
        age: 30
      }
    },
    items: ['apple', 'banana']
  });

  assert.strictEqual(ctx.get('user.profile.name'), 'Miki');
  assert.strictEqual(ctx.get('user.profile.age'), 30);
  assert.strictEqual(ctx.get('items.1'), 'banana');
  // Missing key now returns undefined (so filters like default_if_none
  // can detect missing values) instead of empty string.
  assert.strictEqual(ctx.get('user.profile.missing'), undefined);
});

test('Context - scope pushing and popping', () => {
  const ctx = new Context({ name: 'Global' });
  ctx.push({ name: 'Local', age: 25 });

  assert.strictEqual(ctx.get('name'), 'Local');
  assert.strictEqual(ctx.get('age'), 25);

  ctx.pop();
  assert.strictEqual(ctx.get('name'), 'Global');
  assert.strictEqual(ctx.get('age'), undefined);
});

test('Context - automatic function calling', () => {
  const ctx = new Context({
    user: {
      getName: () => 'Dynamic Name'
    }
  });
  assert.strictEqual(ctx.get('user.getName'), 'Dynamic Name');
});
