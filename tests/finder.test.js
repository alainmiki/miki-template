const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { findTemplateInViews } = require('../src/index.js');

test('Template finder - nested subfolder', () => {
  const views = [path.join(__dirname, 'fixtures', 'views')];
  const found = findTemplateInViews('nested/index', views);
  assert.ok(found && fs.existsSync(found));
});

test('Template finder - bare name searches subfolders', () => {
  const views = [path.join(__dirname, 'fixtures', 'views')];
  const found = findTemplateInViews('deepfile', views);
  assert.ok(found && fs.existsSync(found));
});
