const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { findTemplateInViews, setAppTemplateDirNames } = require('../src/index.js');

test('Finder honors custom app template dir names', () => {
  const fixtures = path.join(__dirname, 'fixtures', 'views-appdirs');
  // Create a small fixture structure
  if (!fs.existsSync(path.join(fixtures, 'product', 'site'))){
    fs.mkdirSync(path.join(fixtures, 'product', 'site'), { recursive: true });
  }
  const fname = path.join(fixtures, 'product', 'site', 'detail.html');
  fs.writeFileSync(fname, '<p>detail</p>');

  setAppTemplateDirNames(['site']);
  const found = findTemplateInViews('detail', [fixtures]);
  assert.ok(found && fs.existsSync(found));
});
