// Test ESM import support using the real-world default import pattern.
import mikiTemplate from '../src/esm.mjs';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const {
  render,
  compile,
  SafeString,
  markSafe,
  __express,
  __expressAsync
} = mikiTemplate;

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

test('ESM - __express via default import', () => {
  assert.strictEqual(typeof mikiTemplate.__express, 'function');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'miki-esm-'));
  const tplPath = path.join(tmpDir, 'hello.html');
  fs.writeFileSync(tplPath, 'Hi {{ name }}!');
  let result;
  mikiTemplate.__express(tplPath, {}, (err, html) => {
    result = html;
  });
  assert.strictEqual(result, 'Hi !');
  fs.rmSync(tmpDir, { recursive: true });
});

test('ESM - __expressAsync via default import', async () => {
  assert.strictEqual(typeof mikiTemplate.__expressAsync, 'function');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'miki-esm-'));
  const tplPath = path.join(tmpDir, 'hello.html');
  fs.writeFileSync(tplPath, 'Hi {{ name }}!');
  const result = await mikiTemplate.__expressAsync(tplPath, {});
  assert.strictEqual(result, 'Hi !');
  fs.rmSync(tmpDir, { recursive: true });
});
