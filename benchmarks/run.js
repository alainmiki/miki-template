const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENGINES = ['miki', 'pug', 'ejs', 'handlebars'];
const RESULTS_DIR = __dirname;

function runBench(name) {
  const file = path.join(RESULTS_DIR, `${name}.js`);
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${name} (file not found)`);
    return null;
  }
  console.log(`\n--- Running ${name} benchmark ---`);
  const out = execSync(`node "${file}"`, { encoding: 'utf8', stdio: 'pipe' });
  console.log(out);
  const resultFile = path.join(RESULTS_DIR, `${name}-results.json`);
  if (fs.existsSync(resultFile)) {
    return JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  }
  return null;
}

function printComparison(allResults) {
  console.log('\n========================================');
  console.log('  BENCHMARK COMPARISON (lower is better)');
  console.log('========================================\n');

  const categories = ['small', 'medium', 'large'];
  for (const cat of categories) {
    console.log(`-- ${cat.toUpperCase()} --`);
    const rows = [];
    for (const [engine, results] of Object.entries(allResults)) {
      const r = results.find(x => x.name === `${engine}:${cat}`);
      if (r) rows.push({ engine, rps: r.rps, ms: r.medianMs });
    }
    rows.sort((a, b) => b.rps - a.rps);
    const bestRps = rows[0]?.rps || 1;
    for (const row of rows) {
      const pct = ((bestRps / row.rps) * 100).toFixed(0);
      const marker = row.engine === 'miki' ? '★' : ' ';
      console.log(`  ${marker}${row.engine.padEnd(12)} ${row.ms.toFixed(3).padStart(8)} ms  ${row.rps.toString().padStart(8)} rps  (${pct}%)`);
    }
    console.log('');
  }
}

function main() {
  const allResults = {};
  for (const engine of ENGINES) {
    const results = runBench(engine);
    if (results) allResults[engine] = results;
  }

  if (Object.keys(allResults).length === 0) {
    console.log('No benchmark results collected.');
    process.exit(1);
  }

  printComparison(allResults);

  const mikiResults = allResults['miki'] || [];
  const mikiAvgRps = mikiResults.reduce((a, r) => a + r.rps, 0) / mikiResults.length;
  const mikiLarge = mikiResults.find(r => r.name === 'miki:large');
  const othersSlowOnLarge = Object.entries(allResults)
    .filter(([engine]) => engine !== 'miki')
    .every(([, results]) => {
      const large = results.find(r => r.name === `${Object.keys(allResults).find(k => allResults[k] === results)}:large`);
      return !large || (mikiLarge && mikiLarge.rps >= large.rps);
    });

  if (othersSlowOnLarge) {
    console.log('★ miki-template dominates on large/real-world workloads.\n');
  } else if (mikiAvgRps >= 100000) {
    console.log('★ miki-template delivers strong performance across workloads.\n');
  } else {
    console.log('Note: miki-template performance may vary by workload.\n');
  }
}

main();
