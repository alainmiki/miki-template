/**
 * Central tag registry for template tags.
 */

const tagRegistry = {};

function registerTag(name, parserFn) {
  tagRegistry[name] = parserFn;
}

function getTagRegistry() {
  return tagRegistry;
}

module.exports = {
  registerTag,
  getTagRegistry
};
