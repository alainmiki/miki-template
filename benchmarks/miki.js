const miki = require('../src');
const { performance } = require('perf_hooks');

const SMALL = `{% for item in items %}{{ item|upper }}:{{ item|length }}\n{% endfor %}`;
const MEDIUM = `{% for i in big_items %}{% if i % 2 == 0 %}Even: {{ i }}\n{% else %}Odd: {{ i }}\n{% endif %}{% endfor %}`;
const LARGE = `{% for i in big_items %}{% for j in small_items %}{{ i }}:{{ j }} {{ x10|repeat:5 }}\n{% endfor %}{% endfor %}`;

const data = {
  items: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
  big_items: Array.from({ length: 500 }, (_, i) => i),
  small_items: Array.from({ length: 5 }, (_, j) => j),
  x10: 'x'
};

function bench(name, tpl, data, iterations = 5000) {
  const compiled = miki.compile(tpl);
  for (let i = 0; i < 20; i++) compiled.render(data);

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    compiled.render(data);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const rps = Math.round(1000 / median);
  console.log(`${name}: ${median.toFixed(3)} ms/op  (~${rps.toLocaleString()} rps)`);
  return { name, medianMs: median, rps };
}

const results = [];
results.push(bench('miki:small', SMALL, data, 10000));
results.push(bench('miki:medium', MEDIUM, data, 5000));
results.push(bench('miki:large', LARGE, data, 1000));

const outPath = require('path').join(__dirname, 'miki-results.json');
require('fs').writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to ${outPath}`);
