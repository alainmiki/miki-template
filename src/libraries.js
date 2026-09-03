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

// Registration functions are injected by index.js to break the
// circular dependency between libraries.js and index.js.
let registrationFunctions = null;
function setRegistrationFunctions(fns) {
  registrationFunctions = fns;
}

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
  // Require lazily; index.js will pass the real registration
  // functions via setRegistrationFunctions() before calling us.
  const { registerTag, registerFilter, registerHelper } = registrationFunctions || require('./index');
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

/** Lorem: generate placeholder text (Django-compatible). */
registerLibrary('lorem', {
  filters: {
    lorem: (val, arg) => {
      let n = parseInt(arg, 10);
      if (isNaN(n)) n = 5;
      if (n < 1) n = 1;
      if (n > 100) n = 100;
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
      const words = text.split(' ');
      let result = [];
      for (let i = 0; i < n; i++) {
        result.push(words[i % words.length]);
      }
      return result.join(' ');
    }
  },
  tags: {
    // Django-compatible lorem tag.
    //
    //   {% lorem [count] [method] [random] %}
    //
    //   count   - number of words/paragraphs to generate (default 1)
    //   method  - w (words), p (HTML paragraphs), b (plain-text blocks, default)
    //   random  - skip the common "Lorem ipsum dolor sit amet..." opening
    //
    //   {% lorem %}             -> one block of common Lorem ipsum
    //   {% lorem 3 p %}         -> common paragraph + 2 random <p> blocks
    //   {% lorem 2 w random %}  -> 2 random words
    //
    // The tag is built into the engine and requires no {% load lorem %}.
    lorem: (tagContent, _parser) => {
      return {
        render: () => {
          // The tag registry calls the parser with the full content
          // including the tag name. For "{% lorem 3 p random %}" the
          // tagContent is "lorem 3 p random".
          const parts = tagContent.trim().split(/\s+/);

          // count = first numeric token (or 1 if none)
          let n = 1;
          for (let i = 0; i < parts.length; i++) {
            const num = parseInt(parts[i], 10);
            if (!isNaN(num) && String(num) === parts[i]) { n = Math.max(1, num); break; }
          }
          // method = w | b | p (default b, like Django)
          let unit = 'b';
          for (let i = 0; i < parts.length; i++) {
            if (/^(w|b|p|words?|blocks?|paragraphs?)$/i.test(parts[i])) {
              unit = parts[i][0].toLowerCase();
              break;
            }
          }
          // random = presence of the literal word "random"
          const random = parts.some(t => t.toLowerCase() === 'random');

          // The famous "common paragraph" Django uses as the seed.
          const COMMON = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
          // Word bank used to assemble random text when the "random"
          // keyword is given. Picked from the same Latin vocabulary.
          const WORDS = ('lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');

          // The non-random blocks cycle through a fixed set of
          // sentences taken from the COMMON paragraph above (the
          // first one is the "Lorem ipsum dolor sit amet" line).
          const SENTENCES = [
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
            'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            'Ut enim ad minim veniam, quis nostrud exercitation.',
            'Duis aute irure dolor in reprehenderit in voluptate velit.',
            'Excepteur sint occaecat cupidatat non proident.'
          ];

          if (unit === 'w') {
            // Words
            if (random) {
              const out = [];
              for (let i = 0; i < n; i++) {
                out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
              }
              return out.join(' ');
            }
            // Non-random: first word is always "lorem", the rest
            // continue the common paragraph.
            const commonWords = COMMON.replace(/[.,]/g, '').split(/\s+/);
            const out = [];
            for (let i = 0; i < n; i++) {
              out.push(commonWords[i % commonWords.length]);
            }
            return out.join(' ');
          }

          if (unit === 'p') {
            // HTML paragraphs (each wrapped in <p>...</p>)
            const out = [];
            for (let i = 0; i < n; i++) {
              let paragraph;
              if (i === 0 && !random) {
                paragraph = COMMON;
              } else if (random) {
                // Generate a sentence worth of random words
                const len = 12 + Math.floor(Math.random() * 16);
                const words = [];
                for (let j = 0; j < len; j++) {
                  words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
                }
                paragraph = words.join(' ') + '.';
              } else {
                paragraph = SENTENCES[(i - 1) % (SENTENCES.length - 1) + 1];
              }
              out.push('<p>' + paragraph + '</p>');
            }
            return out.join('\n');
          }

          // unit === 'b' (default): plain-text blocks separated by blank lines
          const out = [];
          for (let i = 0; i < n; i++) {
            let paragraph;
            if (i === 0 && !random) {
              paragraph = COMMON;
            } else if (random) {
              const len = 30 + Math.floor(Math.random() * 20);
              const words = [];
              for (let j = 0; j < len; j++) {
                words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
              }
              paragraph = words.join(' ') + '.';
            } else {
              paragraph = SENTENCES[(i - 1) % (SENTENCES.length - 1) + 1];
            }
            out.push(paragraph);
          }
          return out.join('\n\n');
        }
      };
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
  setRegistrationFunctions,
  libraries
};
