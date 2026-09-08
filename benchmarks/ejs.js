const ejs = require('ejs');
const { performance } = require('perf_hooks');

const SMALL = `<% items.forEach(item => { %>\n<%= item.toUpperCase() %>:<%= item.length %>\n<% }) %>`;
const MEDIUM = `<% big_items.forEach(i => { %>\n<% if (i % 2 === 0) { %>Even: <%= i %>\n<% } else { %>Odd: <%= i %>\n<% } }) %>`;
const LARGE = `<% big_items.forEach(i => { %>\n<% small_items.forEach(j => { %>\n<%= i %>:<%= j %> <%= 'x'.repeat(10) %>\n<% }) }) %>`;

const data = {
  items: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
  big_items: Array.from({ length: 500 }, (_, i) => i),
  small_items: Array.from({ length: 5 }, (_, j) => j)
};

function bench(name, tpl, data, iterations = 5000) {
  const compiled = ejs.compile(tpl);
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
results.push(bench('ejs:small', SMALL, data, 10000));
results.push(bench('ejs:medium', MEDIUM, data, 5000));
results.push(bench('ejs:large', LARGE, data, 1000));

const outPath = require('path').join(__dirname, 'ejs-results.json');
require('fs').writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to ${outPath}`);
