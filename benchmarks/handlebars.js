const Handlebars = require('handlebars');
const { performance } = require('perf_hooks');

const SMALL = `{{#each items}}{{this}}:{{this.length}}\n{{/each}}`;
const MEDIUM = `{{#each (range 0 50)}}{{#if (isEven this)}}Even: {{this}}\n{{else}}Odd: {{this}}\n{{/if}}{{/each}}`;
const LARGE = `{{#each (range 0 500)}}{{#each (range 0 5)}}{{this}}:{{../this}} {{repeat "x" 10}}\n{{/each}}{{/each}}`;

Handlebars.registerHelper('range', function(start, end) {
  const arr = [];
  for (let i = start; i < end; i++) arr.push(i);
  return arr;
});
Handlebars.registerHelper('isEven', function(n) {
  return n % 2 === 0;
});
Handlebars.registerHelper('repeat', function(str, n) {
  return str.repeat(n);
});

const data = {
  items: ['alpha', 'beta', 'gamma', 'delta', 'epsilon']
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
