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

    const parts = path.split('.');
    const baseName = parts[0];

    let current = null;
    let found = false;

    // Search scopes from top (most local) to bottom (most global)
    for (const scope of this.scopes) {
      if (scope && typeof scope === 'object' && baseName in scope) {
        current = scope[baseName];
        found = true;
        break;
      }
    }

    if (!found) {
      return '';
    }

    // Traverse the rest of the dotted segments
    for (let i = 1; i < parts.length; i++) {
      if (current === undefined || current === null) {
        return '';
      }

      const parent = current;
      const part = parts[i];

      // Resolve segment on the current value
      if (typeof current === 'object' && part in current) {
        current = current[part];
      } else if (Array.isArray(current) && !isNaN(part)) {
        // Handle array index resolution, e.g. items.0
        current = current[parseInt(part, 10)];
      } else {
        return '';
      }

      // If the property value is a function, evaluate it (Django style)
      if (typeof current === 'function') {
        current = current.call(parent);
      }
    }

    // If the final resolved value is a function, call it with no arguments
    if (typeof current === 'function') {
      current = current.call(null);
    }

    return current !== undefined && current !== null ? current : '';
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
