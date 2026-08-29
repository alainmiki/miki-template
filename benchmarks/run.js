// benchmarks/run.js
// Simple benchmark for sync vs async rendering
const { compile, asyncRender } = require('../src');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

function loadTemplate(name) {
  const filePath = path.join(__dirname, 'templates', `${name}.dtpl`);
  return fs.readFileSync(filePath, 'utf8');
}

function benchRender(name, iterations = 20) {
  const tmplStr = loadTemplate(name);
  const compiled = compile(tmplStr);
  // warm up cache
  compiled.render({});
  compiled.asyncRender({});

  const syncTimes = [];
  const asyncTimes = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    compiled.render({});
    syncTimes.push(performance.now() - t0);

    const t1 = performance.now();
    asyncRender(tmplStr, {});
    asyncTimes.push(performance.now() - t1);
  }
  const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
  return {
    name,
    syncAvgMs: avg(syncTimes).toFixed(2),
    asyncAvgMs: avg(asyncTimes).toFixed(2)
  };
}

function main() {
  const results = [];
  ['small','medium','large'].forEach(name => {
    results.push(benchRender(name));
  });
  console.log('Benchmark results:', results);
  const outPath = path.join(__dirname, 'report.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
}

main();
