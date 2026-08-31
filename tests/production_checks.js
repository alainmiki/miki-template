// Production readiness checks
const { render, compile } = require('../src/index');
const checks = [];

try {
  render('{% if x %}hello', {});
  checks.push('FAIL: should throw on unclosed if');
} catch(e) {
  checks.push('OK: unclosed if throws: ' + e.message.slice(0, 50));
}

try {
  render('{{ x|nonexistent }}', { x: 'hi' });
  checks.push('FAIL: should throw on unknown filter');
} catch(e) {
  checks.push('OK: unknown filter throws: ' + e.message.slice(0, 50));
}

try {
  render('{% nonexistent_tag %}', {});
  checks.push('FAIL: should throw on unknown tag');
} catch(e) {
  checks.push('OK: unknown tag throws: ' + e.message.slice(0, 50));
}

const xss = render('{{ x }}', { x: '<script>alert(1)</script>' });
checks.push(xss.includes('&lt;script&gt;') ? 'OK: XSS auto-escaped' : 'FAIL: XSS not escaped');

const safe = render('{{ x|safe }}', { x: '<b>bold</b>' });
checks.push(safe === '<b>bold</b>' ? 'OK: safe filter works' : 'FAIL: safe: ' + safe);

const c1 = compile('{% cycle a b c %}');
const r1 = c1.render({});
const r2 = c1.render({});
checks.push(r1 !== r2 ? 'OK: cycle resets' : 'WARN: cycle state: ' + r1 + '/' + r2);

try {
  render('{{ x }}', { x: 'a'.repeat(100000) });
  checks.push('OK: handles large input');
} catch(e) {
  checks.push('FAIL: large input: ' + e.message);
}

const nullTest = render('{{ x }}', { x: null });
checks.push(nullTest === '' ? 'OK: null renders empty' : 'FAIL: null=' + nullTest);

try {
  render('{% extends "../etc/passwd" %}', {});
  checks.push('FAIL: path traversal not blocked');
} catch(e) {
  checks.push('OK: path traversal blocked: ' + e.message.slice(0, 50));
}

const nested = render('{% for i in outer %}{% for j in i %}{{ forloop.parentloop.counter }}.{{ forloop.counter }} {% endfor %}{% endfor %}', { outer: [[1,2],[3,4]] });
checks.push(nested.trim() === '1.1 1.2 2.1 2.2' ? 'OK: nested forloop' : 'WARN nested: ' + nested);

console.log(checks.join('\n'));
