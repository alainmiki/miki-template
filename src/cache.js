// Simple AST cache module

/**
 * In‑memory LRU cache for compiled templates.
 * For demo purposes we use a plain Map limited to 100 entries.
 */
const CACHE_LIMIT = 100;
const cache = new Map();

/**
 * Retrieve a compiled template from cache or compile it and store.
 * @param {string} templateStr – template source
 * @param {object} compileOptions – options passed to compile()
 * @param {function} compileFn – the original compile function from src/index.js
 * @returns {object} compiled template object
 */
function getCompiled(templateStr, compileOptions, compileFn) {
  const key = JSON.stringify({ templateStr, compileOptions });
  if (cache.has(key)) {
    // Move to end to mark as recently used
    const value = cache.get(key);
    cache.delete(key);
    cache.set(key, value);
    return value;
  }
  const compiled = compileFn(templateStr, compileOptions);
  cache.set(key, compiled);
  // Trim if we exceed limit
  if (cache.size > CACHE_LIMIT) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  return compiled;
}

/** Clear the cache – useful for tests */
function clearCache() {
  cache.clear();
}

module.exports = { getCompiled, clearCache };
