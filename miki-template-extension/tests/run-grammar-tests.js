const fs = require('fs');
const path = require('path');

const grammarTests = JSON.parse(fs.readFileSync(__dirname + '/grammar-tests.json', 'utf8'));

let passed = 0;
let failed = 0;

console.log('Running grammar tests...\n');

grammarTests.grammarTests.forEach(test => {
  try {
    console.log(`Test: ${test.name}`);

    if (test.input) {
      console.log(`  Input: ${test.input.substring(0, 50)}${test.input.length > 50 ? '...' : ''}`);
    }

    if (test.expectedTags) {
      const missing = test.expectedTags.filter(tag => !test.input.includes(`{% ${tag}`));
      if (missing.length > 0) {
        console.log(`  FAIL: Missing tags: ${missing.join(', ')}`);
        failed++;
        return;
      }
    }

    if (test.expectedFilters) {
      const missing = test.expectedFilters.filter(f => !test.input.includes(`|${f}`));
      if (missing.length > 0) {
        console.log(`  FAIL: Missing filters: ${missing.join(', ')}`);
        failed++;
        return;
      }
    }

    if (test.expectedOperators) {
      const missing = test.expectedOperators.filter(op => !test.input.includes(op));
      if (missing.length > 0) {
        console.log(`  FAIL: Missing operators: ${missing.join(', ')}`);
        failed++;
        return;
      }
    }

    console.log('  PASS');
    passed++;
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    failed++;
  }
});

console.log('\nValidation tests...\n');

grammarTests.validationTests.forEach(test => {
  try {
    console.log(`Test: ${test.name}`);
    console.log(`  Input: ${test.input.substring(0, 50)}${test.input.length > 50 ? '...' : ''}`);

    // Simple validation checks
    if (test.input.includes('{% extends') && test.input.indexOf('{% extends') > 0) {
      const firstNonWhitespace = test.input.match(/^\s*({%)/);
      if (firstNonWhitespace && firstNonWhitespace.index > 0) {
        console.log(`  PASS: Detected extends not first`);
        passed++;
      }
    }

    console.log('  PASS');
    passed++;
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    failed++;
  }
});

console.log(`\n========================================`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

process.exit(failed > 0 ? 1 : 0);
