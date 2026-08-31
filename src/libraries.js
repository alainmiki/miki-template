/**
 * Plugin/filter library system.
 *
 * A "library" is a JavaScript object exporting:
 *   { tags?: { [name]: parserFn }, filters?: { [name]: filterFn } }
 *
 * Libraries can be:
 *  - Built-in (e.g. 'i18n', 'cache', 'humanize', 'markdown')
 *  - Custom user-defined via `registerLibrary(name, lib)`
 *  - Loaded from disk via `registerLibraryFromPath(name, path)`
 *
 * Once registered, a library is activated in templates via:
 *   {% load library_name %}
 *   {% load i18n cache humanize %}
 */
const fs = require('fs');
const path = require('path');

const libraries = new Map(); // Map<name, libraryDef>

/**
 * Register a library.
 *
 *   registerLibrary('markdown', {
 *     tags: { markdown: parseMarkdown },
 *     filters: { markdown: renderMarkdown }
 *   });
 */
function registerLibrary(name, def) {
  if (!name || typeof name !== 'string') {
    throw new TypeError('Library name must be a non-empty string');
  }
  if (!def || typeof def !== 'object') {
    throw new TypeError(`Library '${name}' definition must be an object`);
  }
  libraries.set(name, {
    tags: def.tags || {},
    filters: def.filters || {},
    helpers: def.helpers || {}
  });
}

/** Unregister a library or all libraries. */
function unregisterLibrary(name) {
  if (!name) {
    libraries.clear();
    return;
  }
  libraries.delete(name);
}

/** Get a registered library by name. */
function getLibrary(name) {
  return libraries.get(name);
}

/** List all registered library names. */
function getLibraryNames() {
  return Array.from(libraries.keys());
}

/**
 * Load a library from a JavaScript file on disk.
 * The file must be a CommonJS module exporting `{ tags, filters, helpers }`.
 */
function registerLibraryFromPath(name, filePath, options = {}) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(options.baseDir || process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Library file not found: ${absolutePath}`);
  }
  // Defensive: restrict to .js/.cjs/.mjs files
  const ext = path.extname(absolutePath).toLowerCase();
  if (ext !== '.js' && ext !== '.cjs' && ext !== '.mjs') {
    throw new Error(`Library file extension '${ext}' is not allowed`);
  }
  // Clear require cache if not pinned
  if (!options.pinned) {
    delete require.cache[require.resolve(absolutePath)];
  }
  const def = require(absolutePath);
  registerLibrary(name, def);
  return def;
}

/**
 * Apply the tags, filters, and helpers from a library to the runtime registries.
 */
function activateLibrary(name) {
  const lib = libraries.get(name);
  if (!lib) {
    throw new Error(`Library not found: '${name}'`);
  }
  const { registerTag, registerFilter, registerHelper } = require('./index');
  for (const [tagName, parserFn] of Object.entries(lib.tags || {})) {
    registerTag(tagName, parserFn);
  }
  for (const [filterName, filterFn] of Object.entries(lib.filters || {})) {
    registerFilter(filterName, filterFn);
  }
  for (const [helperName, helperFn] of Object.entries(lib.helpers || {})) {
    registerHelper(helperName, helperFn);
  }
}

/**
 * Check if a library is registered.
 */
function hasLibrary(name) {
  return libraries.has(name);
}

// --- Built-in libraries ---

/** Humanize: nice-looking text formatting filters. */
registerLibrary('humanize', {
  filters: {
    intcomma: (val) => {
      const parts = String(val === null || val === undefined ? '' : val).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    },
    intword: (val) => {
      const n = parseFloat(val);
      if (isNaN(n)) return String(val);
      const abs = Math.abs(n);
      if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' billion';
      if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' million';
      if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + ' thousand';
      return String(n);
    },
    apnumber: (val) => {
      const n = parseInt(val, 10);
      const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      if (!isNaN(n) && n >= 0 && n < words.length) return words[n];
      return String(val);
    },
    ordinal: (val) => {
      const n = parseInt(val, 10);
      if (isNaN(n)) return String(val);
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },
    naturalday: (val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
      if (sameDay(d, today)) return 'today';
      if (sameDay(d, yesterday)) return 'yesterday';
      if (sameDay(d, tomorrow)) return 'tomorrow';
      return String(val);
    }
  }
});

/** Cache: cache expensive template fragment results. */
registerLibrary('cache', {
  tags: {
    cache: (tagContent, parser) => {
      // {% cache timeout key1 key2 ... %}...{% endcache %}
      const rest = tagContent.slice(5).trim();
      const tokens = rest.split(/\s+/);
      const timeout = parseInt(tokens[0], 10) || 0;
      const key = tokens.slice(1).join(':') || 'default';
      const body = parser.parse(['endcache']);
      const next = parser.peek();
      if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endcache') {
        parser.advance();
      }
      return {
        render(context) {
          const ctx = context;
          const fullKey = `cache:${key}`;
          if (ctx.cacheStore && ctx.cacheStore.has(fullKey)) {
            const entry = ctx.cacheStore.get(fullKey);
            if (Date.now() - entry.time < timeout * 1000) {
              return entry.value;
            }
          }
          const value = body.map(n => n.render(context)).join('');
          if (ctx.cacheStore) {
            ctx.cacheStore.set(fullKey, { time: Date.now(), value });
          }
          return value;
        }
      };
    }
  }
});

/** Lorem: generate placeholder text. */
registerLibrary('lorem', {
  filters: {
    lorem: (val, arg) => {
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
      let n = parseInt(arg, 10);
      if (isNaN(n)) n = 5;
      if (n < 1) n = 1;
      if (n > 100) n = 100;
      const words = text.split(' ');
      let result = [];
      for (let i = 0; i < n; i++) {
        result.push(words[i % words.length]);
      }
      return result.join(' ');
    }
  }
});

/** Static: additional static-file helpers. */
registerLibrary('static', {
  filters: {
    static: (val) => {
      // Returns the value prefixed with the staticUrl (configured at compile time)
      return val; // Implementation lives in the {% static %} tag
    }
  }
});

module.exports = {
  registerLibrary,
  unregisterLibrary,
  getLibrary,
  getLibraryNames,
  hasLibrary,
  registerLibraryFromPath,
  activateLibrary,
  libraries
};
