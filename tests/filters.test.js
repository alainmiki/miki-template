const test = require('node:test');
const assert = require('node:assert');
const { getFilter } = require('../src/filters');

test('Filters - Text filters', () => {
  const upper = getFilter('upper');
  assert.strictEqual(upper('hello'), 'HELLO');

  const capfirst = getFilter('capfirst');
  assert.strictEqual(capfirst('hello'), 'Hello');

  const truncatewords = getFilter('truncatewords');
  assert.strictEqual(truncatewords('one two three four', 2), 'one two ...');

  const slugify = getFilter('slugify');
  assert.strictEqual(slugify('Hello World! New-Post'), 'hello-world-new-post');
});

test('Filters - HTML / Security filters', () => {
  const safe = getFilter('safe');
  const escape = getFilter('escape');

  assert.strictEqual(String(escape('<script>')), '&lt;script&gt;');
  // Safe returns SafeString which resolves when cast to string
  assert.strictEqual(String(safe('<p>')), '<p>');
});

test('Filters - List filters', () => {
  const length = getFilter('length');
  assert.strictEqual(length([1, 2, 3]), 3);

  const join = getFilter('join');
  assert.strictEqual(join(['a', 'b', 'c'], '-'), 'a-b-c');

  const slice = getFilter('slice');
  assert.deepEqual(slice([1, 2, 3, 4], '1:3'), [2, 3]);
});

test('Filters - Default filters', () => {
  const def = getFilter('default');
  assert.strictEqual(def(null, 'fallback'), 'fallback');
  assert.strictEqual(def('value', 'fallback'), 'value');
});

test('Filters - Misc filters', () => {
  const pluralize = getFilter('pluralize');
  assert.strictEqual(pluralize(1), '');
  assert.strictEqual(pluralize(2), 's');
  assert.strictEqual(pluralize(1, 'y,ies'), 'y');
  assert.strictEqual(pluralize(2, 'y,ies'), 'ies');
});

test('Filters - urlencode and escapeuri', () => {
  const urlencode = getFilter('urlencode');
  assert.strictEqual(urlencode('hello world'), 'hello+world');
  assert.strictEqual(urlencode('a b c'), 'a+b+c');

  const escapeuri = getFilter('escapeuri');
  assert.ok(escapeuri('http://example.com/path with spaces').includes('path%20with%20spaces'));
});

test('Filters - stringformat', () => {
  const stringformat = getFilter('stringformat');
  assert.strictEqual(stringformat('hello', '%s'), 'hello');
  assert.strictEqual(stringformat(42, '%d'), '42');
  assert.strictEqual(stringformat(3.14159, '%.2f'), '3.14');
});

test('Filters - cut and addslashes', () => {
  const cut = getFilter('cut');
  assert.strictEqual(cut('hello hello', ' '), 'hellohello');

  const addslashes = getFilter('addslashes');
  assert.strictEqual(addslashes('He said "Hi"'), 'He said \\"Hi\\"');
});

test('Filters - length_is', () => {
  const length_is = getFilter('length_is');
  assert.strictEqual(length_is([1, 2, 3], 3), true);
  assert.strictEqual(length_is([1, 2], 3), false);
});

test('Filter chaining via template', () => {
  const { render } = require('../src/index');
  const result = render('{{ value|lower|capfirst }}', { value: 'Hello World' });
  assert.strictEqual(result, 'Hello world');

  const result2 = render('{{ items|length|add:5 }}', { items: [1, 2, 3] });
  assert.strictEqual(result2, '8');
});

test('Filter chaining on string literal', () => {
  const { render } = require('../src/index');
  const result = render('{{ "Hello World"|lower|capfirst }}', {});
  assert.strictEqual(result, 'Hello world');

  const result2 = render('{{ "  trim me  "|cut:" " }}', {});
  assert.strictEqual(result2, 'trimme');
});

test('Filters - Math filters', () => {
  const sub = getFilter('sub');
  assert.strictEqual(sub(10, 3), 7);

  const mult = getFilter('mult');
  assert.strictEqual(mult(4, 5), 20);

  const square = getFilter('square');
  assert.strictEqual(square(6), 36);

  const sqrt = getFilter('sqrt');
  assert.strictEqual(sqrt(9), 3);
  assert.strictEqual(sqrt(0), 0);
  assert.strictEqual(sqrt(-1), 0);

  const mod = getFilter('mod');
  assert.strictEqual(mod(10, 3), 1);
  assert.strictEqual(mod(10, 0), 0);
});

test('Filters - Data formatting filters', () => {
  const currency = getFilter('currency');
  assert.strictEqual(currency(1234.5), '$1,234.50');
  assert.strictEqual(currency(1234.5, '€'), '€1,234.50');

  const phone_number = getFilter('phone_number');
  assert.strictEqual(phone_number('1234567890'), '(123) 456-7890');
  assert.strictEqual(phone_number('11234567890'), '+1 (123) 456-7890');

  const email = getFilter('email');
  assert.strictEqual(email('user@example.com'), 'mailto:user@example.com');

  const url = getFilter('url');
  assert.strictEqual(url('example.com'), 'https://example.com');
  assert.strictEqual(url('https://example.com'), 'https://example.com');

  const mask = getFilter('mask');
  assert.strictEqual(mask('1234567890'), '******7890');
  assert.strictEqual(mask('1234567890', '#'), '######7890');

  const whatsapp_link = getFilter('whatsapp_link');
  assert.strictEqual(whatsapp_link('1234567890'), 'https://wa.me/1234567890');
  assert.strictEqual(whatsapp_link('1234567890', 'Hello'), 'https://wa.me/1234567890?text=Hello');
});

test('Filters - Additional Math filters (abs, round, floor, ceil)', () => {
  const abs = getFilter('abs');
  assert.strictEqual(abs(-5), 5);
  assert.strictEqual(abs(5), 5);
  assert.strictEqual(abs(0), 0);

  const round = getFilter('round');
  assert.strictEqual(round(3.14159, 2), 3.14);
  assert.strictEqual(round(3.5), 4);
  assert.strictEqual(round(3.4), 3);

  const floor = getFilter('floor');
  assert.strictEqual(floor(3.7), 3);
  assert.strictEqual(floor(-3.7), -4);

  const ceil = getFilter('ceil');
  assert.strictEqual(ceil(3.2), 4);
  assert.strictEqual(ceil(-3.2), -3);
});

test('Filters - min/max/sum/average', () => {
  const min = getFilter('min');
  assert.strictEqual(min([5, 2, 8, 1]), 1);
  assert.strictEqual(min(5, 2), 2);

  const max = getFilter('max');
  assert.strictEqual(max([5, 2, 8, 1]), 8);
  assert.strictEqual(max(5, 2), 5);

  const sum = getFilter('sum');
  assert.strictEqual(sum([1, 2, 3, 4]), 10);
  assert.strictEqual(sum([]), 0);

  const average = getFilter('average');
  assert.strictEqual(average([1, 2, 3, 4]), 2.5);
  assert.strictEqual(average([]), 0);
});

test('Filters - reverse, sort, unique, random', () => {
  const reverse = getFilter('reverse');
  assert.strictEqual(reverse('hello'), 'olleh');
  assert.deepEqual(reverse([1, 2, 3]), [3, 2, 1]);

  const sort = getFilter('sort');
  assert.deepEqual(sort([3, 1, 2]), [1, 2, 3]);

  const unique = getFilter('unique');
  assert.deepEqual(unique([1, 2, 2, 3]), [1, 2, 3]);

  const random = getFilter('random');
  const arr = [1, 2, 3, 4, 5];
  const r = random(arr);
  assert.ok(arr.includes(r));
});

test('Filters - split, replace', () => {
  const split = getFilter('split');
  assert.deepEqual(split('a,b,c', ','), ['a', 'b', 'c']);
  assert.deepEqual(split('hello world'), ['hello', 'world']);

  const replace = getFilter('replace');
  assert.strictEqual(replace('hello world', 'world,Earth'), 'hello Earth');
});

test('Filters - base64_encode, base64_decode', () => {
  const encode = getFilter('base64_encode');
  const decode = getFilter('base64_decode');
  assert.strictEqual(encode('hello'), 'aGVsbG8=');
  assert.strictEqual(decode('aGVsbG8='), 'hello');
  assert.strictEqual(decode('not-base64'), 'not-base64');
});

test('Filters - urlize, json, truncatechars_html', () => {
  const urlize = getFilter('urlize');
  assert.ok(urlize('visit https://example.com for more').includes('<a href="https://example.com">https://example.com</a>'));

  const json = getFilter('json');
  assert.ok(json({a: 1, b: 2}).value.includes('"a":1'));

  const truncatechars_html = getFilter('truncatechars_html');
  const result = truncatechars_html('<p>Hello world</p>', 10);
  assert.ok(result.value.includes('Hello worl'));
  assert.ok(result.value.includes('...'));
});

test('Filters - time_diff, ago, until', () => {
  const time_diff = getFilter('time_diff');
  assert.ok(time_diff(new Date(Date.now() - 3600000)).includes('hour'));

  const ago = getFilter('ago');
  assert.ok(ago(new Date(Date.now() - 86400000)).includes('day ago'));

  const until = getFilter('until');
  assert.ok(until(new Date(Date.now() + 86400000)).includes('day'));
});

test('Filters - credit_card, ssn, ip_address, uuid', () => {
  const credit_card = getFilter('credit_card');
  assert.strictEqual(credit_card('4111111111111111'), '4111-1111-1111-1111');

  const ssn = getFilter('ssn');
  assert.strictEqual(ssn('123456789'), '123-45-6789');

  const ip_address = getFilter('ip_address');
  assert.strictEqual(ip_address('192168011001'), '1921.6801.10.01');

  const uuid = getFilter('uuid');
  assert.ok(uuid().match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
});
