// Filter registry and built‑in template filters.

const registry = {};

function registerFilter(name, fn) {
  registry[name] = fn;
}

function getFilter(name) {
  return registry[name];
}

function escapeValue(val) {
  const { escapeHtml, markSafe } = require('./security');
  // force=true ensures even SafeString values are re-escaped, matching
  // Django's `{{ value|escape }}` semantics.
  return markSafe(escapeHtml(val, true));
}

function markValueSafe(val) {
  const { markSafe } = require('./security');
  return markSafe(val);
}

// --- Text Filters ---
registerFilter('upper', (val) => {
  return String(val === null || val === undefined ? '' : val).toUpperCase();
});

registerFilter('lower', (val) => {
  return String(val === null || val === undefined ? '' : val).toLowerCase();
});

registerFilter('title', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
});

registerFilter('capfirst', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

registerFilter('truncatewords', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  const count = parseInt(arg, 10);
  if (isNaN(count) || count <= 0) return str;
  const words = str.split(/\s+/).filter(Boolean);
  if (words.length <= count) return str;
  return words.slice(0, count).join(' ') + ' ...';
});

registerFilter('truncatechars', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  const count = parseInt(arg, 10);
  if (isNaN(count) || count <= 0) return str;
  if (str.length <= count) return str;
  return str.slice(0, count - 3) + '...';
});

registerFilter('wordcount', (val) => {
  const str = String(val === null || val === undefined ? '' : val).trim();
  if (!str) return 0;
  return str.split(/\s+/).length;
});

registerFilter('linebreaks', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  if (!str) return '';
  const paragraphs = str.split(/\n{2,}/);
  const formatted = paragraphs
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return markValueSafe(formatted);
});

registerFilter('linebreaksbr', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  return markValueSafe(str.replace(/\n/g, '<br>'));
});

registerFilter('striptags', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  return str.replace(/<\/?[^>]+>/g, '');
});

registerFilter('slugify', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
});

registerFilter('length_is', (val, arg) => {
  const length = (val && typeof val.length === 'number') ? val.length : 0;
  const expected = parseInt(arg, 10);
  if (isNaN(expected)) return false;
  return length === expected;
});

// --- HTML Filters ---
registerFilter('safe', (val) => {
  return markValueSafe(val);
});

registerFilter('escape', (val) => {
  return escapeValue(val);
});

// --- List Filters ---
registerFilter('length', (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val.length === 'number') return val.length;
  if (val instanceof Set || val instanceof Map) return val.size;
  if (typeof val === 'object') return Object.keys(val).length;
  return 0;
});

registerFilter('join', (val, arg) => {
  if (!Array.isArray(val)) return val;
  const separator = arg === undefined ? '' : String(arg);
  return val.join(separator);
});

registerFilter('slice', (val, arg) => {
  if (!val || typeof val.slice !== 'function') return val;
  const parts = arg.split(':');
  if (parts.length === 1) {
    const idx = parseInt(parts[0], 10);
    return isNaN(idx) ? val : val.slice(idx, idx + 1);
  }
  const start = parts[0] === '' ? undefined : parseInt(parts[0], 10);
  const end = parts[1] === '' ? undefined : parseInt(parts[1], 10);
  return val.slice(start, end);
});

registerFilter('dictsort', (val, arg) => {
  if (!Array.isArray(val) || !arg) return val;
  return [...val].sort((a, b) => {
    const valA = a && typeof a === 'object' ? a[arg] : undefined;
    const valB = b && typeof b === 'object' ? b[arg] : undefined;
    if (valA === undefined && valB === undefined) return 0;
    if (valA === undefined) return 1;
    if (valB === undefined) return -1;
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  });
});

registerFilter('dictsortreversed', (val, arg) => {
  if (!Array.isArray(val) || !arg) return val;
  return [...val].sort((a, b) => {
    const valA = a && typeof a === 'object' ? a[arg] : undefined;
    const valB = b && typeof b === 'object' ? b[arg] : undefined;
    if (valA === undefined && valB === undefined) return 0;
    if (valA === undefined) return -1;
    if (valB === undefined) return 1;
    if (valA < valB) return 1;
    if (valA > valB) return -1;
    return 0;
  });
});

// --- Date/Time Filters ---
const { format: formatDate, parseISO } = require('date-fns');

registerFilter('date_format', (val, pattern) => {
  let date = val;
  if (typeof val === 'string') {
    date = parseISO(val);
  } else if (!(date instanceof Date)) {
    date = new Date(val);
  }
  if (isNaN(date.getTime())) return '';
  const fmt = pattern || 'yyyy-MM-dd\'T\'HH:mm:ssxxx';
  try {
    return formatDate(date, fmt);
  } catch {
    return '';
  }
});

registerFilter('strftime', (val, pattern) => {
  let date = val;
  if (typeof val === 'string') {
    date = parseISO(val);
  } else if (!(date instanceof Date)) {
    date = new Date(val);
  }
  if (isNaN(date.getTime())) return '';
  const fmt = pattern || 'PPpp';
  try {
    return formatDate(date, fmt);
  } catch {
    return '';
  }
});

registerFilter('date', (val, arg) => {
  let date = val;
  if (!(date instanceof Date)) {
    date = new Date(val);
  }
  if (isNaN(date.getTime())) return '';
  const formatStr = arg || 'Y-m-d';
  const mapper = {
    d: () => String(date.getDate()).padStart(2, '0'),
    j: () => String(date.getDate()),
    m: () => String(date.getMonth() + 1).padStart(2, '0'),
    n: () => String(date.getMonth() + 1),
    Y: () => String(date.getFullYear()),
    y: () => String(date.getFullYear()).slice(-2),
    H: () => String(date.getHours()).padStart(2, '0'),
    i: () => String(date.getMinutes()).padStart(2, '0'),
    s: () => String(date.getSeconds()).padStart(2, '0'),
    F: () => date.toLocaleString('default', { month: 'long' }),
    M: () => date.toLocaleString('default', { month: 'short' })
  };
  let output = '';
  for (let i = 0; i < formatStr.length; i++) {
    const ch = formatStr[i];
    output += ch in mapper ? mapper[ch]() : ch;
  }
  return output;
});

registerFilter('time', (val, arg) => {
  let date = val;
  if (!(date instanceof Date)) {
    date = new Date(val);
  }
  if (isNaN(date.getTime())) return '';
  const formatStr = arg || 'H:i';
  return getFilter('date')(date, formatStr);
});

registerFilter('timesince', (val, arg) => {
  const d1 = new Date(val);
  const d2 = arg ? new Date(arg) : new Date();
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
  const diffMs = Math.max(0, d2 - d1);
  const seconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(seconds / 60);
  if (diffMins < 1) return '0 minutes';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
});

registerFilter('timeuntil', (val, arg) => {
  const d1 = new Date(val);
  const d2 = arg ? new Date(arg) : new Date();
  const diffMs = Math.max(0, d1.getTime() - d2.getTime());
  if (diffMs <= 0) return '0 minutes';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
});

// --- Numeric Filters ---
registerFilter('add', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (!isNaN(numVal) && !isNaN(numArg)) {
    return numVal + numArg;
  }
  if (Array.isArray(val) && Array.isArray(arg)) {
    return val.concat(arg);
  }
  return String(val) + String(arg);
});

registerFilter('divisibleby', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (isNaN(numVal) || isNaN(numArg) || numArg === 0) return false;
  return numVal % numArg === 0;
});

registerFilter('floatformat', (val, arg) => {
  const num = Number(val);
  if (isNaN(num)) return '';
  if (arg === undefined || arg === null) {
    return num.toFixed(1);
  }
  const decimals = parseInt(arg, 10);
  if (isNaN(decimals)) return '';
  if (decimals === -1) {
    return num.toFixed(0);
  }
  return num.toFixed(Math.max(0, decimals));
});

// --- Default Filters ---
// When the fallback contains template syntax ({% ... %} or {{ ... }}),
// it is rendered against the current context. This matches Django's
// behavior where `{{ x|default:"{% lorem 1 %}" }}` produces lorem text
// when x is empty.
registerFilter('default', (val, arg, ctx) => {
  if (val !== null && val !== undefined && val !== '') return val;
  return renderFallbackTemplate(arg, ctx);
});

registerFilter('default_if_none', (val, arg, ctx) => {
  if (val !== null && val !== undefined) return val;
  return renderFallbackTemplate(arg, ctx);
});

/**
 * If `arg` looks like a mini-template (contains `{% ... %}` or
 * `{{ ... }}`), compile and render it. Otherwise return it as-is.
 */
function renderFallbackTemplate(arg, ctx) {
  if (typeof arg !== 'string') return arg;
  if (!/\{[{%]/.test(arg)) return arg;
  try {
    // Lazy require to avoid circular dependency with index.js
    const { render } = require('./index');
    // Merge all active scopes (top-most wins) into a plain object
    let merged = {};
    if (ctx && Array.isArray(ctx.scopes)) {
      // scopes[0] is the topmost (most local). Iterate from bottom
      // (root) to top so topmost values win.
      for (let i = ctx.scopes.length - 1; i >= 0; i--) {
        const s = ctx.scopes[i];
        if (s && typeof s === 'object' && !s.__forloop && !s.__block) {
          Object.assign(merged, s);
        }
      }
    }
    return render(arg, merged);
  } catch {
    return arg;
  }
}

registerFilter('firstof', (...args) => {
  for (const arg of args) {
    if (arg !== null && arg !== undefined && arg !== '') {
      return arg;
    }
  }
  return '';
});

// --- Misc Filters ---
registerFilter('pluralize', (val, arg) => {
  const suffixes = (arg || 's').split(',');
  let count = val;
  if (Array.isArray(val) || (val && typeof val === 'object' && 'length' in val)) {
    count = val.length;
  } else if (!isNaN(Number(val))) {
    count = Number(val);
  } else {
    count = 1;
  }
  if (suffixes.length === 1) {
    return count === 1 ? '' : suffixes[0];
  }
  return count === 1 ? suffixes[0] : suffixes[1];
});

registerFilter('yesno', (val, arg) => {
  const mappings = (arg || 'yes,no,maybe').split(',');
  const yes = mappings[0] || 'yes';
  const no = mappings[1] || 'no';
  const maybe = mappings[2] || 'maybe';
  if (val === null || val === undefined) return maybe;
  return val ? yes : no;
});

registerFilter('filesizeformat', (val) => {
  const bytes = Number(val);
  if (isNaN(bytes) || bytes < 0) return '0 bytes';
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const num = bytes / Math.pow(k, i);
  return `${num.toFixed(num % 1 === 0 ? 0 : 1)} ${sizes[i]}`;
});

registerFilter('urlencode', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  if (arg === undefined || arg === null || arg === '') {
    return encodeURIComponent(str).replace(/%20/g, '+');
  }
  if (arg === 'utf-8' || arg === 'utf8') {
    return encodeURIComponent(str);
  }
  if (arg === 'query' || arg === 'raw') {
    return encodeURIComponent(str).replace(/%20/g, '+');
  }
  if (arg === 'path') {
    return str.split('/').map(seg => encodeURIComponent(seg)).join('/');
  }
  return encodeURIComponent(str);
});

registerFilter('escapeuri', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  return encodeURI(str);
});

registerFilter('stringformat', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  const fmt = String(arg === null || arg === undefined ? '%s' : arg);
  let result = '';
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] === '%') {
      // Try to match a full format specifier with optional width/precision
      const numMatch = fmt.slice(i).match(/^%(?:\d+)?(?:\.\d+)?([sdifFeExXo%])/);
      if (numMatch) {
        const spec = numMatch[1];
        if (spec === 's') {
          result += str;
        } else if (spec === 'd' || spec === 'i') {
          result += String(parseInt(str, 10));
        } else if (spec === 'f' || spec === 'F') {
          const precMatch = numMatch[0].match(/\.(\d+)/);
          const precision = precMatch ? parseInt(precMatch[1], 10) : 6;
          const widthMatch = numMatch[0].match(/%(\d+)/);
          const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
          const num = parseFloat(str);
          let formatted = num.toFixed(precision);
          if (width && formatted.length < width) {
            formatted = ' '.repeat(width - formatted.length) + formatted;
          }
          if (spec === 'F') formatted = formatted.toUpperCase();
          result += formatted;
        } else if (spec === 'e') {
          result += parseFloat(str).toExponential();
        } else if (spec === 'E') {
          result += parseFloat(str).toExponential().toUpperCase();
        } else if (spec === 'x') {
          result += parseInt(str, 10).toString(16);
        } else if (spec === 'X') {
          result += parseInt(str, 10).toString(16).toUpperCase();
        } else if (spec === 'o') {
          result += parseInt(str, 10).toString(8);
        } else if (spec === '%') {
          result += '%';
        }
        i += numMatch[0].length;
      } else {
        result += fmt[i];
        i++;
      }
    } else {
      result += fmt[i];
      i++;
    }
  }
  return result;
});

registerFilter('cut', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  if (arg === undefined || arg === null) return str;
  return str.split(String(arg)).join('');
});

registerFilter('addslashes', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  return str.replace(/['"\\]/g, c => '\\' + c);
});

registerFilter('removetags', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  if (!arg) return str;
  // Django's removetags accepts space-separated tag names (and tolerates commas).
  const tags = String(arg).split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
  let result = str;
  for (const tag of tags) {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`<\\/${escaped}>`, 'gi'), '');
    result = result.replace(new RegExp(`<${escaped}\\b[^>]*>`, 'gi'), '');
    result = result.replace(new RegExp(`<${escaped}>`, 'gi'), '');
  }
  // The result is intentionally safe (we just produced raw HTML by
  // removing tags) and must not be re-escaped.
  const { markSafe } = require('./security');
  return markSafe(result);
});

/**
 * `trans` filter — translates a string using the i18n registry.
 * Requires the optional i18n module to have translations registered.
 * Falls back to the original value if no translation is found.
 *
 *   {{ "Hello, world!"|trans }}
 *   {{ greeting|trans:"Hello, %s!" }}
 */
registerFilter('trans', (val, arg) => {
  const i18n = require('./i18n');
  const key = arg && arg.length > 0 ? arg : String(val);
  const isSafeValue = val && val.constructor && val.constructor.name === 'SafeString';
  const result = i18n.lookup(key);
  if (isSafeValue) {
    const { markSafe } = require('./security');
    return markSafe(String(result));
  }
  return String(result);
});

/**
 * `regroup` filter — groups a list of objects by a common attribute.
 * Returns an array of { grouper, list } objects suitable for iteration.
 *
 *   {% for group in items|regroup:"category" %}
 *     <h3>{{ group.grouper }}</h3>
 *     {% for item in group.list %}
 *       <p>{{ item.name }}</p>
 *     {% endfor %}
 *   {% endfor %}
 */
registerFilter('regroup', (val, arg) => {
  if (!Array.isArray(val)) return [];
  const key = String(arg || '');
  const groups = new Map();
  for (const item of val) {
    const grouper = item && typeof item === 'object' ? (item[key] !== undefined ? item[key] : null) : null;
    const grouperKey = grouper === null ? '__null__' : String(grouper);
    if (!groups.has(grouperKey)) {
      groups.set(grouperKey, { grouper, list: [] });
    }
    groups.get(grouperKey).list.push(item);
  }
  return Array.from(groups.values());
});

/**
 * `strftime` filter — formats a Date using `date-fns` format strings.
 * Supports all `date-fns` format tokens (pp, yyyy, MM, dd, HH, mm, ss, etc.)
 *
 *   {{ now|strftime:"PPpp" }}  → "Aug 31, 2026 at 10:24 PM"
 *   {{ now|strftime:"yyyy-MM-dd" }}  → "2026-08-31"
 *   {{ now|strftime:"HH:mm:ss" }}    → "22:24:56"
 */
registerFilter('strftime', (val, arg) => {
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const fmt = String(arg === null || arg === undefined ? 'yyyy-MM-dd' : arg);
  try {
    const { format } = require('date-fns');
    return format(d, fmt);
  } catch {
    // If date-fns is not available or format is invalid, fallback
    return d.toISOString();
  }
});

module.exports = { registerFilter, getFilter };

