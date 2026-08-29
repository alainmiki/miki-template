/**
 * Security and HTML auto-escaping mechanisms.
 */
const he = require('he');

class SafeString {
  constructor(value) {
    this.value = value === null || value === undefined ? '' : String(value);
  }

  toString() {
    return this.value;
  }
}

/**
 * Mark a string as safe so it is not auto-escaped during rendering.
 */
function markSafe(value) {
  if (value instanceof SafeString) {
    return value;
  }
  return new SafeString(value);
}

/**
 * Check if a value is marked safe.
 */
function isSafe(value) {
  return value instanceof SafeString;
}

/**
 * Escape a string's HTML special characters unless it is marked safe.
 */
function escapeHtml(value) {
  if (value instanceof SafeString) {
    return value.toString();
  }

  const str = value === null || value === undefined ? '' : String(value);
  // We use he.escape to convert <, >, &, ", ', etc. to entities
  return he.escape(str);
}

module.exports = {
  SafeString,
  markSafe,
  isSafe,
  escapeHtml
};
