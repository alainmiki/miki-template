const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { render, compile } = require('../src/index');

test('Tags - If / Elif / Else', () => {
  const tpl = '{% if value == 1 %}One{% elif value == 2 %}Two{% else %}Other{% endif %}';
  assert.strictEqual(render(tpl, { value: 1 }), 'One');
  assert.strictEqual(render(tpl, { value: 2 }), 'Two');
  assert.strictEqual(render(tpl, { value: 3 }), 'Other');
});

test('Tags - For loop with empty and unpack', () => {
  const tpl = '{% for x in items %}{{ x }}{% empty %}No items{% endfor %}';
  assert.strictEqual(render(tpl, { items: ['a', 'b'] }), 'ab');
  assert.strictEqual(render(tpl, { items: [] }), 'No items');
});

test('Tags - For loop loop metadata', () => {
  const tpl = '{% for x in items %}{{ forloop.counter }}:{{ x }}{% if not forloop.last %},{% endif %}{% endfor %}';
  assert.strictEqual(render(tpl, { items: ['a', 'b'] }), '1:a,2:b');
});

test('Tags - With scope blocks', () => {
  const tpl = '{% with a=x b=y %}{{ a }}-{{ b }}{% endwith %}';
  assert.strictEqual(render(tpl, { x: 10, y: 20 }), '10-20');
});

test('Tags - Cycle alternating tags', () => {
  const tpl = '{% for x in items %}{% cycle "odd" "even" %} {% endfor %}';
  assert.strictEqual(render(tpl, { items: [1, 2, 3] }), 'odd even odd ');
});

test('Tags - Template inheritance and block.super', () => {
  const views = __dirname;
  const childTpl = '{% extends "child.html" %}';
  const output = render(childTpl, {}, { views });
  
  assert.match(output, /Child Header/);
  assert.match(output, /Default Header/);
  assert.match(output, /Child Content/);
});

test('Tags - Include tag', () => {
  const views = __dirname;
  const tpl = '{% include "partial.html" with item="Apple" %}';
  const output = render(tpl, {}, { views });
  assert.strictEqual(output.trim(), '<p>Included: Apple</p>');
});

test('Tags - Regroup array by property', () => {
  const people = [
    { name: 'Miki', gender: 'male' },
    { name: 'Anna', gender: 'female' },
    { name: 'John', gender: 'male' }
  ];
  const tpl = '{% regroup people by gender as grouped %}{% for g in grouped %}{{ g.grouper }}:{% for p in g.list %}{{ p.name }}{% endfor %} {% endfor %}';
  assert.strictEqual(render(tpl, { people }), 'male:MikiJohn female:Anna ');
});

test('Tags - Spaceless HTML formatting', () => {
  const tpl = '{% spaceless %}  <div>  <p>  Hello  </p>  </div>  {% endspaceless %}';
  assert.strictEqual(render(tpl), '  <div><p>  Hello  </p></div>  ');
});

test('Tags - Static file path generator', () => {
  const tpl = '{% static "images/logo.png" %}';
  assert.strictEqual(render(tpl, {}, { staticUrl: '/assets/' }), '/assets/images/logo.png');
});

test('Tags - Url mapping', () => {
  const tpl = '{% url "user-profile" "miki" %}';
  const urlHelper = (route, arg) => `/users/${arg}`;
  assert.strictEqual(render(tpl, {}, { urlHelper }), '/users/miki');
});

test('Tags - csrf_token security tag', () => {
  const tpl = '{% csrf_token %}';
  const output = render(tpl, { csrf_token: '12345' });
  assert.strictEqual(output, '<input type="hidden" name="csrfmiddlewaretoken" value="12345">');
});

test('Tags - csp_nonce_attr security tag', () => {
  const tpl = '<script {% csp_nonce_attr %} src="app.js"></script>';
  const output = render(tpl, { csp_nonce: 'xyz789' });
  assert.strictEqual(output, '<script nonce="xyz789" src="app.js"></script>');

  // If no nonce in context, output nothing
  const outputEmpty = render(tpl, {});
  assert.strictEqual(outputEmpty, '<script  src="app.js"></script>');
});

test('Tags - Partial Block Rendering via compile.renderBlock', () => {
  const views = __dirname;
  const childTpl = '{% extends "child.html" %}';
  const compiled = compile(childTpl, { views });
  
  // Render only the 'content' block
  const contentOnly = compiled.renderBlock('content');
  assert.strictEqual(contentOnly, 'Child Content');

  // Render only the 'header' block (which includes block.super)
  const headerOnly = compiled.renderBlock('header');
  assert.match(headerOnly, /Child Header/);
  assert.match(headerOnly, /Default Header/);
});

test('Tags - templatetag', () => {
  const output = render('{% templatetag openvariable %}hello{% templatetag closevariable %}', {});
  assert.strictEqual(output, '{{hello}}');
});

test('Tags - templatetag openblock/closeblock', () => {
  const output = render('{% templatetag openblock %}body{% templatetag closeblock %}', {});
  assert.strictEqual(output, '{%body%}');
});

test('Tags - load', () => {
  const output = render('{% load i18n %}', {});
  assert.strictEqual(output, '');
});

test('Tags - unclosed if throws', () => {
  assert.throws(() => {
    render('{% if x %}hello', {});
  }, /Unclosed.*if|endif/i);
});

test('Tags - unclosed for throws', () => {
  assert.throws(() => {
    render('{% for x in items %}{{ x }}', { items: [1, 2] });
  }, /Unexpected end|endfor/i);
});

test('Tags - unclosed with throws', () => {
  assert.throws(() => {
    render('{% with a=b %}{{ a }}', { b: 1 });
  }, /Unexpected end|endwith/i);
});

test('Tags - widthratio', () => {
  // 25 out of 100 with max width 150 = floor(25/100 * 150) = 37
  assert.strictEqual(render('{% widthratio 25 100 150 %}', {}), '37');
  // Edge cases
  assert.strictEqual(render('{% widthratio 0 100 150 %}', {}), '0');
  assert.strictEqual(render('{% widthratio 100 100 150 %}', {}), '150');
  assert.strictEqual(render('{% widthratio 200 100 150 %}', {}), '150');
});

test('Tags - debug', () => {
  const output = render('{% debug %}', { foo: 'bar' });
  assert.ok(output.includes('foo'));
  assert.ok(output.includes('bar'));
});

test('Tags - i18n trans tag', () => {
  const { setLanguage, registerTranslation, render } = require('../src/index');
  registerTranslation('en', { 'Hello, World!': 'Bonjour, le monde !' });
  setLanguage('en');
  const output = render('{% trans "Hello, World!" %}', {});
  assert.strictEqual(output, 'Bonjour, le monde !');
});

test('Tags - i18n language block', () => {
  const { setLanguage, registerTranslation, render } = require('../src/index');
  registerTranslation('fr', { 'Welcome': 'Bienvenue' });
  const output = render('{% language "fr" %}{% trans "Welcome" %}{% endlanguage %}', {});
  assert.strictEqual(output, 'Bienvenue');
});

test('Tags - load with real library', () => {
  const { render, registerLibrary } = require('../src/index');
  registerLibrary('mytestlib', {
    filters: {
      shout: (val) => String(val).toUpperCase() + '!'
    }
  });
  const output = render('{% load mytestlib %}{{ "hello"|shout }}', {});
  assert.strictEqual(output, 'HELLO!');
});

test('Tags - regroup filter', () => {
  const { render } = require('../src/index');
  const items = [
    { category: 'A', name: 'a1' },
    { category: 'B', name: 'b1' },
    { category: 'A', name: 'a2' }
  ];
  const output = render(
    '{% for g in items|regroup:"category" %}{{ g.grouper }}{% for i in g.list %}{{ i.name }}{% endfor %}{% endfor %}',
    { items }
  );
  assert.strictEqual(output, 'Aa1a2Bb1');
});

test('Filters - strftime with date-fns', () => {
  const { render, getFilter } = require('../src/index');
  const strftime = getFilter('strftime');
  const result = strftime(new Date('2026-08-31T22:00:00'), 'yyyy-MM-dd');
  assert.strictEqual(result, '2026-08-31');
  const result2 = strftime(new Date('2026-08-31T22:00:00'), 'HH:mm');
  assert.ok(result2.startsWith('22:'));
});
