const test = require('node:test');
const assert = require('assert');
const path = require('path');
const miki = require('../../src/index.js');

test('engine partial render via render() and asyncRender()', async () => {
  const views = path.resolve(__dirname, '..', '..', 'live-test', 'views');
  const sync = miki.render('home#card', { user: 'Tester', title: 'T' }, { views });
  assert.ok(sync.includes('Card'), 'sync partial should contain Card');

  const asyncRes = await miki.asyncRender('home#card', { user: 'Tester', title: 'T' }, { views });
  assert.ok(asyncRes.includes('Card'), 'async partial should contain Card');
});
