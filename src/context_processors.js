// Context Processors – similar to Django's custom context processors
// Allows users to register functions that inject additional variables into the rendering context.

const processors = [];

/**
 * Register a context processor function.
 * The function receives the current context object (plain JS object) and may return
 * an object of key/value pairs to be merged into the context.
 * @param {function(Object): (Object|undefined)} fn
 */
function registerContextProcessor(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Context processor must be a function');
  }
  processors.push(fn);
}

/**
 * Clear all registered context processors.
 */
function clearContextProcessors() {
  processors.length = 0;
}

/**
 * Apply all registered processors to the given context object.
 * Mutates the context object by merging any returned values.
 * @param {Object} ctx
 */
function applyContextProcessors(ctx) {
  for (const fn of processors) {
    const result = fn(ctx);
    if (result && typeof result === 'object') {
      Object.assign(ctx, result);
    }
  }
  return ctx;
}

module.exports = { registerContextProcessor, applyContextProcessors, clearContextProcessors };
