const pug = require('pug');
const { performance } = require('perf_hooks');

const SMALL = `each item in items\n  = item.toUpperCase() + ':' + item.length\n`;
const MEDIUM = `- for (let i = 0; i < 50; i++)\n  if i % 2 === 0\n    | Even: #{i}\n  else\n    | Odd: #{i}\n`;
const LARGE = `- for (let i = 0; i < 500; i++)\n  - for (let j = 0; j < 5; j++)\n    | #{i}:#{j} #{'x'.repeat(10)}\n`;

const data = {
  items: ['alpha', 'beta', 'gamma', 'delta', 'epsilon']
};

function bench(name, tpl, data, iterations = 5000) {
  const compiled = pug.compile(tpl);
  for (let i = 0; i < 20; i++) compiled(data);

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    compiled(data);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const rps = Math.round(1000 / median);
  console.log(`${name}: ${median.toFixed(3)} ms/op  (~${rps.toLocaleString()} rps)`);
  return { name, medianMs: median, rps };
}

const results = [];
results.push(bench('pug:small', SMALL, data, 10000));
results.push(bench('pug:medium', MEDIUM, data, 5000));
results.push(bench('pug:large', LARGE, data, 1000));

const outPath = require('path').join(__dirname, 'pug-results.json');
require('fs').writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to ${outPath}`);
