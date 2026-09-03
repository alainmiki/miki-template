/**
 * Real-world ESM integration test for miki-template.
 *
 * This file uses ACTUAL `import` statements (not dynamic import workarounds)
 * to validate every public feature of the engine through a real Express
 * HTTP server.
 *
 * Coverage:
 *   1. Named imports + default import
 *   2. All built-in control tags
 *   3. All built-in utility tags
 *   4. i18n tags
 *   5. Inheritance (extends, block, block.super)
 *   6. Includes (with partial selector support)
 *   7. Partials (partialdef, partial with `with`, inline, renderPartial)
 *   8. Block rendering (renderBlock)
 *   9. Every built-in filter
 *  10. Context processors
 *  11. Custom tags, filters, helpers
 *  12. Libraries
 *  13. Async rendering
 *  14. Cache
 *  15. Edge cases (errors, security, scoping)
 *  16. Comprehensive `with` tag (all forms)
 *  17. Comprehensive partial tag (all forms, inline, with-args, default rendering)
 *  18. Comprehensive include with #partial selector
 *  19. URL tag (deep routing, kwargs, mapped to real Express routes)
 *  20. Real-world dir/home.html end-to-end over HTTP
 *  21. Real-world combined scenarios
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Named imports + default import — the two patterns users will write
import mikiTemplate, {
  __express as renderDtpl,
  __expressAsync as renderDtplAsync,
  render,
  compile,
  asyncRender,
  renderPartialFromFile,
  expressPartialRenderer,
  setupExpress,
  registerContextProcessor,
  clearContextProcessors,
  registerFilter,
  registerTag,
  registerHelper,
  registerLibrary,
  setLanguage,
  setFallbackLanguage,
  registerTranslation,
  unregisterTranslation,
  getAvailableLanguages,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml,
  clearCache
} from 'miki-template';

// Ensure no context processors from another test file leak in
clearContextProcessors();

const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'miki-mjs-'));

function makeViewDir(name, files) {
  const dir = path.join(TMP_ROOT, name);
  fs.mkdirSync(dir, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

function startApp(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        port,
        close: () => new Promise((r) => server.close(() => r()))
      });
    });
    server.on('error', reject);
  });
}

function get(port, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: urlPath }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, body: data })
      );
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('HTTP timeout')));
  });
}

function renderString(tpl, ctx = {}, options = {}) {
  return render(tpl, ctx, options);
}

// ============================================================================
// 1. IMPORT SHAPES
// ============================================================================

test('ESM: named imports expose the full public API', () => {
  assert.equal(typeof renderDtpl, 'function');
  assert.equal(typeof renderDtplAsync, 'function');
  assert.equal(typeof render, 'function');
  assert.equal(typeof compile, 'function');
  assert.equal(typeof registerContextProcessor, 'function');
  assert.equal(typeof registerFilter, 'function');
  assert.equal(typeof registerTag, 'function');
  assert.equal(typeof registerHelper, 'function');
  assert.equal(typeof SafeString, 'function');
  assert.equal(typeof markSafe, 'function');
  assert.equal(typeof isSafe, 'function');
  assert.equal(typeof escapeHtml, 'function');
  assert.equal(typeof clearCache, 'function');
});

test('ESM: default import is the same module surface as named imports', () => {
  assert.equal(typeof mikiTemplate, 'object');
  assert.equal(mikiTemplate.__express, renderDtpl);
  assert.equal(mikiTemplate.render, render);
  assert.equal(mikiTemplate.compile, compile);
  assert.equal(mikiTemplate.registerFilter, registerFilter);
  assert.equal(mikiTemplate.registerTag, registerTag);
  assert.equal(mikiTemplate.SafeString, SafeString);
});

test('ESM: real-world pattern `import mikiTemplate from "miki-template"`', () => {
  // The exact pattern the README documents.
  const renderDtpl2 = mikiTemplate.__express;
  assert.equal(typeof renderDtpl2, 'function');
  assert.equal(renderDtpl2, renderDtpl);
});

// ============================================================================
// 2. CONTROL TAGS
// ============================================================================

test('TAG if/elif/else: all branches over real HTTP', async () => {
  const dir = makeViewDir('if-branches-mjs', {
    'tpl.html': `{% if role == "admin" %}A{% elif role == "user" %}U{% else %}G{% endif %}`
  });
  const app = express();
  app.engine('html', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', dir);

  for (const role of ['admin', 'user', 'guest']) {
    app.get('/' + role, (req, res) => res.render('tpl', { role }));
  }
  const { port, close } = await startApp(app);
  try {
    assert.equal((await get(port, '/admin')).body, 'A');
    assert.equal((await get(port, '/user')).body, 'U');
    assert.equal((await get(port, '/guest')).body, 'G');
  } finally {
    await close();
  }
});

test('TAG if: all comparison operators (== != < <= > >= in not in and or not)', () => {
  assert.equal(renderString('{% if 5 == 5 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if 5 != 6 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if 5 < 6 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if 5 <= 5 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if 6 > 5 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if 6 >= 6 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if 3 in nums %}Y{% endif %}', { nums: [1, 2, 3] }), 'Y');
  assert.equal(renderString('{% if 4 not in nums %}Y{% endif %}', { nums: [1, 2, 3] }), 'Y');
  assert.equal(renderString('{% if true and 1 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if false or 1 %}Y{% endif %}'), 'Y');
  assert.equal(renderString('{% if not false %}Y{% endif %}'), 'Y');
});

test('TAG for: empty and non-empty bodies', () => {
  assert.equal(renderString('{% for x in xs %}{{ x }}{% empty %}EMPTY{% endfor %}', { xs: [] }), 'EMPTY');
  assert.equal(renderString('{% for x in xs %}{{ x }}{% empty %}EMPTY{% endfor %}', { xs: [1, 2, 3] }), '123');
});

test('TAG for: forloop metadata (counter, counter0, revcounter, first, last, parentloop)', () => {
  const out = renderString(
    '{% for x in outer %}{% for y in inner %}{{ forloop.parentloop.counter }}.{{ forloop.counter }}|{{ y }}{% endfor %}{% endfor %}',
    { outer: [1, 2], inner: ['a', 'b', 'c'] }
  );
  assert.equal(out, '1.1|a1.2|b1.3|c2.1|a2.2|b2.3|c');
});

test('TAG for: dictionary iteration with key,value unpack', () => {
  const out = renderString('{% for k,v in d %}{{ k }}={{ v }};{% endfor %}', { d: { a: 1, b: 2 } });
  assert.match(out, /a=1;/);
  assert.match(out, /b=2;/);
});

test('TAG with: scopes a single variable via `as`', () => {
  const out = renderString('{% with user.name as n %}Hi {{ n }}{% endwith %}', { user: { name: 'Bob' } });
  assert.equal(out, 'Hi Bob');
});

test('TAG with: multi-assignment key=value with string literals', () => {
  const out = renderString('{% with greeting="Hello", who="World" %}{{ greeting }} {{ who }}{% endwith %}');
  assert.equal(out, 'Hello World');
});

test('TAG with: multi-assignment with quoted value containing comma', () => {
  const out = renderString('{% with msg="Hello, World" %}{{ msg }}{% endwith %}');
  assert.equal(out, 'Hello, World');
});

test('TAG with: numeric and boolean literals', () => {
  const out = renderString('{% with n=42, flag=true %}{{ n }}-{{ flag }}{% endwith %}');
  assert.equal(out, '42-true');
});

test('TAG cycle: rotates through values', () => {
  const out = renderString('{% for x in xs %}{% cycle "a" "b" "c" %}{% endfor %}', { xs: [1, 2, 3, 4, 5] });
  assert.equal(out, 'abcab');
});

test('TAG cycle: `as` form stores the value but emits nothing (Django semantics)', () => {
  const out = renderString('{% for x in xs %}{% cycle "A" "B" as c %}{{ c }}{% endfor %}', { xs: [1, 2, 3, 4] });
  assert.equal(out, 'ABAB');
});

test('TAG firstof: returns first truthy value', () => {
  assert.equal(renderString('{% firstof a b c %}', { a: '', b: null, c: 'C' }), 'C');
  assert.equal(renderString('{% firstof a b c %}', { a: 'A' }), 'A');
  assert.equal(renderString('{% firstof a b c %}', {}), '');
});

test('TAG comment: block comments are stripped', () => {
  assert.equal(renderString('before{% comment %}INNER{% endcomment %}after'), 'beforeafter');
});

test('TAG autoescape: controls escaping for a block', () => {
  assert.equal(renderString('{% autoescape off %}{{ x }}{% endautoescape %}', { x: '<a>' }), '<a>');
  assert.equal(renderString('{% autoescape on %}{{ x }}{% endautoescape %}', { x: '<a>' }), '&lt;a&gt;');
});

// ============================================================================
// 3. UTILITY TAGS
// ============================================================================

test('TAG static: builds /static/<path> with default and custom prefix', () => {
  assert.equal(renderString('{% static "css/style.css" %}'), '/static/css/style.css');
  assert.equal(renderString('{% static "img.png" %}', {}, { staticUrl: '/cdn/' }), '/cdn/img.png');
});

test('TAG url: fallback URL builder + urlHelper override with literal args', () => {
  // Dotted route names are converted to deep paths in the fallback
  // builder (e.g. "user.show" -> "/user/show").
  assert.equal(renderString('{% url "user.show" "42" %}'), '/user/show/42');
  // urlHelper override receives positional args
  const out2 = renderString('{% url "user.show" "42" %}', {}, {
    urlHelper: (name, id) => `/users/${id}`
  });
  assert.equal(out2, '/users/42');
  // Numeric literal also resolves
  const out3 = renderString('{% url "user.show" 42 %}', {}, {
    urlHelper: (name, id) => `/users/${id}`
  });
  assert.equal(out3, '/users/42');
});

test('TAG url: deep routing (dotted route names become nested paths)', () => {
  // "user.profile.posts.show" -> "/user/profile/posts/show"
  assert.equal(
    renderString('{% url "user.profile.posts.show" %}'),
    '/user/profile/posts/show'
  );
  // With positional args
  assert.equal(
    renderString('{% url "user.profile.posts.show" 34 12 %}'),
    '/user/profile/posts/show/34/12'
  );
  // With kwargs (appended as query string in fallback)
  assert.equal(
    renderString('{% url "user.show" userId=34 tab="posts" %}'),
    '/user/show?userId=34&tab=posts'
  );
  // With both positional and kwargs
  assert.equal(
    renderString('{% url "user.show" 34 tab="posts" %}'),
    '/user/show/34?tab=posts'
  );
  // urlHelper receives kwargs as last arg when present
  const out = renderString('{% url "user.show" 34 tab="posts" %}', {}, {
    urlHelper: (name, id, kw) => `/${name}/${id}?tab=${kw.tab}`
  });
  assert.equal(out, '/user.show/34?tab=posts');
});

test('TAG regroup: groups list by attribute', () => {
  const out = renderString(
    '{% regroup people by gender as groups %}{% for g in groups %}{{ g.grouper }}:{{ g.list|length }};{% endfor %}',
    { people: [{ gender: 'm' }, { gender: 'f' }, { gender: 'm' }] }
  );
  assert.equal(out, 'm:2;f:1;');
});

test('TAG spaceless: strips whitespace between tags', () => {
  const out = renderString('{% spaceless %}<div>   <span>  x  </span>   </div>{% endspaceless %}');
  assert.equal(out, '<div><span>  x  </span></div>');
});

test('TAG csrf_token: emits hidden input with csrf_token from context', () => {
  const out = renderString('{% csrf_token %}', { csrf_token: 'abc123' });
  assert.match(out, /type="hidden"/);
  assert.match(out, /name="csrfmiddlewaretoken"/);
  assert.match(out, /value="abc123"/);
});

test('TAG csp_nonce_attr: emits nonce attr when csp_nonce in context', () => {
  const withNonce = renderString('<script {% csp_nonce_attr %}></script>', { csp_nonce: 'xyz' });
  assert.match(withNonce, /nonce="xyz"/);
  const withoutNonce = renderString('<script {% csp_nonce_attr %}></script>', {});
  assert.ok(!withoutNonce.includes('nonce='));
});

test('TAG widthratio: calculates ratio * maxWidth', () => {
  assert.equal(renderString('{% widthratio 50 200 100 %}'), '25');
  assert.equal(renderString('{% widthratio 0 200 100 %}'), '0');
  assert.equal(renderString('{% widthratio 200 200 100 %}'), '100');
});

test('TAG debug: dumps context scopes as <pre>JSON (HTML-escaped)', () => {
  const out = renderString('{% debug %}', { foo: 'bar', n: 1 });
  assert.match(out, /<pre>/);
  assert.match(out, /&quot;foo&quot;/);
  assert.ok(out.includes('foo'));
  assert.ok(out.includes('bar'));
});

test('TAG templatetag: returns the literal template tag token', () => {
  assert.equal(renderString('{% templatetag openblock %}'), '{%');
  assert.equal(renderString('{% templatetag closeblock %}'), '%}');
  assert.equal(renderString('{% templatetag openvariable %}'), '{{');
  assert.equal(renderString('{% templatetag closevariable %}'), '}}');
  assert.equal(renderString('{% templatetag opencomment %}'), '{#');
  assert.equal(renderString('{% templatetag closecomment %}'), '#}');
});

test('TAG load: activates a registered library and makes its tags available', () => {
  registerLibrary('mylib-mjs', {
    tags: { greet: () => ({ render: () => 'Hi-from-lib' }) }
  });
  assert.equal(renderString('{% load mylib-mjs %}{% greet %}'), 'Hi-from-lib');
});

// ============================================================================
// 4. INHERITANCE
// ============================================================================

test('INHERITANCE: extends + block + block.super over real HTTP', async () => {
  const dir = makeViewDir('inherit-mjs', {
    'base.html': `<html>{% block head %}default-head{% endblock %}<body>{% block body %}default-body{% endblock %}</body></html>`,
    'child.html': `{% extends "base.html" %}{% block head %}CHILD-HEAD{% endblock %}{% block body %}{{ block.super }} + CHILD-BODY{% endblock %}`
  });
  const app = express();
  app.engine('html', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', dir);
  app.get('/', (req, res) => res.render('child'));
  const { port, close } = await startApp(app);
  try {
    const r = await get(port, '/');
    assert.match(r.body, /<html>CHILD-HEAD/);
    assert.match(r.body, /default-body \+ CHILD-BODY/);
  } finally {
    await close();
  }
});

test('INHERITANCE: 3-level chain (grandchild → child → base)', () => {
  const dir = makeViewDir('inherit-3-mjs', {
    'base.html': `[BASE-{% block a %}a{% endblock %}]`,
    'mid.html': `{% extends "base.html" %}{% block a %}MID-{{ block.super }}-MID{% endblock %}`,
    'leaf.html': `{% extends "mid.html" %}{% block a %}LEAF-{{ block.super }}-LEAF{% endblock %}`
  });
  assert.equal(renderString('{% extends "leaf.html" %}', {}, { views: dir }), '[BASE-LEAF-MID-a-MID-LEAF]');
});

test('INHERITANCE: block default body used when child does not override', () => {
  const dir = makeViewDir('inherit-default-mjs', {
    'base.html': `{% block x %}DEFAULT{% endblock %}`
  });
  assert.equal(renderString('{% extends "base.html" %}', {}, { views: dir }), 'DEFAULT');
});

test('INHERITANCE: block.super works recursively across the chain', () => {
  const dir = makeViewDir('super-chain-mjs', {
    'a.html': `{% block x %}A{% endblock %}`,
    'b.html': `{% extends "a.html" %}{% block x %}B({{ block.super }}){% endblock %}`,
    'c.html': `{% extends "b.html" %}{% block x %}C({{ block.super }}){% endblock %}`
  });
  assert.equal(renderString('{% extends "c.html" %}', {}, { views: dir }), 'C(B(A))');
});

test('INHERITANCE: path traversal in extends is REJECTED', () => {
  const dir = makeViewDir('inherit-traversal-mjs', {
    'child.html': `{% extends "../../../etc/passwd" %}{% block x %}X{% endblock %}`
  });
  assert.throws(
    () => renderString('{% extends "child.html" %}', {}, { views: dir }),
    /path traversal/i
  );
});

test('INHERITANCE: include with `with` binds extra vars', () => {
  const dir = makeViewDir('include-with-mjs', {
    'frag.html': `[{{ name }}]`
  });
  assert.equal(renderString('{% include "frag.html" with name="Alice" %}', {}, { views: dir }), '[Alice]');
});

test('INHERITANCE: include receives parent context variables', () => {
  const dir = makeViewDir('include-ctx-mjs', {
    'frag.html': `Hi {{ user }}!`
  });
  assert.equal(renderString('{% include "frag.html" %}', { user: 'Bob' }, { views: dir }), 'Hi Bob!');
});

test('INHERITANCE: include path traversal is REJECTED', () => {
  const dir = makeViewDir('include-traversal-mjs', {});
  assert.throws(
    () => renderString('{% include "../escape.html" %}', {}, { views: dir }),
    /path traversal/i
  );
});

// ============================================================================
// 5. PARTIALS
// ============================================================================

test('PARTIAL: partialdef + partial reference renders the body', () => {
  const tpl = `{% partialdef card %}Hello {{ name }}{% endpartialdef %}{% partial card %}`;
  assert.equal(renderString(tpl, { name: 'World' }), 'Hello World');
});

test('PARTIAL: partialdef inline renders inline AND registers the partial', () => {
  const tpl = `{% partialdef card inline %}INLINE-{{ name }}{% endpartialdef %}|{% partial card %}`;
  assert.equal(renderString(tpl, { name: 'X' }), 'INLINE-X|INLINE-X');
});

test('PARTIAL: renderPartial API renders a named partial directly', () => {
  const c = compile('{% partialdef greeting %}Hi {{ name }}{% endpartialdef %}');
  assert.equal(c.renderPartial('greeting', { name: 'Alice' }), 'Hi Alice');
});

test('PARTIAL: renderPartial with unknown name throws', () => {
  const c = compile('{% partialdef greeting %}Hi{% endpartialdef %}');
  assert.throws(() => c.renderPartial('doesnotexist', {}), /Partial 'doesnotexist' not found/);
});

test('PARTIAL: partial referencing an undefined partial throws', () => {
  assert.throws(() => renderString('{% partial missing %}'), /Partial 'missing' not found/);
});

test('PARTIAL: block.super works inside partials that override blocks', () => {
  const dir = makeViewDir('partial-block-mjs', {
    'base.html': `{% block x %}BASE{% endblock %}`,
    'p.html': `{% partialdef mypartial %}{% extends "base.html" %}{% block x %}PARTIAL-{{ block.super }}{% endblock %}{% endpartialdef %}{% partial mypartial %}`
  });
  assert.equal(renderString('{% extends "p.html" %}', {}, { views: dir }), 'PARTIAL-BASE');
});

// ============================================================================
// 6. RENDERING A SINGLE BLOCK
// ============================================================================

test('BLOCK: compile().renderBlock("name", ctx) renders only that block', () => {
  const c = compile(`<html>{% block content %}HEAD {{ x }}{% endblock %}<footer>F</footer></html>`);
  assert.equal(c.renderBlock('content', { x: 'X' }), 'HEAD X');
});

test('BLOCK: renderBlock on a missing block throws', () => {
  const c = compile('{% block a %}A{% endblock %}');
  assert.throws(() => c.renderBlock('nope', {}), /Block 'nope' not found in template/);
});

// ============================================================================
// 7. FILTERS
// ============================================================================

test('FILTER text: upper, lower, title, capfirst, slugify, wordcount, striptags, linebreaks, linebreaksbr, truncatewords, truncatechars', () => {
  assert.equal(renderString('{{ s|upper }}', { s: 'hello' }), 'HELLO');
  assert.equal(renderString('{{ s|lower }}', { s: 'HELLO' }), 'hello');
  assert.equal(renderString('{{ s|title }}', { s: 'hello world' }), 'Hello World');
  assert.equal(renderString('{{ s|capfirst }}', { s: 'hello' }), 'Hello');
  assert.equal(renderString('{{ s|slugify }}', { s: 'Hello World 123!' }), 'hello-world-123');
  assert.equal(renderString('{{ s|wordcount }}', { s: 'one two three' }), '3');
  assert.equal(renderString('{{ s|striptags }}', { s: '<b>hi</b> <i>there</i>' }), 'hi there');
  assert.equal(renderString('{{ s|linebreaks }}', { s: 'a\nb' }), '<p>a<br>b</p>');
  assert.equal(renderString('{{ s|linebreaksbr }}', { s: 'a\nb' }), 'a<br>b');
  assert.equal(renderString('{{ s|truncatewords:2 }}', { s: 'a b c d' }), 'a b ...');
  assert.equal(renderString('{{ s|truncatechars:5 }}', { s: 'abcdefgh' }), 'ab...');
});

test('FILTER html: safe, escape, escapeHtml (exposed), markSafe/isSafe', () => {
  assert.equal(renderString('{{ x|safe }}', { x: '<a>' }), '<a>');
  assert.equal(renderString('{{ x|escape }}', { x: '<a>' }), '&lt;a&gt;');
  assert.equal(renderString('{{ x }}', { x: '<a>' }), '&lt;a&gt;');
  assert.ok(isSafe(markSafe('<b>')));
  assert.equal(escapeHtml('<x>'), '&lt;x&gt;');
  assert.ok(isSafe(new SafeString('<b>')));
});

test('FILTER list: length, join, slice, dictsort, dictsortreversed, length_is', () => {
  assert.equal(renderString('{{ xs|length }}', { xs: [1, 2, 3] }), '3');
  assert.equal(renderString('{{ xs|join:"-" }}', { xs: ['a', 'b', 'c'] }), 'a-b-c');
  assert.equal(renderString('{{ xs|slice:"1:3" }}', { xs: ['a', 'b', 'c', 'd'] }), 'b,c');
  const sorted = renderString('{{ rows|dictsort:"age"|length }}', { rows: [{ age: 3 }, { age: 1 }, { age: 2 }] });
  assert.equal(sorted, '3');
  const sortedRev = renderString('{{ rows|dictsortreversed:"age"|length }}', { rows: [{ age: 3 }, { age: 1 }, { age: 2 }] });
  assert.equal(sortedRev, '3');
  assert.equal(renderString('{{ xs|length_is:3 }}', { xs: [1, 2, 3] }), 'true');
  assert.equal(renderString('{{ xs|length_is:3 }}', { xs: [1, 2] }), 'false');
});

test('FILTER default: returns fallback for empty string or null/undefined', () => {
  assert.equal(renderString('{{ x|default:"fb" }}', { x: '' }), 'fb');
  assert.equal(renderString('{{ x|default:"fb" }}', { x: 'X' }), 'X');
  assert.equal(renderString('{{ x|default:"fb" }}', {}), 'fb');
});

test('FILTER default_if_none: returns fallback ONLY for null/undefined, not empty string', () => {
  assert.equal(renderString('{{ x|default_if_none:"fb" }}', { x: null }), 'fb');
  assert.equal(renderString('{{ x|default_if_none:"fb" }}', {}), 'fb');
  assert.equal(renderString('{{ x|default_if_none:"fb" }}', { x: '' }), '');
  assert.equal(renderString('{{ x|default_if_none:"fb" }}', { x: 'X' }), 'X');
});

test('FILTER date: date_format/strftime with yyyy lowercase token', () => {
  // Use a TZ-stable date and derive the expected day from local
  // components so the test is independent of the host timezone.
  const d = new Date(Date.UTC(2024, 2, 15, 12, 0, 0));
  const out = renderString('{{ d|date_format:"yyyy-MM-dd" }}', { d });
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  assert.equal(out, `${year}-${month}-${day}`);
});

test('FILTER timesince/timeuntil return non-empty strings', () => {
  const past = new Date(Date.now() - 60 * 60 * 1000);
  const future = new Date(Date.now() + 60 * 60 * 1000);
  assert.ok(renderString('{{ d|timesince }}', { d: past }).length > 0);
  assert.ok(renderString('{{ d|timeuntil }}', { d: future }).length > 0);
});

test('FILTER numeric: add, divisibleby, floatformat', () => {
  assert.equal(renderString('{{ n|add:5 }}', { n: 3 }), '8');
  assert.equal(renderString('{{ n|divisibleby:2 }}', { n: 4 }), 'true');
  assert.equal(renderString('{{ n|divisibleby:2 }}', { n: 5 }), 'false');
  assert.ok(/1\.23/.test(renderString('{{ n|floatformat:2 }}', { n: 1.23456 })));
});

test('FILTER misc: yesno, pluralize, filesizeformat, urlencode, stringformat, cut, addslashes, removetags', () => {
  assert.equal(renderString('{{ v|yesno:"yes,no,maybe" }}', { v: true }), 'yes');
  assert.equal(renderString('{{ v|yesno:"yes,no,maybe" }}', { v: false }), 'no');
  assert.equal(renderString('{{ n|pluralize }}', { n: 1 }), '');
  assert.equal(renderString('{{ n|pluralize }}', { n: 2 }), 's');
  assert.equal(renderString('{{ n|pluralize:"es" }}', { n: 2 }), 'es');
  assert.match(renderString('{{ s|filesizeformat }}', { s: 1024 }), /\d/);
  assert.equal(renderString('{{ s|urlencode }}', { s: 'a b/c' }), 'a+b%2Fc');
  assert.equal(renderString('{{ n|stringformat:"%.2f" }}', { n: 1.5 }), '1.50');
  assert.equal(renderString('{{ s|cut:"x" }}', { s: 'axbxcx' }), 'abc');
  // removetags (now correctly removes tags, not HTML-escapes)
  assert.equal(renderString('{{ s|removetags:"b i" }}', { s: '<a><b>x</b><i>y</i></a>' }), '<a>xy</a>');
  assert.equal(renderString('{{ s|removetags:"b,i" }}', { s: '<a><b>x</b><i>y</i></a>' }), '<a>xy</a>');
  assert.equal(renderString('{{ s|removetags:"a" }}', { s: '<a href="x">link</a>' }), 'link');
});

test('FILTER trans: filter form returns translation', () => {
  setLanguage('en');
  setFallbackLanguage('en');
  registerTranslation('en', { 'greet': 'Hello' });
  assert.equal(renderString('{{ "greet"|trans }}'), 'Hello');
  unregisterTranslation('en');
});

// ============================================================================
// 8. I18N TAGS
// ============================================================================

test('I18N trans: looks up a translation key', () => {
  setLanguage('en');
  setFallbackLanguage('en');
  registerTranslation('en', { 'welcome': 'Welcome!' });
  assert.equal(renderString('{% trans "welcome" %}'), 'Welcome!');
  unregisterTranslation('en');
});

test('I18N trans: variable substitution via args', () => {
  setLanguage('en');
  setFallbackLanguage('en');
  registerTranslation('en', { 'greet': 'Hello, %s!' });
  assert.equal(
    renderString('{% trans "greet" name=user.name %}', { user: { name: 'Alice' } }),
    'Hello, Alice!'
  );
  unregisterTranslation('en');
});

test('I18N language block: temporarily switches language for body', () => {
  setLanguage('en');
  setFallbackLanguage('en');
  registerTranslation('en', { 'hi': 'Hello' });
  registerTranslation('fr', { 'hi': 'Bonjour' });
  assert.equal(renderString('{% language "fr" %}{% trans "hi" %}{% endlanguage %}'), 'Bonjour');
  assert.equal(renderString('{% trans "hi" %}'), 'Hello');
  unregisterTranslation('en');
  unregisterTranslation('fr');
});

test('I18N blocktrans: text with embedded variable', () => {
  setLanguage('en');
  setFallbackLanguage('en');
  registerTranslation('en', { 'Hello, :name!': 'Hello, :name!' });
  assert.equal(
    renderString('{% blocktrans %}Hello, {{ name }}!{% endblocktrans %}', { name: 'Bob' }),
    'Hello, Bob!'
  );
  unregisterTranslation('en');
});

test('I18N blocktrans: with explicit `with name=var`', () => {
  setLanguage('en');
  setFallbackLanguage('en');
  registerTranslation('en', { 'Hi :name!': 'Hi :name!' });
  assert.equal(
    renderString('{% blocktrans with name=user.name %}Hi {{ name }}!{% endblocktrans %}', { user: { name: 'Carol' } }),
    'Hi Carol!'
  );
  unregisterTranslation('en');
});

test('I18N getAvailableLanguages lists registered languages', () => {
  setLanguage('en');
  registerTranslation('en', { 'a': 'A' });
  registerTranslation('de', { 'a': 'A' });
  const langs = getAvailableLanguages();
  assert.ok(langs.includes('en'));
  assert.ok(langs.includes('de'));
  unregisterTranslation('en');
  unregisterTranslation('de');
});

// ============================================================================
// 9. SECURITY
// ============================================================================

test('SECURITY: variables are auto-escaped by default (XSS prevention)', () => {
  const out = renderString('{{ x }}', { x: '<script>alert(1)</script>' });
  assert.ok(!out.includes('<script>'));
  assert.match(out, /&lt;script&gt;/);
});

test('SECURITY: SafeString / markSafe / |safe bypass escaping', () => {
  assert.equal(renderString('{{ x }}', { x: new SafeString('<b>safe</b>') }), '<b>safe</b>');
  assert.equal(renderString('{{ x }}', { x: markSafe('<i>ms</i>') }), '<i>ms</i>');
  assert.equal(renderString('{{ x|safe }}', { x: '<u>s</u>' }), '<u>s</u>');
});

test('SECURITY: |escape re-escapes even a SafeString (Django semantics)', () => {
  assert.equal(
    renderString('{{ x|escape }}', { x: new SafeString('<b>safe</b>') }),
    '&lt;b&gt;safe&lt;/b&gt;'
  );
  assert.equal(
    renderString('{{ x|escape }}', { x: '<i>x</i>' }),
    '&lt;i&gt;x&lt;/i&gt;'
  );
});

test('SECURITY: csrf_token escapes the token value to prevent attribute injection', () => {
  // The token is interpolated into an HTML attribute, so it MUST be
  // HTML-escaped. A malicious or malformed token containing `"` or
  // `>` could otherwise break out of the attribute and inject HTML.
  const out = renderString('{% csrf_token %}', { csrf_token: '<hack>' });
  assert.match(out, /value="&lt;hack&gt;"/);
  // Quote injection: the input has TWO `"` which would normally
  // close the value attribute and create a new one. After escaping,
  // they become `&quot;` and the attribute stays well-formed.
  const out2 = renderString('{% csrf_token %}', { csrf_token: '" onerror="alert(1)' });
  const attrCount = (out2.match(/=\s*"/g) || []).length;
  assert.equal(attrCount, 3, `expected 3 attrs (type/name/value), got ${attrCount}: ${out2}`);
  assert.match(out2, />$/);
  assert.match(out2, /^<input /);
  assert.match(out2, /value="&quot; onerror=&quot;alert\(1\)"/);
  // Output is still marked safe (no double-escape by the var node)
  const out3 = renderString('{% csrf_token %}', { csrf_token: 'normal-token-123' });
  assert.match(out3, /value="normal-token-123"/);
});

// ============================================================================
// 10. CONTEXT PROCESSORS
// ============================================================================

test('PROCESSOR: context processor injects vars into every render over HTTP', async () => {
  const dir = makeViewDir('processor-mjs', {
    'tpl.html': `{{ siteName }}|{{ processorTag }}`
  });
  const TAG = 'PROC-' + Date.now();
  registerContextProcessor(() => ({ siteName: 'ProcSite', processorTag: TAG }));
  const app = express();
  app.engine('html', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', dir);
  app.get('/', (req, res) => res.render('tpl'));
  const { port, close } = await startApp(app);
  try {
    const r = await get(port, '/');
    assert.match(r.body, /ProcSite/);
    assert.match(r.body, new RegExp(TAG));
  } finally {
    await close();
  }
});

test('PROCESSOR: default-import registerContextProcessor also works', async () => {
  clearContextProcessors();
  const dir = makeViewDir('processor-mjs-default', {
    'tpl.html': `{{ siteName }}|{{ processorTag }}`
  });
  const TAG = 'ESM-PROC-DEFAULT-' + Date.now();
  mikiTemplate.registerContextProcessor(() => ({ siteName: 'EsmProc', processorTag: TAG }));
  const app = express();
  app.engine('html', mikiTemplate.__express);
  app.set('view engine', 'html');
  app.set('views', dir);
  app.get('/', (req, res) => res.render('tpl'));
  const { port, close } = await startApp(app);
  try {
    const r = await get(port, '/');
    assert.match(r.body, /EsmProc/);
    assert.match(r.body, new RegExp(TAG));
  } finally {
    await close();
    clearContextProcessors();
  }
});

// ============================================================================
// 11. CUSTOM TAGS, FILTERS, HELPERS
// ============================================================================

test('CUSTOM filter: registerFilter is callable from templates', () => {
  registerFilter('shout', (val) => String(val).toUpperCase() + '!');
  assert.equal(renderString('{{ x|shout }}', { x: 'hi' }), 'HI!');
});

test('CUSTOM tag: registerTag makes a block-less tag available', () => {
  registerTag('today', () => ({ render: () => '2024-01-01' }));
  assert.equal(renderString('{% today %}'), '2024-01-01');
});

test('CUSTOM helper: registerHelper provides a block-level wrapper', () => {
  registerHelper('upperwrap', (inner) => `<U>${inner.toUpperCase()}</U>`);
  assert.equal(renderString('{% upperwrap %}hello{% endupperwrap %}'), '<U>HELLO</U>');
});

test('CUSTOM tag via default import works', () => {
  mikiTemplate.registerTag('esmtag', () => ({ render: () => 'ESM-TAG-OK' }));
  assert.equal(renderString('{% esmtag %}'), 'ESM-TAG-OK');
});

// ============================================================================
// 12. LIBRARIES
// ============================================================================

test('LIBRARY: hasLibrary + getLibraryNames + getLibrary', () => {
  registerLibrary('present-lib-mjs', {});
  assert.ok(mikiTemplate.getLibraryNames().includes('present-lib-mjs'));
  assert.equal(mikiTemplate.hasLibrary('present-lib-mjs'), true);
  assert.equal(mikiTemplate.hasLibrary('absent-lib-xyz-mjs'), false);
  const def = { tags: { xtag: () => ({ render: () => 'X' }) } };
  registerLibrary('withdef-mjs', def);
  const got = mikiTemplate.getLibrary('withdef-mjs');
  assert.equal(got.tags.xtag, def.tags.xtag);
});

test('LIBRARY: activateLibrary programmatically (same path as {% load %})', () => {
  const libName = 'act-mjs-' + Date.now();
  registerLibrary(libName, {
    tags: { myt: () => ({ render: () => 'OK' }) }
  });
  mikiTemplate.activateLibrary(libName);
  assert.equal(renderString('{% myt %}'), 'OK');
  mikiTemplate.unregisterLibrary(libName);
  assert.equal(mikiTemplate.hasLibrary(libName), false);
});

// ============================================================================
// 13. ASYNC RENDERING
// ============================================================================

test('ASYNC: asyncRender resolves a promise', async () => {
  assert.equal(await asyncRender('Hello {{ name }}', { name: 'async' }), 'Hello async');
});

test('ASYNC: __expressAsync returns a promise of rendered HTML', async () => {
  const dir = makeViewDir('async-direct-mjs', {
    'tpl.html': 'Async-{{ x }}'
  });
  const filePath = path.join(dir, 'tpl.html');
  const out = await renderDtplAsync(filePath, { x: 'Y', settings: { views: dir } });
  assert.equal(out, 'Async-Y');
});

// ============================================================================
// 14. CACHE
// ============================================================================

test('CACHE: clearCache forces a recompile (does not affect behavior)', () => {
  const tpl = 'Hello {{ name }}';
  const c1 = compile(tpl);
  assert.equal(c1.render({ name: 'A' }), 'Hello A');
  clearCache();
  const c2 = compile(tpl);
  assert.equal(c2.render({ name: 'A' }), 'Hello A');
});

// ============================================================================
// 15. EDGE CASES
// ============================================================================

test('EDGE: unclosed if throws a clear error', () => {
  assert.throws(
    () => renderString('{% if true %}never closed'),
    /endif|unclosed|Unknown template tag/i
  );
});

test('EDGE: unclosed for throws', () => {
  assert.throws(
    () => renderString('{% for x in xs %}oops'),
    /endfor|unclosed|Unknown template tag/i
  );
});

test('EDGE: unclosed with throws', () => {
  assert.throws(
    () => renderString('{% with x=1 %}oops'),
    /endwith|unclosed|Unknown template tag/i
  );
});

test('EDGE: missing parent template in extends throws', () => {
  const dir = makeViewDir('missing-parent-mjs', {});
  assert.throws(
    () => renderString('{% extends "nope.html" %}', {}, { views: dir }),
    /Template not found/
  );
});

test('EDGE: dotted lookup on nested object', () => {
  assert.equal(renderString('{{ a.b.c }}', { a: { b: { c: 'deep' } } }), 'deep');
});

test('EDGE: function value is auto-called', () => {
  assert.equal(renderString('{{ fn }}', { fn: () => 'called' }), 'called');
});

test('EDGE: array index by integer', () => {
  assert.equal(renderString('{{ items.1 }}', { items: ['a', 'b', 'c'] }), 'b');
});

test('EDGE: filter chaining', () => {
  assert.equal(renderString('{{ s|upper|truncatechars:3 }}', { s: 'hello world' }), '...');
});

test('EDGE: multiple variables on one line', () => {
  assert.equal(renderString('{{ a }}-{{ b }}-{{ a }}', { a: 'X', b: 'Y' }), 'X-Y-X');
});

test('EDGE: nested for loops with outer scope accessible', () => {
  const out = renderString(
    '{% for x in xs %}{% for y in ys %}{{ x }}{{ y }};{% endfor %}{% endfor %}',
    { xs: [1, 2], ys: ['a', 'b'] }
  );
  assert.equal(out, '1a;1b;2a;2b;');
});

test('EDGE: empty template renders empty string', () => {
  assert.equal(renderString(''), '');
  assert.equal(renderString('   '), '   ');
});

test('EDGE: template with only a comment renders empty', () => {
  assert.equal(renderString('{# full-line comment #}'), '');
});

test('EDGE: unknown filter in variable throws', () => {
  assert.throws(() => renderString('{{ x|nosuchfilter }}', { x: 'a' }), /Unknown filter/i);
});

test('EDGE: unknown tag throws', () => {
  assert.throws(() => renderString('{% nosuchtag %}'), /Unknown template tag/i);
});

test('EDGE: for with iterable filter (regroup via for tag)', () => {
  const out = renderString(
    '{% for g in people|regroup:"gender" %}{{ g.grouper }};{% endfor %}',
    { people: [{ gender: 'm' }, { gender: 'f' }, { gender: 'm' }] }
  );
  assert.equal(out, 'm;f;');
});

test('EDGE: variable not defined renders as empty string', () => {
  assert.equal(renderString('Hello [{{ undef }}]'), 'Hello []');
});

test('EDGE: null variable with default_if_none returns fallback', () => {
  assert.equal(renderString('{{ x|default_if_none:"fb" }}', { x: null }), 'fb');
});

test('EDGE: undefined variable with default_if_none returns fallback', () => {
  assert.equal(renderString('{{ x|default_if_none:"fb" }}', {}), 'fb');
});

// ============================================================================
// 16. COMPREHENSIVE `with` TAG — ALL FORMS
// ============================================================================

test('WITH: `value as name` — alias a single expression', () => {
  assert.equal(
    renderString('{% with user.name as n %}Hi {{ n }}{% endwith %}', { user: { name: 'Bob' } }),
    'Hi Bob'
  );
});

test('WITH: `key=val` — bind a single pair', () => {
  assert.equal(
    renderString('{% with greeting="Hello" %}{{ greeting }}{% endwith %}'),
    'Hello'
  );
});

test('WITH: `key=val, key=val` — bind multiple pairs', () => {
  assert.equal(
    renderString('{% with a=5, b=10 %}{{ a }}+{{ b }}=15? {{ a|add:b }}{% endwith %}'),
    '5+10=15? 15'
  );
});

test('WITH: `key=val as alias` — pair followed by alias (the user-reported case)', () => {
  // {% with a=5 as answ %} binds a=5, then aliases a to answ.
  // The user's example: {{ answ|add:5 }} should yield 10.
  assert.equal(
    renderString('{% with a=5 as answ %}{{ answ|add:5 }}{% endwith %}'),
    '10'
  );
});

test('WITH: multi-pair + final alias', () => {
  assert.equal(
    renderString(
      '{% with first="A", second="B" as last %}{{ first }}{{ last }}{% endwith %}'
    ),
    'AB'
  );
});

test('WITH: literal numeric and boolean pairs', () => {
  assert.equal(
    renderString('{% with n=42, flag=true, missing=null %}{{ n }}-{{ flag }}-{{ missing|default:"x" }}{% endwith %}'),
    '42-true-x'
  );
});

test('WITH: pair value can be a context variable', () => {
  assert.equal(
    renderString(
      '{% with alias=user.name %}Hello {{ alias }}{% endwith %}',
      { user: { name: 'Carol' } }
    ),
    'Hello Carol'
  );
});

test('WITH: quoted value containing a comma', () => {
  assert.equal(
    renderString('{% with msg="Hello, World" %}{{ msg }}{% endwith %}'),
    'Hello, World'
  );
});

test('WITH: scope does not leak to outer context', () => {
  assert.equal(
    renderString('{% with x=1 %}inner={{ x }}{% endwith %} outer={{ x|default:"none" }}'),
    'inner=1 outer=none'
  );
});

// ============================================================================
// 17. COMPREHENSIVE PARTIAL TAG — ALL FORMS
// ============================================================================

test('PARTIAL: partialdef + partial (no args, uses context)', () => {
  const tpl = '{% partialdef card %}<div>{{ title|default:"No title" }}</div>{% endpartialdef %}{% partial card %}';
  assert.equal(renderString(tpl, { title: 'FromCtx' }), '<div>FromCtx</div>');
});

test('PARTIAL: partial with single `with` argument', () => {
  const tpl = '{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}{% partial card with title="Hello" %}';
  assert.equal(renderString(tpl), '<div>Hello</div>');
});

test('PARTIAL: partial with multiple `with` arguments (the user-reported case)', () => {
  const tpl = '{% partialdef card %}<div class="card"><h3>{{ title|default:"No title" }}</h3><p>{{ description|default:"empty" }}</p></div>{% endpartialdef %}{% partial card with title="Hello" description="World" %}';
  assert.equal(
    renderString(tpl),
    '<div class="card"><h3>Hello</h3><p>World</p></div>'
  );
});

test('PARTIAL: `with` args override context values', () => {
  const tpl = '{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}{% partial card with title="Override" %}';
  assert.equal(renderString(tpl, { title: 'Original' }), '<div>Override</div>');
});

test('PARTIAL: partial inline=true renders the body at the definition site', () => {
  const tpl = '{% partialdef card inline %}<div>{{ title }}</div>{% endpartialdef %}|END';
  assert.equal(renderString(tpl, { title: 'Inline' }), '<div>Inline</div>|END');
});

test('PARTIAL: partial inline renders the body AND registers the partial', () => {
  const tpl = '{% partialdef card inline %}<div>{{ title }}</div>{% endpartialdef %}|{% partial card with title="B" %}';
  assert.equal(renderString(tpl, { title: 'A' }), '<div>A</div>|<div>B</div>');
});

test('PARTIAL: partial `with` args can use quoted strings with spaces and special chars', () => {
  const tpl = '{% partialdef card %}<div>{{ msg }}</div>{% endpartialdef %}{% partial card with msg="Hello, World!" %}';
  assert.equal(renderString(tpl), '<div>Hello, World!</div>');
});

test('PARTIAL: `with` args can be context variables', () => {
  const tpl = '{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}{% partial card with title=user.name %}';
  assert.equal(
    renderString(tpl, { user: { name: 'Dana' } }),
    '<div>Dana</div>'
  );
});

test('PARTIAL: default filter with `{% lorem %}` fallback renders the tag', () => {
  // The user reported `{{ description|default:"{% lorem %}" }}` —
  // the default filter renders the fallback as a mini-template,
  // producing lorem text when description is empty.
  const tpl = '{% partialdef card %}<p>{{ description|default:"{% lorem 3 w %}" }}</p>{% endpartialdef %}{% partial card %}';
  const out = renderString(tpl);
  // `{% lorem 3 w %}` produces exactly 3 words (first is "Lorem").
  assert.match(out, /^<p>[A-Za-z]+(?: [a-z]+){2}<\/p>$/);
  assert.ok(!out.includes('{% lorem'), 'no raw lorem tag leaked into output');
});

test('PARTIAL: default filter with `{{ var|filter }}` fallback renders the expression', () => {
  // Nested {{ ... }} inside a default filter arg is rendered.
  const tpl = '{{ x|default:"{{ y|upper }}" }}';
  assert.equal(renderString(tpl, { y: 'hello' }), 'HELLO');
});

test('PARTIAL: nested partialdef + partial (partial calling a partial)', () => {
  const tpl = '{% partialdef inner %}<i>{{ x }}</i>{% endpartialdef %}{% partialdef outer %}<b>{% partial inner with x="nested" %}</b>{% endpartialdef %}{% partial outer %}';
  assert.equal(renderString(tpl), '<b><i>nested</i></b>');
});

test('PARTIAL: partial inside a for loop with `with` args from loop variable', () => {
  const tpl = '{% partialdef item %}<li>{{ name }}</li>{% endpartialdef %}{% for u in users %}{% partial item with name=u.name %}{% endfor %}';
  const out = renderString(tpl, { users: [{ name: 'A' }, { name: 'B' }] });
  assert.equal(out, '<li>A</li><li>B</li>');
});

test('PARTIAL: renderPartial API with extra context', () => {
  const c = compile('{% partialdef card %}<div>{{ title }} - {{ body }}</div>{% endpartialdef %}');
  assert.equal(
    c.renderPartial('card', { title: 'T', body: 'B' }),
    '<div>T - B</div>'
  );
});

// ============================================================================
// 18. COMPREHENSIVE `include` TAG — PARTIAL SELECTOR
// ============================================================================

test('INCLUDE: `{% include "file.html" %}` renders the full file', () => {
  const dir = makeViewDir('include-full-mjs', {
    'frag.html': 'Hello {{ name }}!'
  });
  assert.equal(
    renderString('{% include "frag.html" %}', { name: 'World' }, { views: dir }),
    'Hello World!'
  );
});

test('INCLUDE: `{% include "file.html#partial" %}` renders only the named partial', () => {
  const dir = makeViewDir('include-partial-mjs', {
    'frag.html': `BEFORE{% partialdef card %}<div>CARD:{{ title }}</div>{% endpartialdef %}AFTER`
  });
  const out = renderString(
    '{% include "frag.html#card" %}',
    { title: 'Hello' },
    { views: dir }
  );
  assert.equal(out, '<div>CARD:Hello</div>');
});

test('INCLUDE: partial selector uses caller context for variables', () => {
  const dir = makeViewDir('include-partial-ctx-mjs', {
    'frag.html': `{% partialdef card %}<div>{{ user.name }}</div>{% endpartialdef %}`
  });
  assert.equal(
    renderString('{% include "frag.html#card" %}', { user: { name: 'Eve' } }, { views: dir }),
    '<div>Eve</div>'
  );
});

test('INCLUDE: partial selector with `with` clause overrides partial scope', () => {
  const dir = makeViewDir('include-partial-with-mjs', {
    'frag.html': `{% partialdef card %}<div>{{ title }}</div>{% endpartialdef %}`
  });
  assert.equal(
    renderString('{% include "frag.html#card" with title="Override" %}', {}, { views: dir }),
    '<div>Override</div>'
  );
});

test('INCLUDE: `include "file.html#missing"` throws with a clear error', () => {
  const dir = makeViewDir('include-missing-partial-mjs', {
    'frag.html': `{% partialdef card %}<div>X</div>{% endpartialdef %}`
  });
  assert.throws(
    () => renderString('{% include "frag.html#nope" %}', {}, { views: dir }),
    /Partial 'nope' not found in template 'frag.html'/
  );
});

test('INCLUDE: `include "file.html"` path traversal is REJECTED even with #partial', () => {
  const dir = makeViewDir('include-traversal-hash-mjs', {});
  assert.throws(
    () => renderString('{% include "../escape.html#frag" %}', {}, { views: dir }),
    /path traversal/i
  );
});

test('INCLUDE: `include` with multiple `with` kwargs', () => {
  const dir = makeViewDir('include-multi-with-mjs', {
    'frag.html': `{{ a }}-{{ b }}-{{ c }}`
  });
  assert.equal(
    renderString(
      '{% include "frag.html" with a=1, b="two", c=x %}',
      { x: 'three' },
      { views: dir }
    ),
    '1-two-three'
  );
});

// ============================================================================
// 19. URL TAG — DEEP ROUTING AND MULTI-PARAMS (mapped to real Express routes)
// ============================================================================

test('URL: many positional params', () => {
  assert.equal(
    renderString('{% url "user.show" 34 "email" "phone" %}'),
    '/user/show/34/email/phone'
  );
});

test('URL: deep routing with dots converted to slashes', () => {
  assert.equal(
    renderString('{% url "user.profile.posts.show" %}'),
    '/user/profile/posts/show'
  );
  assert.equal(
    renderString('{% url "a.b.c.d.e" %}'),
    '/a/b/c/d/e'
  );
});

test('URL: kwargs rendered as query string in fallback', () => {
  assert.equal(
    renderString('{% url "user.show" userId=34 tab="posts" %}'),
    '/user/show?userId=34&tab=posts'
  );
});

test('URL: mixed positional + kwargs', () => {
  assert.equal(
    renderString('{% url "user.show" 34 tab="posts" page=2 %}'),
    '/user/show/34?tab=posts&page=2'
  );
});

test('URL: urlHelper receives kwargs as last arg when present', () => {
  const out = renderString('{% url "user.show" 34 tab="posts" %}', {}, {
    urlHelper: (name, id, kw) => `/${name}/${id}?tab=${kw.tab}`
  });
  assert.equal(out, '/user.show/34?tab=posts');
});

test('URL: urlHelper called with just positional when no kwargs', () => {
  const out = renderString('{% url "user.show" 42 %}', {}, {
    urlHelper: (name, id) => `/users/${id}`
  });
  assert.equal(out, '/users/42');
});

test('URL: mapped to a REAL Express route via urlHelper', async () => {
  // Real-world: wire {% url %} to a helper that builds Express-style
  // paths, then make a real HTTP request to verify the URL actually
  // works.
  const app = express();
  // Map a few "named routes" to Express handlers. Each handler
  // receives the positional args spread, then a kwargs object as the
  // last argument (if any were given).
  const routes = {
    'user.show': (id) => `/api/users/${id}`,
    'user.profile.show': (id) => `/api/users/${id}/profile`,
    'user.posts.list': (id, kw) => {
      const qs = kw
        ? Object.entries(kw).map(([k, v]) => `${k}=${v}`).join('&')
        : '';
      return `/api/users/${id}/posts${qs ? '?' + qs : ''}`;
    },
    'post.show': (slug) => `/api/posts/${slug}`
  };
  const urlHelper = (routeName, ...args) => {
    const builder = routes[routeName];
    if (!builder) throw new Error(`No route '${routeName}'`);
    return builder(...args);
  };

  fs.mkdirSync(TMP_ROOT + '/url-express-mjs', { recursive: true });
  fs.writeFileSync(
    TMP_ROOT + '/url-express-mjs/list.html',
    '<ul><li><a href="{% url "user.show" 1 %}">User 1</a></li>' +
    '<li><a href="{% url "user.show" 2 %}">User 2</a></li>' +
    '<li><a href="{% url "user.profile.show" 1 %}">Profile</a></li>' +
    '<li><a href="{% url "user.posts.list" 1 tab="published" page=2 %}">Posts</a></li></ul>'
  );

  app.engine('html', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', TMP_ROOT + '/url-express-mjs');

  // Pass urlHelper via res.render locals so the engine sees it in
  // its options.
  app.get('/', (req, res) => res.render('list', { urlHelper }));

  // Register the real Express endpoints that {% url %} points to
  app.get('/api/users/:id', (req, res) => res.json({ id: req.params.id, type: 'user' }));
  app.get('/api/users/:id/profile', (req, res) => res.json({ id: req.params.id, type: 'profile' }));
  app.get('/api/users/:id/posts', (req, res) => res.json({ id: req.params.id, tab: req.query.tab, page: req.query.page, type: 'posts' }));

  const { port, close } = await startApp(app);
  try {
    // 1. Fetch the HTML and verify {% url %} produced real links
    const html = await get(port, '/');
    assert.match(html.body, /href="\/api\/users\/1"/);
    assert.match(html.body, /href="\/api\/users\/2"/);
    assert.match(html.body, /href="\/api\/users\/1\/profile"/);
    assert.match(html.body, /href="\/api\/users\/1\/posts\?tab=published&page=2"/);

    // 2. Actually follow the links to verify the routes exist
    const r1 = await get(port, '/api/users/1');
    assert.equal(r1.status, 200);
    assert.match(r1.body, /"id":"1"/);

    const r2 = await get(port, '/api/users/2/profile');
    assert.equal(r2.status, 200);
    assert.match(r2.body, /"type":"profile"/);

    const r3 = await get(port, '/api/users/1/posts?tab=published&page=2');
    assert.equal(r3.status, 200);
    assert.match(r3.body, /"tab":"published"/);
    assert.match(r3.body, /"page":"2"/);
  } finally {
    await close();
  }
});

// ============================================================================
// 20. REAL-WORLD `dir/home.html` END-TO-END OVER HTTP
// ============================================================================

test('REAL-WORLD: full dir/home.html template renders over real HTTP', async () => {
  const dir = path.join(__dirname, '../../dir');
  const app = express();
  app.engine('html', renderDtpl);
  app.engine('miki', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', dir);

  app.get('/', (req, res) => res.render('home', {
    siteName: 'My Test Site',
    name: 'World',
    login: { name: 'Alice', email: 'alice@example.com' },
    users: [
      { name: 'bob', email: 'bob@example.com' },
      { name: 'carol', email: 'carol@example.com' }
    ],
    data: [
      { name: 'Item 1', email: 'i1@x.com' },
      { name: 'Item 2', email: 'i2@x.com' }
    ]
  }));

  const { port, close } = await startApp(app);
  try {
    const r = await get(port, '/');
    assert.equal(r.status, 200);
    assert.match(r.body, /My Test Site/);
    assert.match(r.body, /some new stuff with with tag\s*:\s*10/);
    assert.match(r.body, /<h3>Hello<\/h3>/);
    // The home.html applies |upper after the default filter, so the
    // description comes out uppercased: <p>WORLD</p>
    assert.match(r.body, /<p>WORLD<\/p>/);
    assert.match(r.body, /<td>Bob<\/td>/);
    assert.match(r.body, /<td>Carol<\/td>/);
    assert.match(r.body, /<li>Item 1<\/li>/);
    assert.match(r.body, /<li>Item 2<\/li>/);
    assert.match(r.body, /<li>bob<\/li>/);
    assert.match(r.body, /<li>carol<\/li>/);
    assert.match(r.body, /footer/);
  } finally {
    await close();
  }
});

// ============================================================================
// 21. DJANGO-COMPATIBLE `{% lorem %}` TAG
// ============================================================================

test('LOREM: `{% lorem %}` (no args) outputs the common Lorem ipsum paragraph (method=b default)', () => {
  const out = renderString('{% lorem %}');
  assert.match(out, /^Lorem ipsum dolor sit amet/);
  assert.ok(out.split('\n\n').length === 1, `expected 1 block, got: ${out.split('\n\n').length}`);
});

test('LOREM: `{% lorem N w %}` outputs N words, first word is "Lorem" (non-random)', () => {
  const out = renderString('{% lorem 5 w %}');
  const words = out.split(' ');
  assert.equal(words.length, 5);
  assert.equal(words[0], 'Lorem');
});

test('LOREM: `{% lorem N w random %}` outputs N random words (no Lorem start)', () => {
  const out = renderString('{% lorem 7 w random %}');
  const words = out.split(' ');
  assert.equal(words.length, 7);
  assert.notEqual(words[0], 'Lorem');
  assert.notEqual(words[0], 'lorem');
});

test('LOREM: `{% lorem N p %}` outputs N HTML paragraphs (each wrapped in <p>)', () => {
  const out = renderString('{% lorem 3 p %}');
  const ps = out.match(/<p>[\s\S]*?<\/p>/g) || [];
  assert.equal(ps.length, 3);
  assert.match(ps[0], /^<p>Lorem ipsum dolor sit amet/);
});

test('LOREM: `{% lorem N b %}` outputs N plain-text blocks separated by blank lines', () => {
  const out = renderString('{% lorem 2 b %}');
  const blocks = out.split('\n\n');
  assert.equal(blocks.length, 2);
  assert.match(blocks[0], /^Lorem ipsum dolor sit amet/);
});

test('LOREM: `{% lorem N p random %}` outputs N random HTML paragraphs (no Lorem start)', () => {
  const out = renderString('{% lorem 2 p random %}');
  const ps = out.match(/<p>[\s\S]*?<\/p>/g) || [];
  assert.equal(ps.length, 2);
  assert.doesNotMatch(ps[0], /^<p>Lorem ipsum/);
});

test('LOREM: `{% lorem %}` does NOT require `{% load lorem %}` (built-in)', () => {
  const out = renderString('before {% lorem 3 w %} after');
  assert.match(out, /before .+ after/);
  assert.ok(!out.includes('{% lorem'));
});

test('LOREM: count argument can be a single digit or multi-digit', () => {
  assert.equal(renderString('{% lorem 1 w %}').split(' ').length, 1);
  assert.equal(renderString('{% lorem 10 w %}').split(' ').length, 10);
});

test('LOREM: invalid method falls back to "b" (plain text block)', () => {
  const out = renderString('{% lorem 2 x %}');
  assert.ok(out.includes('\n\n'), 'expected blank-line separated blocks');
});

test('LOREM: works inside a partial definition (real-world)', () => {
  const tpl = '{% partialdef card %}<div class="card">{% lorem 5 w %}</div>{% endpartialdef %}{% partial card %}';
  const out = renderString(tpl);
  assert.match(out, /<div class="card">\w+( \w+){0,4}<\/div>/);
});

// ============================================================================
// 22. `render("file#partial")` API FOR HTMX PARTIAL RESPONSES
// ============================================================================

test('RENDER#PARTIAL: `render("home#card", ctx, { views })` loads file and renders only the named partial', () => {
  const dir = makeViewDir('render-hash-mjs', {
    'home.html': `BEFORE{% partialdef card %}<div class="card">Hi {{ user }}</div>{% endpartialdef %}AFTER`
  });
  const out = render('home#card', { user: 'Alice' }, { views: dir });
  assert.equal(out, '<div class="card">Hi Alice</div>');
});

test('RENDER#PARTIAL: `render("home.html#card", ...)` works with explicit extension', () => {
  const dir = makeViewDir('render-hash-ext-mjs', {
    'home.html': `{% partialdef card %}<div>{{ x }}</div>{% endpartialdef %}`
  });
  assert.equal(render('home.html#card', { x: 'Y' }, { views: dir }), '<div>Y</div>');
});

test('RENDER#PARTIAL: `render("home.miki#card", ...)` works with .miki extension', () => {
  const dir = makeViewDir('render-hash-miki-mjs', {
    'home.miki': `{% partialdef card %}<div>{{ x }}</div>{% endpartialdef %}`
  });
  assert.equal(render('home.miki#card', { x: 'Z' }, { views: dir }), '<div>Z</div>');
});

test('RENDER#PARTIAL: `render("home#card", ...)` with no extension tries .html then .miki', () => {
  const dir = makeViewDir('render-hash-noext-mjs', {
    'home.miki': `{% partialdef card %}<div>{{ x }}</div>{% endpartialdef %}`
  });
  assert.equal(render('home#card', { x: 'W' }, { views: dir }), '<div>W</div>');
});

test('RENDER#PARTIAL: missing partial throws a clear error', () => {
  const dir = makeViewDir('render-hash-missing-mjs', {
    'home.html': `{% partialdef other %}<div>X</div>{% endpartialdef %}`
  });
  assert.throws(
    () => render('home#card', {}, { views: dir }),
    /Partial 'card' not found in template 'home'/
  );
});

test('RENDER#PARTIAL: missing file throws "Template not found"', () => {
  const dir = makeViewDir('render-hash-nofile-mjs', {});
  assert.throws(
    () => render('nope#card', {}, { views: dir }),
    /Template not found: 'nope'/
  );
});

test('RENDER#PARTIAL: template strings with `{{` or `{%` are NOT treated as file paths', () => {
  const dir = makeViewDir('render-hash-template-mjs', {
    'frag.html': `{% partialdef card %}<div>C</div>{% endpartialdef %}`
  });
  const tpl = '{% include "frag.html#card" %}';
  const out = render(tpl, {}, { views: dir });
  assert.equal(out, '<div>C</div>');
});

test('RENDER#PARTIAL: HTMX-style partial response over real HTTP', async () => {
  const dir = makeViewDir('render-hash-htmx-mjs', {
    'dashboard.html': `{% partialdef stats %}<div id="stats">Users: {{ users }}</div>{% endpartialdef %}{% partialdef greeting %}<h1>Hello {{ name }}</h1>{% endpartialdef %}`
  });
  const app = express();
  app.engine('html', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', dir);

  app.get('/partials/:name', (req, res) => {
    try {
      const html = renderPartialFromFile(
        'dashboard',
        req.params.name,
        { users: 42, name: 'Alice' },
        { views: dir }
      );
      res.send(html);
    } catch (e) {
      res.status(404).send(e.message);
    }
  });

  const { port, close } = await startApp(app);
  try {
    const stats = await get(port, '/partials/stats');
    assert.equal(stats.status, 200);
    assert.equal(stats.body, '<div id="stats">Users: 42</div>');

    const greeting = await get(port, '/partials/greeting');
    assert.equal(greeting.status, 200);
    assert.equal(greeting.body, '<h1>Hello Alice</h1>');

    const missing = await get(port, '/partials/nope');
    assert.equal(missing.status, 404);
  } finally {
    await close();
  }
});

test('RENDER#PARTIAL: `expressPartialRenderer()` middleware adds res.renderPartial()', async () => {
  const dir = makeViewDir('render-hash-mw-mjs', {
    'card.html': `{% partialdef card %}<div class="card">{{ title }}</div>{% endpartialdef %}`
  });
  const app = express();
  app.engine('html', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', dir);
  app.use(expressPartialRenderer());

  app.get('/card', (req, res) => res.renderPartial('card#card', { title: 'Hello' }));

  const { port, close } = await startApp(app);
  try {
    const r = await get(port, '/card');
    assert.equal(r.status, 200);
    assert.equal(r.body, '<div class="card">Hello</div>');
  } finally {
    await close();
  }
});

test('RENDER#PARTIAL: `res.render("view#partial")` works with normal Express via setupExpress()', async () => {
  const dir = makeViewDir('render-hash-normal-mjs', {
    'dashboard.html': `{% partialdef stats %}<div id="stats">Users: {{ users }}</div>{% endpartialdef %}{% partialdef greeting %}<h1>Hello {{ name }}</h1>{% endpartialdef %}`,
    'page.html': `<!DOCTYPE html><html><body><main>Full page {{ name }}</main></body></html>`
  });
  const app = express();
  mikiTemplate.setupExpress(app, { extension: 'html', views: dir });

  app.get('/page', (req, res) => res.render('page', { name: 'World' }));

  app.get('/partials/:name', (req, res) =>
    res.render(`dashboard#${req.params.name}`, { users: 42, name: 'Alice' })
  );

  const { port, close } = await startApp(app);
  try {
    const full = await get(port, '/page');
    assert.equal(full.status, 200);
    assert.match(full.body, /<main>Full page World<\/main>/);

    const stats = await get(port, '/partials/stats');
    assert.equal(stats.status, 200);
    assert.equal(stats.body, '<div id="stats">Users: 42</div>');

    const greeting = await get(port, '/partials/greeting');
    assert.equal(greeting.status, 200);
    assert.equal(greeting.body, '<h1>Hello Alice</h1>');
  } finally {
    await close();
  }
});

test('RENDER#PARTIAL: `res.render("view#partial")` works with callback signature', async () => {
  const dir = makeViewDir('render-hash-callback-mjs', {
    'card.html': `{% partialdef card %}<div class="card">{{ title }}</div>{% endpartialdef %}`
  });
  const app = express();
  mikiTemplate.setupExpress(app, { extension: 'html', views: dir });

  app.get('/card', (req, res) => {
    res.render('card#card', { title: 'CB' }, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.send(html);
    });
  });

  const { port, close } = await startApp(app);
  try {
    const r = await get(port, '/card');
    assert.equal(r.status, 200);
    assert.equal(r.body, '<div class="card">CB</div>');
  } finally {
    await close();
  }
});

test('RENDER#PARTIAL: asyncRender supports #partial file paths', async () => {
  const dir = makeViewDir('render-hash-async-mjs', {
    'a.html': `{% partialdef p %}<span>{{ x }}</span>{% endpartialdef %}`
  });
  const out = await asyncRender('a#p', { x: 'async-ok' }, { views: dir });
  assert.equal(out, '<span>async-ok</span>');
});

// ============================================================================
// 23. SECURITY TAGS — CSRF AND CSP NONCE ESCAPING
// ============================================================================

test('SECURITY: csp_nonce_attr escapes the nonce value', () => {
  const out = renderString('<script {% csp_nonce_attr %}></script>', {
    csp_nonce: '"><script>alert(1)</script>'
  });
  assert.match(out, /nonce="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;"/);
  const safe = renderString('<script {% csp_nonce_attr %}></script>', {
    csp_nonce: 'abc123'
  });
  assert.match(safe, /nonce="abc123"/);
});

test('SECURITY: csp_nonce_attr emits nothing when csp_nonce is missing', () => {
  const out = renderString('<script {% csp_nonce_attr %}></script>', {});
  assert.equal(out, '<script ></script>');
});

test('SECURITY: csrf_token output is still marked safe (no double-escape)', () => {
  const out = renderString('{% csrf_token %}', { csrf_token: 'tok"en' });
  assert.match(out, /value="tok&quot;en"/);
  assert.doesNotMatch(out, /&amp;quot;/);
});

// ============================================================================
// 21. REAL-WORLD COMBINED SCENARIOS
// ============================================================================

test('REAL-WORLD: blog post with inheritance, for loop, filter, escaping, partial', () => {
  const dir = makeViewDir('blog-mjs', {
    'base.html': `<article><h1>{% block title %}Default{% endblock %}</h1><div>{% block body %}{% endblock %}</div><footer>{% block footer %}copyright{% endblock %}</footer></article>`,
    'post.html': `{% extends "base.html" %}{% block title %}{{ post.title|safe }}{% endblock %}{% block body %}{% partialdef tags %}<span class="tag">{{ tag }}</span>{% endpartialdef %}{% for tag in post.tags %}{% partial tags %}{% endfor %}{% endblock %}`
  });
  const out = renderString(
    '{% extends "post.html" %}',
    { post: { title: 'My <Post>', tags: ['js', 'tpl', 'esm'] } },
    { views: dir }
  );
  assert.match(out, /<article><h1>My <Post><\/h1>/);
  assert.match(out, /<span class="tag">js<\/span>/);
  assert.match(out, /<span class="tag">tpl<\/span>/);
  assert.match(out, /<span class="tag">esm<\/span>/);
  assert.match(out, /<footer>copyright<\/footer>/);
});

test('REAL-WORLD: full Express flow with default import + .html + .miki + view engine', async () => {
  const dir = makeViewDir('realworld-mjs', {
    'hello.html': `Hello {{ name|upper }}!`,
    'page.miki': `[Miki-{{ msg }}]`
  });
  const app = express();
  app.engine('html', mikiTemplate.__express);
  app.engine('miki', mikiTemplate.__express);
  app.set('view engine', 'miki');
  app.set('views', dir);
  app.get('/h', (req, res) => res.render('hello.html', { name: 'alice' }));
  app.get('/p', (req, res) => res.render('page', { msg: 'World' }));
  const { port, close } = await startApp(app);
  try {
    assert.equal((await get(port, '/h')).body, 'Hello ALICE!');
    assert.equal((await get(port, '/p')).body, '[Miki-World]');
  } finally {
    await close();
  }
});

test('REAL-WORLD: full Express flow with context processor, csrf, and safe HTML', async () => {
  const dir = makeViewDir('realworld-form-mjs', {
    'form.html': `<form>{% csrf_token %}<input name="bio" value="{{ profile.bio }}">{% if profile.bio_raw %}<div>{{ profile.bio_raw|safe }}</div>{% endif %}</form>`
  });
  const TAG = 'SITE-' + Date.now();
  registerContextProcessor(() => ({ siteName: 'RealSite', csrf_token: 'tok-1', processorTag: TAG }));
  const app = express();
  app.engine('html', renderDtpl);
  app.set('view engine', 'html');
  app.set('views', dir);
  app.get('/form', (req, res) =>
    res.render('form', { profile: { bio: '<script>alert(1)</script>', bio_raw: '<b>html</b>' } })
  );
  const { port, close } = await startApp(app);
  try {
    const r = await get(port, '/form');
    assert.match(r.body, /value="&lt;script&gt;alert\(1\)&lt;\/script&gt;"/);
    assert.match(r.body, /<b>html<\/b>/);
    assert.match(r.body, /value="tok-1"/);
  } finally {
    await close();
  }
});
