import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { findTemplateInViews } from '../../src/esm.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('ESM Template finder - nested index', () => {
  const views = [path.join(__dirname, '..', 'fixtures', 'views')];
  const found = findTemplateInViews('nested/index', views);
  assert.ok(found && typeof found === 'string');
});
