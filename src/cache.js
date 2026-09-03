// Simple AST cache module

/**
 * In‑memory LRU cache for compiled templates.
 * For demo purposes we use a plain Map limited to 100 entries.
 */
const CACHE_LIMIT = 100;
const cache = new Map();

/**
 * Parent-source cache shared across renders. Populated by
 * renderAST/renderASTAsync in src/index.js so that `{% extends %}`
 * doesn't re-read the parent file from disk on every render.
 */
const parentSourceCache = new Map();
const PARENT_SOURCE_LIMIT = 64;

function getParentSource(key, loader) {
  if (parentSourceCache.has(key)) {
    const v = parentSourceCache.get(key);
    parentSourceCache.delete(key);
    parentSourceCache.set(key, v);
    return v;
  }
  const v = loader();
  if (v != null) {
    parentSourceCache.set(key, v);
    if (parentSourceCache.size > PARENT_SOURCE_LIMIT) {
      const firstKey = parentSourceCache.keys().next().value;
      parentSourceCache.delete(firstKey);
    }
  }
  return v;
}

function hasParentSource(key) {
  return parentSourceCache.has(key);
}

/**
 * Retrieve a compiled template from cache or compile it and store.
 * @param {string} templateStr – template source
 * @param {object} compileOptions – options passed to compile()
 * @param {function} compileFn – the original compile function from src/index.js
 * @returns {object} compiled template object
 */
function getCompiled(templateStr, compileOptions, compileFn) {
  // Build a cache key that ignores non-serializable option values
  // (e.g. functions like urlHelper, custom callbacks) — those don't
  // affect template compilation, only render behavior.
  const serializable = {};
  for (const [k, v] of Object.entries(compileOptions || {})) {
    if (typeof v === 'function' || typeof v === 'undefined') continue;
    serializable[k] = v;
  }
  const key = JSON.stringify({ templateStr, compileOptions: serializable });
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
  parentSourceCache.clear();
}

module.exports = { getCompiled, clearCache, getParentSource, hasParentSource };
