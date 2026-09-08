/**
 * Context manager handling scopes and dotted variable lookup.
 */
class Context {
  constructor(initial = {}, options = {}) {
    this.scopes = [initial];
    this.options = options;
    this.autoescape = true; // Autoescape state
    this.blocks = {}; // For template inheritance blocks
    this.parentTemplate = null; // For extends tag
    this.cycleStates = new Map(); // Store state for cycle tags
    this.partialDefs = new Map(); // Store partial definitions
  }

  get _local() {
    return this.scopes[0] || {};
  }

  set _local(value) {
    if (this.scopes.length === 0) {
      this.scopes.unshift(value);
    } else {
      this.scopes[0] = value;
    }
  }

  /**
   * Reset cycle state and blocks for a fresh render.
   * Called at the start of each render pass.
   */
  reset() {
    this.cycleStates.clear();
    this.blocks = {};
    this.parentTemplate = null;
  }

  /**
   * Push a new scope onto the stack.
   */
  push(scope = {}) {
    this.scopes.unshift(scope);
    return this;
  }

  /**
   * Pop the top scope from the stack.
   */
  pop() {
    if (this.scopes.length > 1) {
      this.scopes.shift();
    }
    return this;
  }

  /**
   * Resolve a dotted path lookup.
   * Examples: 'user.name', 'items.0', 'user.profile.age'
   */
  get(path) {
    if (path === undefined || path === null || path === '') {
      return '';
    }

    // Fast path for non-dotted single variable lookups
    const isString = typeof path === 'string';
    const hasDot = isString && path.includes('.');

    const baseName = hasDot ? path.split('.')[0] : path;

    let current = undefined;
    let found = false;

    // Search scopes from top (most local) to bottom (most global)
    const scopes = this.scopes;
    const len = scopes.length;
    for (let i = 0; i < len; i++) {
      const scope = scopes[i];
      if (scope && typeof scope === 'object' && baseName in scope) {
        current = scope[baseName];
        found = true;
        break;
      }
    }

    if (!found) {
      return undefined;
    }

    if (hasDot) {
      const parts = path.split('.');
      for (let i = 1; i < parts.length; i++) {
        if (current === undefined || current === null) {
          return current === null ? null : undefined;
        }

        const parent = current;
        const part = parts[i];

        if (typeof current === 'object' && part in current) {
          current = current[part];
        } else if (Array.isArray(current) && !isNaN(part)) {
          current = current[parseInt(part, 10)];
        } else {
          return undefined;
        }

        if (typeof current === 'function') {
          current = current.call(parent);
        }
      }
    }

    if (typeof current === 'function') {
      current = current.call(null);
    }

    return current;
  }

  /**
   * Register a partial definition.
   */
  registerPartial(name, node) {
    this.partialDefs.set(name, node);
  }

  /**
   * Retrieve a registered partial.
   */
  getPartial(name) {
    return this.partialDefs.get(name);
  }

}

module.exports = {
  Context
};
