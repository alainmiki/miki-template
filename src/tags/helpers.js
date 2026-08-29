// Custom Tag Helpers module
// Allows registration of simple block helpers that can be used in templates.
// Usage: const { registerHelper } = require('../src/tags/helpers');
// registerHelper('markdown', (content, context) => {
//   // Example: convert markdown to HTML (placeholder implementation)
//   const markdownIt = require('markdown-it')();
//   return markdownIt.render(content);
// });

const { registerTag } = require('../tags/registry');

/**
 * Helper node class used by custom helpers.
 * It renders the inner block content, then passes the resulting string
 * to the registered helper function.
 */
class HelperNode {
  constructor(name, fn, body) {
    this.name = name;
    this.fn = fn;
    this.body = body; // array of child nodes
  }

  render(context) {
    // Render inner body synchronously; if body nodes return promises we ignore for now.
    const inner = this.body.map(n => n.render(context)).join('');
    // Helper functions may be sync or async; we support both.
    const result = this.fn(inner, context);
    return result instanceof Promise ? result : result;
  }
}

/**
 * Register a custom block helper.
 * @param {string} name - Tag name used in the template, e.g. {% markdown %}…{% endmarkdown %}
 * @param {function} fn - Function that receives (innerContent, context) and returns a string or Promise.
 */
function registerHelper(name, fn) {
  // The parser for the helper creates a HelperNode with the provided function.
  const parserFn = (tagContent, parser) => {
    // Parse the inner block until the matching end tag.
    const body = parser.parseUntilTag(`end${name}`);
    return new HelperNode(name, fn, body);
  };
  registerTag(name, parserFn);
}

module.exports = { registerHelper };
