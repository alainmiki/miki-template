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
  // Multi-character tokens are matched longest-first so that "yyyy" is
  // one token and not four "y" tokens. Conventions:
  //   yyyy  4-digit year          yy  2-digit year
  //   MM    padded month number   M   month number (no pad)
  //   mm    padded minutes        m   month number (Django-style alias)
  //   dd    padded day            d   day number (no pad)
  //   HH    padded 24h hour       H   hour (no pad)
  //   ii    padded minutes        i   minutes (no pad)
  //   ss    padded seconds        s   seconds (no pad)
  //   F     long month name       D   short day name
  const tokenMap = [
    ['yyyy', () => String(date.getFullYear()).padStart(4, '0')],
    ['yy',   () => String(date.getFullYear()).slice(-2).padStart(2, '0')],
    ['MM',   () => String(date.getMonth() + 1).padStart(2, '0')],
    ['dd',   () => String(date.getDate()).padStart(2, '0')],
    ['HH',   () => String(date.getHours()).padStart(2, '0')],
    ['mm',   () => String(date.getMinutes()).padStart(2, '0')],
    ['ii',   () => String(date.getMinutes()).padStart(2, '0')],
    ['ss',   () => String(date.getSeconds()).padStart(2, '0')],
    ['F',    () => date.toLocaleString('default', { month: 'long' })],
    ['D',    () => date.toLocaleString('default', { weekday: 'short' })],
    ['M',    () => String(date.getMonth() + 1)],
    ['Y',    () => String(date.getFullYear())],
    ['y',    () => String(date.getFullYear()).slice(-2)],
    ['m',    () => String(date.getMonth() + 1)],
    ['d',    () => String(date.getDate())],
    ['j',    () => String(date.getDate())],
    ['n',    () => String(date.getMonth() + 1)],
    ['H',    () => String(date.getHours())],
    ['i',    () => String(date.getMinutes())],
    ['s',    () => String(date.getSeconds())],
    ['G',    () => String(date.getHours())],
  ];
  let output = '';
  let i = 0;
  while (i < formatStr.length) {
    let matched = false;
    for (const [tok, fn] of tokenMap) {
      if (formatStr.startsWith(tok, i)) {
        output += fn();
        i += tok.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      output += formatStr[i];
      i++;
    }
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

registerFilter('sub', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (!isNaN(numVal) && !isNaN(numArg)) {
    return numVal - numArg;
  }
  return String(val);
});

registerFilter('mult', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (!isNaN(numVal) && !isNaN(numArg)) {
    return numVal * numArg;
  }
  return String(val);
});

registerFilter('divisibleby', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (isNaN(numVal) || isNaN(numArg) || numArg === 0) return false;
  return numVal % numArg === 0;
});

registerFilter('mod', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (isNaN(numVal) || isNaN(numArg) || numArg === 0) return 0;
  return numVal % numArg;
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

registerFilter('square', (val) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return num * num;
});

registerFilter('sqrt', (val) => {
  const num = Number(val);
  if (isNaN(num) || num < 0) return 0;
  return Math.sqrt(num);
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

// --- Math Filters ---
registerFilter('sub', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (!isNaN(numVal) && !isNaN(numArg)) {
    return numVal - numArg;
  }
  return String(val);
});

registerFilter('mult', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (!isNaN(numVal) && !isNaN(numArg)) {
    return numVal * numArg;
  }
  return String(val);
});

registerFilter('square', (val) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return num * num;
});

registerFilter('sqrt', (val) => {
  const num = Number(val);
  if (isNaN(num) || num < 0) return 0;
  return Math.sqrt(num);
});

registerFilter('mod', (val, arg) => {
  const numVal = Number(val);
  const numArg = Number(arg);
  if (isNaN(numVal) || isNaN(numArg) || numArg === 0) return 0;
  return numVal % numArg;
});

// --- Data Formatting Filters ---
registerFilter('currency', (val, arg) => {
  const num = Number(val);
  if (isNaN(num)) return '';
  const symbol = arg || '$';
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return symbol + formatted;
});

registerFilter('phone_number', (val) => {
  const str = String(val === null || val === undefined ? '' : val).replace(/\D/g, '');
  if (str.length === 10) {
    return `(${str.slice(0, 3)}) ${str.slice(3, 6)}-${str.slice(6)}`;
  }
  if (str.length === 11 && str.startsWith('1')) {
    return `+1 (${str.slice(1, 4)}) ${str.slice(4, 7)}-${str.slice(7)}`;
  }
  return String(val);
});

registerFilter('email', (val) => {
  const str = String(val === null || val === undefined ? '' : val).trim();
  if (!str) return '';
  return `mailto:${str}`;
});

registerFilter('url', (val) => {
  let str = String(val === null || val === undefined ? '' : val).trim();
  if (!str) return '';
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }
  return str;
});

registerFilter('mask', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  const char = arg || '*';
  const visible = 4;
  if (str.length <= visible) return str;
  return char.repeat(str.length - visible) + str.slice(-visible);
});

registerFilter('whatsapp_link', (val, arg) => {
  let str = String(val === null || val === undefined ? '' : val).trim();
  if (!str) return '';
  const digits = str.replace(/\D/g, '');
  const message = arg || '';
  const url = new URL('https://wa.me/' + digits);
  if (message) {
    url.searchParams.set('text', message);
  }
  return url.toString();
});

// --- Math Filters ---
registerFilter('abs', (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : Math.abs(num);
});

registerFilter('round', (val, arg) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  const decimals = arg !== undefined ? parseInt(arg, 10) : 0;
  if (isNaN(decimals)) return Math.round(num);
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
});

registerFilter('floor', (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : Math.floor(num);
});

registerFilter('ceil', (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : Math.ceil(num);
});

registerFilter('min', (val, arg) => {
  if (Array.isArray(val)) return Math.min(...val);
  const num = Number(val);
  const numArg = Number(arg);
  if (!isNaN(num) && !isNaN(numArg)) return Math.min(num, numArg);
  return num;
});

registerFilter('max', (val, arg) => {
  if (Array.isArray(val)) return Math.max(...val);
  const num = Number(val);
  const numArg = Number(arg);
  if (!isNaN(num) && !isNaN(numArg)) return Math.max(num, numArg);
  return num;
});

registerFilter('sum', (val) => {
  if (!Array.isArray(val)) return Number(val) || 0;
  return val.reduce((acc, item) => acc + (Number(item) || 0), 0);
});

registerFilter('average', (val) => {
  if (!Array.isArray(val)) return Number(val) || 0;
  if (val.length === 0) return 0;
  return val.reduce((acc, item) => acc + (Number(item) || 0), 0) / val.length;
});

// --- String / Array Manipulation Filters ---
registerFilter('reverse', (val) => {
  if (Array.isArray(val)) return val.slice().reverse();
  const str = String(val === null || val === undefined ? '' : val);
  return str.split('').reverse().join('');
});

registerFilter('sort', (val) => {
  if (!Array.isArray(val)) return val;
  return [...val].sort((a, b) => {
    if (a === b) return 0;
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
    return a < b ? -1 : 1;
  });
});

registerFilter('unique', (val) => {
  if (!Array.isArray(val)) return val;
  return [...new Set(val)];
});

registerFilter('random', (val) => {
  if (!Array.isArray(val) || val.length === 0) return '';
  return val[Math.floor(Math.random() * val.length)];
});

registerFilter('split', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  const sep = arg || ' ';
  return str.split(sep);
});

registerFilter('replace', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  if (!arg) return str;
  const parts = String(arg).split(',');
  if (parts.length >= 2) {
    const oldStr = parts[0].trim();
    const newStr = parts.slice(1).join(',').trim();
    return str.split(oldStr).join(newStr);
  }
  return str;
});

// --- Encoding Filters ---
registerFilter('base64_encode', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  return Buffer.from(str).toString('base64');
});

registerFilter('base64_decode', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    const reEncoded = Buffer.from(decoded).toString('base64');
    if (reEncoded.replace(/=+$/, '') === str.replace(/=+$/, '')) {
      return decoded;
    }
    return String(val);
  } catch {
    return String(val);
  }
});

// --- Text Formatting Filters ---
registerFilter('urlize', (val) => {
  const str = String(val === null || val === undefined ? '' : val);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return str.replace(urlRegex, '<a href="$1">$1</a>');
});

registerFilter('json', (val) => {
  const { markSafe } = require('./security');
  try {
    return markSafe(JSON.stringify(val));
  } catch {
    return String(val);
  }
});

registerFilter('truncatechars_html', (val, arg) => {
  const str = String(val === null || val === undefined ? '' : val);
  const count = parseInt(arg, 10);
  if (isNaN(count) || count <= 0) return str;
  const { markSafe } = require('./security');
  if (str.length <= count) return markSafe(str);
  let currentLen = 0;
  let result = '';
  let inTag = false;
  for (let i = 0; i < str.length && currentLen < count; i++) {
    const ch = str[i];
    if (ch === '<') inTag = true;
    if (inTag) {
      result += ch;
      if (ch === '>') inTag = false;
      continue;
    }
    currentLen++;
    result += ch;
  }
  if (!inTag && currentLen >= count) {
    result += '...';
  }
  return markSafe(result);
});

// --- Time Filters ---
registerFilter('time_diff', (val, arg) => {
  const d1 = new Date(val);
  const d2 = arg ? new Date(arg) : new Date();
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
  const diffMs = Math.max(0, Math.abs(d2 - d1));
  const seconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(seconds / 60);
  if (diffMins < 1) return '0 minutes';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
});

registerFilter('ago', (val) => {
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = Math.max(0, now - d);
  const seconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(seconds / 60);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
});

registerFilter('until', (val) => {
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = Math.max(0, d - now);
  const seconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(seconds / 60);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
});

// --- Data Formatting Filters ---
registerFilter('credit_card', (val) => {
  const str = String(val === null || val === undefined ? '' : val).replace(/\D/g, '');
  if (str.length < 13 || str.length > 19) return String(val);
  const parts = [];
  for (let i = 0; i < str.length; i += 4) {
    parts.push(str.slice(i, i + 4));
  }
  return parts.join('-');
});

registerFilter('ssn', (val) => {
  const str = String(val === null || val === undefined ? '' : val).replace(/\D/g, '');
  if (str.length !== 9) return String(val);
  return `${str.slice(0, 3)}-${str.slice(3, 5)}-${str.slice(5)}`;
});

registerFilter('ip_address', (val) => {
  const str = String(val === null || val === undefined ? '' : val).replace(/\D/g, '');
  if (str.length !== 10 && str.length !== 12) return String(val);
  if (str.length === 12) {
    return `${str.slice(0, 4)}.${str.slice(4, 8)}.${str.slice(8, 10)}.${str.slice(10)}`;
  }
  return `${str.slice(0, 3)}.${str.slice(3, 6)}.${str.slice(6, 9)}.${str.slice(9)}`;
});

registerFilter('uuid', () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
});

module.exports = { registerFilter, getFilter };

