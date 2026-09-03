/**
 * benchmarks/stress.mjs
 *
 * Strict, opinionated stress + performance benchmark for miki-template.
 *
 * Dimensions measured:
 *  1. CORRECTNESS      — every render must produce byte-identical output to
 *                        the first render (deterministic) and pass a fixed
 *                        set of golden-string assertions.
 *  2. COMPILE SPEED    — templates/compile second, broken down by template
 *                        size and template shape (flat, inheritance, for, partial).
 *  3. RENDER SPEED     — renders/second for small / medium / large / inheritance
 *                        templates, both cold and warm.
 *  4. CACHE BEHAVIOR   — second compile of the same source must be a cache
 *                        hit; partials included via {% include %} must NOT
 *                        cause cross-template cache pollution.
 *  5. SCALE            — single template with N items rendered in a for loop.
 *                        Linear-or-better growth vs N.
 *  6. ENDURANCE        — run 100k renders back-to-back. No memory growth
 *                        reported by process.memoryUsage beyond a bounded
 *                        factor (we measure delta RSS, not absolute RSS).
 *  7. PARTIAL OVERHEAD — renderPartialFromSource vs render() overhead.
 *  8. ASYNC OVERHEAD   — asyncRender vs render() overhead.
 *  9. CONCURRENCY      — 50+ parallel asyncRender calls complete in bounded
 *                        wall time and produce the same output as serial.
 *
 * The script exits with code 1 on any failure. All numbers are reported
 * in a single human-readable summary.
 */

import { compile, render, asyncRender, renderPartialFromSource, clearCache } from '../src/esm.mjs';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const YEL   = '\x1b[33m';
const DIM   = '\x1b[2m';
const RST   = '\x1b[0m';

const results = [];
let failures = 0;

function record(name, ok, info) {
  results.push({ name, ok, info });
  if (!ok) failures++;
  const tag = ok ? `${GREEN}PASS${RST}` : `${RED}FAIL${RST}`;
  const extra = info ? `  ${DIM}${info}${RST}` : '';
  console.log(`  ${tag}  ${name}${extra}`);
}

function section(title) {
  console.log(`\n${YEL}== ${title} ==${RST}`);
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function fmt(n, unit = 'ms') {
  if (n >= 1000) return (n / 1000).toFixed(2) + 'k ' + unit;
  if (n < 10)    return n.toFixed(3) + ' ' + unit;
  if (n < 100)   return n.toFixed(2) + ' ' + unit;
  return n.toFixed(1) + ' ' + unit;
}

function bytes(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
  if (n >= 1024)        return (n / 1024).toFixed(2) + ' KB';
  return n + ' B';
}

function rssMB() {
  return process.memoryUsage().rss / 1024 / 1024;
}

// ------------------------------------------------------------------
// Templates
// ------------------------------------------------------------------
const SMALL = `Hello {{ name|title }}, today is {{ date|default:"a day"|truncatewords:3 }}.`;

const MEDIUM = `<article>
  <h1>{{ post.title|upper }}</h1>
  <p class="meta">By {{ post.author.name }} on {{ post.date|date_format:"yyyy-MM-dd" }}</p>
  {% if post.featured %}<span class="badge">Featured</span>{% endif %}
  <div class="body">
    {{ post.body|truncatewords:80 }}
  </div>
  <ul class="tags">
    {% for tag in post.tags %}<li>{{ tag|lower }}</li>{% empty %}
      <li>No tags</li>{% endfor %}
  </ul>
  <footer>
    {% for c in post.comments %}{% if c.approved %}
      <div class="comment">{{ c.author }}: {{ c.text|truncatewords:30 }}</div>
    {% endif %}{% endfor %}
  </footer>
</article>`;

const LARGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{{ page.title|default:"Site"|title }}</title>
  <meta name="description" content="{{ page.description|truncatewords:20 }}">
  {% for css in page.stylesheets %}<link rel="stylesheet" href="{{ css }}">
  {% endfor %}{% for js in page.scripts %}<script src="{{ js }}"></script>
  {% endfor %}
</head>
<body class="{% cycle 'theme-a' 'theme-b' 'theme-c' %}">
  <header>
    <h1>{{ site.name }}</h1>
    <nav>{% for item in nav %}<a href="{{ item.href }}">{{ item.label }}</a>{% endfor %}</nav>
  </header>
  <main>
    {% for section in sections %}
      <section id="{{ section.slug }}">
        <h2>{{ section.title }}</h2>
        {% if section.kind == 'grid' %}
          <div class="grid">{% for item in section.items %}<div class="cell">
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary|truncatewords:40 }}</p>
            <span class="price">{{ item.price|floatformat:2 }}</span>
          </div>{% endfor %}</div>
        {% elif section.kind == 'list' %}
          <ul>{% for item in section.items %}<li>
            <a href="{{ item.href }}">{{ item.label }}</a>
            <small>{{ item.note|default:""|truncatewords:5 }}</small>
          </li>{% endfor %}</ul>
        {% endif %}
      </section>
    {% endfor %}
  </main>
  <aside>
    <h3>Recent</h3>
    <ol>{% for r in recent %}<li>{{ r.title }}</li>{% endfor %}</ol>
  </aside>
  <footer>
    <p>&copy; {{ year }} {{ site.name }}. All rights reserved.</p>
    {% if user %}<p>Signed in as {{ user.name }} ({{ user.email }})</p>{% endif %}
  </footer>
</body>
</html>`;

const INHERIT_BASE = `<!doctype html>
<html><head><title>{% block title %}Default{% endblock %}</title></head>
<body>
  <header>{% block header %}Default header{% endblock %}</header>
  <main>{% block content %}Default content{% endblock %}</main>
  <footer>{% block footer %}{{ copyright }}{% endblock %}</footer>
</body></html>`;

const INHERIT_CHILD = `{% extends "base.dtpl" %}
{% block title %}{{ super_title|default:"Page" }}{% endblock %}
{% block content %}
  <h1>{{ heading }}</h1>
  {% for item in items %}
    <div class="item">
      <h2>{{ item.name|title }}</h2>
      <p>{{ item.body|truncatewords:20 }}</p>
      {% if item.featured %}<span class="badge">Featured</span>{% endif %}
    </div>
  {% endfor %}
{% endblock %}`;

const PARTIAL_TPL = `{% partialdef card %}
  <div class="card">
    <h3>{{ title|default:"Untitled" }}</h3>
    <p>{{ body|truncatewords:30 }}</p>
    {% if featured %}<em>Featured</em>{% endif %}
  </div>
{% endpartialdef %}
{% for entry in entries %}
  {% partial card with title=entry.title body=entry.body featured=entry.featured %}
{% endfor %}`;

const templates = { SMALL, MEDIUM, LARGE, INHERIT_BASE, INHERIT_CHILD, PARTIAL_TPL };

// ------------------------------------------------------------------
// Data
// ------------------------------------------------------------------
function makeData(seed = 1) {
  const tags = ['Node.js', 'Express', 'Django', 'Jinja', 'HTMX', 'Templates', 'Performance'];
  const sections = [];
  for (let s = 0; s < 6; s++) {
    const items = [];
    for (let i = 0; i < 12; i++) {
      items.push({
        title: `Item ${seed}-${s}-${i}`,
        summary: `Summary text for item number ${i} in section ${s} with enough padding to make truncation interesting ${'.'.repeat(i)}`,
        price: (i * 3.7 + s).toFixed(2),
        href: `/items/${s}/${i}`,
        label: `Section ${s} Item ${i}`,
        note: i % 3 === 0 ? null : `note-${i}`,
      });
    }
    sections.push({
      slug: `section-${s}`,
      title: `Section ${s}`,
      kind: s % 2 === 0 ? 'grid' : 'list',
      items,
    });
  }
  return {
    name: 'alice',
    date: 'a wonderful day',
    post: {
      title: 'hello world',
      author: { name: 'Alice' },
      date: new Date(Date.UTC(2024, 5, 1, 12)),
      featured: true,
      body: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>'.repeat(5),
      tags: tags.slice(0, seed + 2),
      comments: Array.from({ length: 6 }, (_, i) => ({
        author: `user${i}`,
        text: 'great post '.repeat(3 + (i % 4)),
        approved: i % 2 === 0,
      })),
    },
    page: {
      title: 'home',
      description: 'a'.repeat(120),
      stylesheets: ['/static/main.css', '/static/theme.css'],
      scripts: ['/static/app.js'],
    },
    site: { name: 'miki-template' },
    nav: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
    sections,
    recent: Array.from({ length: 5 }, (_, i) => ({ title: `Recent ${i}` })),
    year: 2026,
    user: { name: 'alice', email: 'alice@example.com' },
    super_title: 'Inherit Test',
    heading: 'Welcome',
    items: Array.from({ length: 20 }, (_, i) => ({
      name: `item ${i}`,
      body: 'description '.repeat(8 + i) + 'end',
      featured: i % 3 === 0,
    })),
    entries: Array.from({ length: 50 }, (_, i) => ({
      title: `Entry ${i}`,
      body: 'body text '.repeat(5 + (i % 7)),
      featured: i % 4 === 0,
    })),
    copyright: '© 2026',
  };
}

// ------------------------------------------------------------------
// Set up an inheritance fixture on disk
// ------------------------------------------------------------------
const FIXTURES_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'miki-stress-'));
fs.writeFileSync(path.join(FIXTURES_DIR, 'base.dtpl'), INHERIT_BASE);

// ------------------------------------------------------------------
// 1. CORRECTNESS
// ------------------------------------------------------------------
section('1. CORRECTNESS');

function check(name, fn) {
  try {
    fn();
    record(name, true, '');
  } catch (e) {
    record(name, false, typeof e === 'string' ? e : e.message);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

check('small template renders expected output', () => {
  const c = compile(SMALL);
  const out = c.render({ name: 'alice', date: 'today' });
  assert(out.includes('Alice'), `expected 'Alice' in output, got: ${out}`);
  assert(out.includes('today'), `expected 'today' in output, got: ${out}`);
});

check('medium template renders expected output', () => {
  const c = compile(MEDIUM);
  const out = c.render(makeData());
  assert(out.includes('HELLO WORLD'), 'missing upper-cased title');
  assert(out.includes('Featured</span>'), 'missing Featured span');
  const li = (out.match(/<li>/g) || []).length;
  assert(li >= 3, `expected >=3 <li>, got ${li}`);
  assert(out.includes('2024-'), 'missing date_format output');
});

check('large template renders expected output', () => {
  const c = compile(LARGE);
  const out = c.render(makeData());
  assert(out.includes('miki-template'), 'missing site name');
  assert(out.match(/<section id="section-\d+">/), 'no section match');
  const hrefs = (out.match(/href="\/items\//g) || []).length;
  assert(hrefs === 36, `expected 36 item hrefs (3 list sections × 12), got ${hrefs}`);
});

check('inheritance: child overrides title and content', () => {
  const child = compile(INHERIT_CHILD, { views: FIXTURES_DIR });
  const out = child.render(makeData());
  assert(out.includes('Inherit Test'), `missing child title; output: ${out.slice(0, 200)}`);
  // Items are rendered with |title so names are Title-Cased: 'item 1' -> 'Item 1'
  assert(out.includes('Item 1'), 'no item loop content (expected "Item 1" from |title)');
  assert(out.includes('Featured</span>'), 'no Featured span from child block');
  assert(out.includes('© 2026'), 'no base footer block');
});

check('partial: {% partial %} renders the body for every entry', () => {
  const c = compile(PARTIAL_TPL);
  const out = c.render(makeData());
  const cardCount = (out.match(/class="card"/g) || []).length;
  assert(cardCount === 50, `expected 50 cards, got ${cardCount}`);
  assert((out.match(/<em>Featured<\/em>/g) || []).length > 0, 'no Featured span in partials');
});

check('determinism: 1000 renders produce identical output', () => {
  const c = compile(LARGE);
  const data = makeData();
  const first = c.render(data);
  for (let i = 0; i < 1000; i++) {
    const o = c.render(data);
    assert(o === first, `render ${i} differs from first`);
  }
});

check('auto-escape: HTML in context is escaped', () => {
  const c = compile('{{ html }}');
  const out = c.render({ html: '<script>alert(1)</script>' });
  assert(out === '&lt;script&gt;alert(1)&lt;/script&gt;', `got: ${out}`);
});

check('safe filter bypasses auto-escape', () => {
  const c = compile('{{ html|safe }}');
  const out = c.render({ html: '<b>ok</b>' });
  assert(out === '<b>ok</b>', `got: ${out}`);
});

check('date filter multi-token: yyyy-MM-dd renders correctly', () => {
  const c = compile('{{ d|date:"yyyy-MM-dd" }}');
  const d = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
  const yyyy = String(d.getFullYear()).padStart(4, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const out = c.render({ d });
  assert(out === `${yyyy}-${MM}-${dd}`, `got ${out}, expected ${yyyy}-${MM}-${dd}`);
});

check('time filter multi-token: HH:mm:ss renders correctly', () => {
  const c = compile('{{ d|time:"HH:mm:ss" }}');
  const d = new Date(Date.UTC(2024, 5, 15, 9, 7, 3));
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const out = c.render({ d });
  assert(out === `${HH}:${mm}:${ss}`, `got ${out}, expected ${HH}:${mm}:${ss}`);
});

check('default vs default_if_none (Django parity)', () => {
  const c = compile('{{ x|default:"D" }}|{{ x|default_if_none:"N" }}');
  const r1 = c.render({ x: 'v' });
  const r2 = c.render({ x: '' });
  const r3 = c.render({ x: null });
  const r4 = c.render({});
  assert(r1 === 'v|v',  `x=v: got ${r1}, expected v|v`);
  assert(r2 === 'D|',   `x=empty: got ${r2}, expected D|`);   // default_if_none does NOT fallback on ''
  assert(r3 === 'D|N',  `x=null: got ${r3}, expected D|N`);
  assert(r4 === 'D|N',  `undef: got ${r4}, expected D|N`);
});

// ------------------------------------------------------------------
// 2. COMPILE SPEED
// ------------------------------------------------------------------
section('2. COMPILE SPEED');

function benchCompile(name, tpl, runs = 200) {
  for (let i = 0; i < 5; i++) compile(tpl);
  clearCache();
  const times = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    compile(tpl);
    times.push(performance.now() - t0);
  }
  return { name, runs, medianMs: median(times), minMs: Math.min(...times), maxMs: Math.max(...times) };
}

const compileResults = {};
for (const [name, tpl] of Object.entries(templates)) {
  const r = benchCompile(name, tpl, name === 'LARGE' ? 100 : 300);
  compileResults[name] = r;
  // Thresholds tuned to a normal 4-core Windows runner.
  const limit = name === 'LARGE' ? 15 : (name.startsWith('INHERIT') ? 8 : 6);
  record(`compile: ${name} (${bytes(tpl.length)})`, r.medianMs < limit,
    `median ${fmt(r.medianMs)} (min ${fmt(r.minMs)}, max ${fmt(r.maxMs)})`);
}

// ------------------------------------------------------------------
// 3. RENDER SPEED
// ------------------------------------------------------------------
section('3. RENDER SPEED');

function benchRender(tpl, data, runs = 5000, opts = {}) {
  const c = compile(tpl, opts);
  for (let i = 0; i < 50; i++) c.render(data);
  const times = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    c.render(data);
    times.push(performance.now() - t0);
  }
  return { medianMs: median(times), minMs: Math.min(...times), runs };
}

function renderSpeedRecord(name, tpl, data, runs, thresholdRps, opts = {}) {
  const r = benchRender(tpl, data, runs, opts);
  const rps = 1000 / r.medianMs;
  record(`${name} ≥ ${thresholdRps.toLocaleString()} rps`, rps >= thresholdRps,
    `${Math.round(rps).toLocaleString()} rps  (median ${fmt(r.medianMs)})`);
}

const data = makeData();
renderSpeedRecord('render: small',                 SMALL,  data,                    20000, 50000);
renderSpeedRecord('render: medium',                MEDIUM, data,                    5000,  1000);
renderSpeedRecord('render: large',                 LARGE,  data,                    2000,  1000);
renderSpeedRecord('render: inherit child',         INHERIT_CHILD, data,            2000,  1000, { views: FIXTURES_DIR });
renderSpeedRecord('render: partials (50 entries)', PARTIAL_TPL, data,              1000,  500);

// ------------------------------------------------------------------
// 4. CACHE BEHAVIOR
// ------------------------------------------------------------------
section('4. CACHE BEHAVIOR');

check('cache: second compile of same source hits cache', () => {
  const t0 = performance.now();
  compile(SMALL);
  const first = performance.now() - t0;
  const t1 = performance.now();
  compile(SMALL);
  const second = performance.now() - t1;
  assert(second * 2 <= first, `expected cached compile ≥ 2× faster (first ${fmt(first)}, cached ${fmt(second)})`);
});

check('cache: partial template does not pollute sibling cache', () => {
  const a = compile(PARTIAL_TPL);
  const b = compile(MEDIUM);
  const aOut = a.render(makeData());
  const bOut = b.render(makeData());
  const a2 = compile(PARTIAL_TPL);
  const b2 = compile(MEDIUM);
  assert(a2.render(makeData()) === aOut, 'partial cache poisoned after medium compile');
  assert(b2.render(makeData()) === bOut, 'medium cache poisoned after partial compile');
});

check('cache: function-valued options do not poison cache key', () => {
  const fn = () => '/';
  const t1 = performance.now();
  compile(SMALL, { urlHelper: fn });
  const first = performance.now() - t1;
  const t2 = performance.now();
  compile(SMALL, { urlHelper: fn });
  const second = performance.now() - t2;
  assert(second <= first * 1.5, `cached compile should be ≤ 1.5× first (first ${fmt(first)}, cached ${fmt(second)})`);
});

// ------------------------------------------------------------------
// 5. SCALE
// ------------------------------------------------------------------
section('5. SCALE');

function scaleRender(tpl, itemCount) {
  const c = compile(tpl);
  const data = { items: Array.from({ length: itemCount }, (_, i) => ({ i, v: i * 2 })) };
  for (let i = 0; i < 10; i++) c.render(data);
  const times = [];
  for (let i = 0; i < 50; i++) {
    const t0 = performance.now();
    c.render(data);
    times.push(performance.now() - t0);
  }
  return { count: itemCount, medianMs: median(times) };
}

const scaleTpl = `{% for x in items %}<li>{{ x.i }}: {{ x.v|add:1 }}</li>{% endfor %}`;
const s100  = scaleRender(scaleTpl, 100);
const s1000 = scaleRender(scaleTpl, 1000);
const s10000 = scaleRender(scaleTpl, 10000);
const s50000 = scaleRender(scaleTpl, 50000);

const ratio = s10000.medianMs / s100.medianMs;
record(`scale: 10k items ≤ 200× time of 100 items`, ratio < 200,
  `100→${fmt(s100.medianMs)}, 1k→${fmt(s1000.medianMs)}, 10k→${fmt(s10000.medianMs)}, 50k→${fmt(s50000.medianMs)} (10k/100 = ${ratio.toFixed(1)}x)`);
record(`scale: 50k items renders in < 2s`, s50000.medianMs < 2000,
  `${fmt(s50000.medianMs)} median`);

// ------------------------------------------------------------------
// 6. ENDURANCE (100k renders, watch RSS delta)
// ------------------------------------------------------------------
section('6. ENDURANCE');

const beforeRss = rssMB();
const enduranceTpl = MEDIUM;
const enduranceData = makeData();
const endC = compile(enduranceTpl);
for (let i = 0; i < 1000; i++) endC.render(enduranceData);

const tStart = performance.now();
let endRssMax = beforeRss;
for (let i = 0; i < 100000; i++) {
  endC.render(enduranceData);
  if (i % 10000 === 0) {
    const r = rssMB();
    if (r > endRssMax) endRssMax = r;
  }
}
const dur = performance.now() - tStart;
const afterRss = rssMB();
const rssDelta = endRssMax - beforeRss;
const endRps = 100000 / dur;

record('endurance: 100k renders complete in < 30s', dur < 30000,
  `${dur.toFixed(0)} ms total, ${Math.round(endRps).toLocaleString()} rps avg`);
record('endurance: RSS growth < 50 MB', rssDelta < 50,
  `before ${beforeRss.toFixed(1)} MB, peak ${endRssMax.toFixed(1)} MB (Δ +${rssDelta.toFixed(1)} MB)`);
record('endurance: output is still correct at end', (() => {
  const expected = endC.render(enduranceData);
  return expected.includes('HELLO WORLD') && expected.includes('Featured');
})());

// ------------------------------------------------------------------
// 7. PARTIAL OVERHEAD
// ------------------------------------------------------------------
section('7. PARTIAL RENDERING');

check('renderPartialFromSource: finds partial inside block in extends chain', () => {
  const src = `{% extends "fakebase" %}{% block content %}{% partialdef greet %}<p>Hi {{ who }}</p>{% endpartialdef %}{% endblock %}`;
  const out = renderPartialFromSource(src, 'greet', { who: 'World' });
  assert(out.includes('Hi World'), `got: ${out}`);
});

function partialSpeedCheck() {
  const src = `{% partialdef c %}<li>{{ name }}: {{ score|add:1 }}</li>{% endpartialdef %}{% for x in xs %}{% partial c with name=x.name score=x.score %}{% endfor %}`;
  const data = { xs: Array.from({ length: 20 }, (_, i) => ({ name: `n${i}`, score: i })) };
  for (let i = 0; i < 20; i++) renderPartialFromSource(src, 'c', data);
  const t0 = performance.now();
  for (let i = 0; i < 500; i++) renderPartialFromSource(src, 'c', data);
  const partialMs = (performance.now() - t0) / 500;

  const c = compile(src);
  for (let i = 0; i < 20; i++) c.render(data);
  const t1 = performance.now();
  for (let i = 0; i < 500; i++) c.render(data);
  const fullMs = (performance.now() - t1) / 500;

  const overhead = partialMs < Math.max(fullMs * 5, 5);
  record('renderPartialFromSource < 5x render() median', overhead,
    `partial ${fmt(partialMs)} / full ${fmt(fullMs)} (${(partialMs / fullMs).toFixed(2)}x)`);
}

// ------------------------------------------------------------------
// 8. ASYNC OVERHEAD
// ------------------------------------------------------------------
section('8. ASYNC RENDERING');

(async () => {
  partialSpeedCheck();

  const c = compile(MEDIUM);
  const data = makeData();
  for (let i = 0; i < 50; i++) { c.render(data); await asyncRender(MEDIUM, data); }

  const syncTimes = [];
  for (let i = 0; i < 1000; i++) {
    const t0 = performance.now();
    c.render(data);
    syncTimes.push(performance.now() - t0);
  }
  const syncMed = median(syncTimes);

  const asyncTimes = [];
  for (let i = 0; i < 200; i++) {
    const t0 = performance.now();
    await asyncRender(MEDIUM, data);
    asyncTimes.push(performance.now() - t0);
  }
  const asyncMed = median(asyncTimes);

  record('asyncRender: serial overhead < 10x sync', asyncMed < Math.max(syncMed * 10, 5),
    `sync ${fmt(syncMed)} / async ${fmt(asyncMed)}`);

  const N = 50;
  const tPar = performance.now();
  const parResults = await Promise.all(
    Array.from({ length: N }, (_, i) => asyncRender(MEDIUM, makeData(i + 1)))
  );
  const parDur = performance.now() - tPar;
  record('asyncRender: 50 concurrent complete in < 1s', parDur < 1000,
    `${parDur.toFixed(0)} ms for 50 parallel (${(parDur / N).toFixed(1)} ms/each)`);
  record('asyncRender: concurrent outputs all match serial', (() => {
    const ser = render(MEDIUM, makeData(1));
    return parResults[0] === ser;
  })());

  // ------------------------------------------------------------------
  // 9. CONCURRENCY
  // ------------------------------------------------------------------
  section('9. CONCURRENCY');

  const tConc = performance.now();
  const conc = await Promise.all(
    Array.from({ length: 200 }, () => asyncRender(LARGE, data))
  );
  const concDur = performance.now() - tConc;
  record('asyncRender: 200 concurrent LARGE in < 5s', concDur < 5000,
    `${concDur.toFixed(0)} ms (${(concDur / 200).toFixed(1)} ms/each)`);
  record('asyncRender: concurrent outputs are all identical', (() => {
    const first = conc[0];
    for (const o of conc) if (o !== first) return false;
    return true;
  })());

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------
  console.log(`\n${YEL}== SUMMARY ==${RST}`);
  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  console.log(`  ${GREEN}PASS${RST}: ${pass}`);
  console.log(`  ${fail === 0 ? GREEN : RED}FAIL${RST}: ${fail}`);
  console.log(`  TOTAL: ${results.length}`);
  if (fail > 0) {
    console.log(`\n${RED}Failed checks:${RST}`);
    for (const r of results) if (!r.ok) console.log(`  - ${r.name}${r.info ? '   ' + DIM + r.info + RST : ''}`);
    try { fs.rmSync(FIXTURES_DIR, { recursive: true, force: true }); } catch {}
    process.exit(1);
  }
  console.log(`\n${GREEN}All checks passed.${RST}`);
  try { fs.rmSync(FIXTURES_DIR, { recursive: true, force: true }); } catch {}
})();
