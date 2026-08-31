// Test ESM import support
import { render, compile, SafeString, markSafe } from '../src/esm.mjs';
import test from 'node:test';
import assert from 'node:assert';

test('ESM - default named imports', () => {
  const result = render('Hello {{ name }}!', { name: 'ESM' });
  assert.strictEqual(result, 'Hello ESM!');
});

test('ESM - compile import', () => {
  const compiled = compile('Hi {{ user }}!');
  assert.strictEqual(compiled.render({ user: 'World' }), 'Hi World!');
});

test('ESM - SafeString import', () => {
  const html = new SafeString('<b>Bold</b>');
  const result = render('{{ html }}', { html });
  assert.strictEqual(result, '<b>Bold</b>');
});

test('ESM - markSafe import', () => {
  const safe = markSafe('<i>Italic</i>');
  const result = render('{{ x }}', { x: safe });
  assert.strictEqual(result, '<i>Italic</i>');
});
