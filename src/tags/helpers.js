// Custom Tag Helpers module

const { registerTag } = require('../tags/registry');

class HelperNode {
  constructor(name, fn, body) {
    this.name = name;
    this.fn = fn;
    this.body = body;
  }

  render(context) {
    const inner = this.body.map(n => n.render(context)).join('');
    const result = this.fn(inner, context);
    return result instanceof Promise ? result : result;
  }
}

function registerHelper(name, fn) {
  const parserFn = (tagContent, parser) => {
    const body = parser.parseUntilTag(`end${name}`);
    return new HelperNode(name, fn, body);
  };
  registerTag(name, parserFn);
}

module.exports = { registerHelper };