const Handlebars = require('handlebars');
const { performance } = require('perf_hooks');

const SMALL = `{{#each items}}{{this}}:{{this.length}}\n{{/each}}`;
const MEDIUM = `{{#each big_items}}{{#if (isEven this)}}Even: {{this}}\n{{else}}Odd: {{this}}\n{{/if}}{{/each}}`;
const LARGE = `{{#each big_items}}{{#each ../small_items}}{{this}}:{{../this}} {{repeat "x" 10}}\n{{/each}}{{/each}}`;

Handlebars.registerHelper('isEven', function(n) {
  return n % 2 === 0;
});
Handlebars.registerHelper('repeat', function(str, n) {
  return str.repeat(n);
});

const data = {
  items: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
  big_items: Array.from({ length: 500 }, (_, i) => i),
  small_items: Array.from({ length: 5 }, (_, j) => j)
};

function bench(name, tpl, data, iterations = 5000) {
  const compiled = Handlebars.compile(tpl);
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
results.push(bench('handlebars:small', SMALL, data, 10000));
results.push(bench('handlebars:medium', MEDIUM, data, 5000));
results.push(bench('handlebars:large', LARGE, data, 1000));

const outPath = require('path').join(__dirname, 'handlebars-results.json');
require('fs').writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to ${outPath}`);
