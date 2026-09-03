/**
 * Utility template tags: static, url, regroup, spaceless.
 */

// Helper to resolve expression values (literals, numbers, booleans, or context lookups)
function resolveValue(token, context) {
  if (token === undefined || token === null) return '';
  if (typeof token !== 'string') return token;
  if (token === '') return '';
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith('\'') && token.endsWith('\''))) {
    return token.slice(1, -1);
  }
  if (token === 'true' || token === 'True') return true;
  if (token === 'false' || token === 'False') return false;
  if (token === 'none' || token === 'None' || token === 'null') return null;
  // Numeric literal (integer or float)
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  // Otherwise treat as a context variable lookup
  return context.get(token);
}

class StaticNode {
  constructor(pathExpr) {
    this.pathExpr = pathExpr;
  }

  render(context) {
    const resolvedPath = resolveValue(this.pathExpr, context);

    // Resolve static prefix
    let prefix = '/static/';
    if (context.options && context.options.staticUrl) {
      prefix = context.options.staticUrl;
    } else if (context.options && context.options.settings && context.options.settings.staticUrl) {
      prefix = context.options.settings.staticUrl;
    }

    // Ensure double-slash doesn't occur and ends/starts correctly
    const base = prefix.endsWith('/') ? prefix : prefix + '/';
    const relative = (typeof resolvedPath === 'string' && resolvedPath.startsWith('/'))
      ? resolvedPath.slice(1)
      : String(resolvedPath);

    return base + relative;
  }
}

class UrlNode {
  constructor(routeNameExpr, positionalArgs, kwargs) {
    this.routeNameExpr = routeNameExpr;
    this.positionalArgs = positionalArgs || [];
    // Each kwarg is { name, valueExpr } where valueExpr is the raw
    // expression token (may be a number, a quoted string, or a var).
    this.kwargs = kwargs || [];
  }

  render(context) {
    const routeName = resolveValue(this.routeNameExpr, context);
    const resolvedPositional = this.positionalArgs.map(arg => resolveValue(arg, context));
    const resolvedKwargs = {};
    for (const kw of this.kwargs) {
      resolvedKwargs[kw.name] = resolveValue(kw.valueExpr, context);
    }
    const hasKwargs = Object.keys(resolvedKwargs).length > 0;

    // If an Express urlHelper is provided, call it. We pass positional
    // args spread, and (only when kwargs are present) a kwargs object
    // as the last argument. This keeps the common `{{ url 'r' 42 }}`
    // case with a `(name, ...args) => string` helper simple.
    if (context.options && typeof context.options.urlHelper === 'function') {
      if (hasKwargs) {
        return context.options.urlHelper(routeName, ...resolvedPositional, resolvedKwargs);
      }
      return context.options.urlHelper(routeName, ...resolvedPositional);
    }

    // Fallback URL builder: convert dotted route names into deep paths
    // (e.g. "user.profile.posts.show" -> "/user/profile/posts/show")
    // and append positional args. Kwargs are appended as query string.
    const deepPath = String(routeName).split('.').map(seg => seg).join('/');
    const parts = ['/' + deepPath, ...resolvedPositional
      .filter(v => v !== '' && v !== null && v !== undefined)
      .map(v => String(v))];
    let url = parts.join('/');
    if (hasKwargs) {
      const qs = Object.keys(resolvedKwargs)
        .filter(k => resolvedKwargs[k] !== undefined)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(resolvedKwargs[k]))}`)
        .join('&');
      if (qs) url += '?' + qs;
    }
    return url;
  }
}

class RegroupNode {
  constructor(listPath, attr, targetName) {
    this.listPath = listPath;
    this.attr = attr;
    this.targetName = targetName;
  }

  render(context) {
    const list = context.get(this.listPath);
    if (!Array.isArray(list)) {
      context.scopes[0][this.targetName] = [];
      return '';
    }

    const groups = [];
    const groupMap = new Map();

    for (const item of list) {
      // Resolve attribute (support nested lookup on item)
      let val = '';
      if (item && typeof item === 'object') {
        const parts = this.attr.split('.');
        let current = item;
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            current = undefined;
            break;
          }
        }
        val = current !== undefined ? current : '';
      }

      if (!groupMap.has(val)) {
        const newGroup = { grouper: val, list: [] };
        groupMap.set(val, newGroup);
        groups.push(newGroup);
      }
      groupMap.get(val).list.push(item);
    }

    // Store in the current context scope
    context.scopes[0][this.targetName] = groups;
    return '';
  }
}

class SpacelessNode {
  constructor(body) {
    this.body = body;
  }

  render(context) {
    const content = this.body.map(n => n.render(context)).join('');
    // Remove space between HTML tags
    return content.replace(/>\s+</g, '><');
  }
}

class CsrfTokenNode {
  render(context) {
    const token = context.get('csrf_token') || '';
    // Escape the token for safe interpolation into an HTML attribute.
    // CSRF tokens are typically alphanumeric, but defending against
    // malicious or malformed token values is required to prevent
    // attribute injection (" onerror=... etc).
    const { escapeHtml, markSafe } = require('../security');
    return markSafe(
      `<input type="hidden" name="csrfmiddlewaretoken" value="${escapeHtml(String(token), true)}">`
    );
  }
}

class CspNonceAttrNode {
  render(context) {
    const nonce = context.get('csp_nonce') || '';
    if (!nonce) return '';
    // Escape the nonce for safe interpolation into an attribute value.
    const { escapeHtml, markSafe } = require('../security');
    return markSafe(`nonce="${escapeHtml(String(nonce), true)}"`);
  }
}

// --- Tag Registry Parsers ---

function parseStatic(tagContent, _parser) {
  // tagContent: "static 'css/style.css'"
  const pathExpr = tagContent.slice(6).trim();
  return new StaticNode(pathExpr);
}

function parseUrl(tagContent, _parser) {
  // tagContent examples:
  //   "url 'route_name' arg1 arg2"
  //   "url 'route.name' 34"
  //   "url 'user.show' 34 email phone"
  //   "url 'user.show' userId=34 tab='posts'"
  //   "url 'user.show' 34 tab='posts'"
  const content = tagContent.slice(3).trim();

  // Tokenize respecting quoted strings.
  const argRegex = /(".*?"|'.*?'|[^\s]+)/g;
  const matches = content.match(argRegex) || [];

  if (matches.length === 0) {
    throw new Error('url tag requires a route name');
  }
  const routeNameExpr = matches[0];
  const positionalArgs = [];
  const kwargs = [];

  for (let i = 1; i < matches.length; i++) {
    const tok = matches[i];
    // Detect `key=value` pattern (not a quoted string)
    const isQuoted = (tok.startsWith('"') && tok.endsWith('"')) ||
                      (tok.startsWith('\'') && tok.endsWith('\''));
    if (!isQuoted) {
      const eq = tok.indexOf('=');
      if (eq > 0) {
        const name = tok.slice(0, eq);
        const valueExpr = tok.slice(eq + 1);
        kwargs.push({ name, valueExpr });
        continue;
      }
    }
    positionalArgs.push(tok);
  }

  return new UrlNode(routeNameExpr, positionalArgs, kwargs);
}

function parseRegroup(tagContent, _parser) {
  // tagContent: "regroup people by gender as grouped"
  const match = tagContent.match(/^regroup\s+(.+?)\s+by\s+(.+?)\s+as\s+(.+)$/);
  if (!match) {
    throw new Error(`Invalid regroup tag format: '${tagContent}'`);
  }

  const listPath = match[1].trim();
  const attr = match[2].trim();
  const targetName = match[3].trim();

  return new RegroupNode(listPath, attr, targetName);
}

function parseSpaceless(tagContent, parser) {
  const body = parser.parse(['endspaceless']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endspaceless') {
    parser.advance();
  }
  return new SpacelessNode(body);
}

function parseCsrfToken(_tagContent, _parser) {
  return new CsrfTokenNode();
}

class WidthRatioNode {
  constructor(value, maxValue, maxWidth) {
    this.value = parseFloat(value);
    this.maxValue = parseFloat(maxValue);
    this.maxWidth = parseInt(maxWidth, 10);
  }

  render(_context) {
    if (!isFinite(this.value) || !isFinite(this.maxValue) || this.maxValue === 0) {
      return '0';
    }
    const ratio = Math.floor((this.value / this.maxValue) * this.maxWidth);
    return String(Math.max(0, Math.min(ratio, this.maxWidth)));
  }
}

class DebugNode {
  render(context) {
    // Dump the current context (scopes) for debugging
    const dump = {
      scopes: context.scopes.map(s => {
        if (s && typeof s === 'object') {
          const out = {};
          for (const k of Object.keys(s)) {
            if (k.startsWith('__')) continue;
            try {
              const v = s[k];
              out[k] = typeof v === 'function' ? '[function]' : v;
            } catch {
              out[k] = '[unreadable]';
            }
          }
          return out;
        }
        return String(s);
      })
    };
    const { escapeHtml, markSafe } = require('../security');
    return markSafe('<pre>' + escapeHtml(JSON.stringify(dump, null, 2)) + '</pre>');
  }
}

function parseWidthRatio(tagContent, _parser) {
  // {% widthratio this_value max_value max_width %}
  const parts = tagContent.replace(/^widthratio\s+/, '').trim().split(/\s+/);
  if (parts.length < 3) {
    throw new Error('\'widthratio\' tag requires 3 arguments: value, max_value, max_width');
  }
  return new WidthRatioNode(parts[0], parts[1], parts[2]);
}

function parseDebug(_tagContent, _parser) {
  return new DebugNode();
}

function parseCspNonceAttr(_tagContent, _parser) {
  return new CspNonceAttrNode();
}

class LoadNode {
  constructor(libraries) {
    this.libraries = Array.isArray(libraries) ? libraries : [libraries];
  }

  render(_context) {
    const { activateLibrary, hasLibrary } = require('../libraries');
    for (const lib of this.libraries) {
      if (hasLibrary(lib)) {
        activateLibrary(lib);
      } else {
        // Emit a comment-style warning for missing library
        console.warn(`[miki-template] Library not found: '${lib}'`);
      }
    }
    return '';
  }
}

class TemplatetagNode {
  constructor(token) {
    this.token = token;
  }

  render(_context) {
    const map = {
      'openblock': '{%',
      'closeblock': '%}',
      'openvariable': '{{',
      'closevariable': '}}',
      'openbrace': '{',
      'closebrace': '}',
      'opencomment': '{#',
      'closecomment': '#}'
    };
    return map[this.token] || this.token;
  }
}

function parseLoad(tagContent, _parser) {
  const parts = tagContent.trim().split(/\s+/);
  if (parts.length === 0) {
    throw new Error('\'load\' tag requires at least one argument');
  }
  // Pre-activate the library now so any tags it provides are available
  // to the rest of the parser. The render-time activation in LoadNode
  // is a no-op if the library is already active.
  const { activateLibrary, hasLibrary } = require('../libraries');
  for (const lib of parts) {
    if (hasLibrary(lib)) {
      activateLibrary(lib);
    }
  }
  return new LoadNode(parts);
}

function parseTemplatetag(tagContent, _parser) {
  const parts = tagContent.trim().split(/\s+/);
  // First part is the tag name, rest is the argument
  const token = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  return new TemplatetagNode(token);
}

module.exports = {
  StaticNode,
  UrlNode,
  RegroupNode,
  SpacelessNode,
  CsrfTokenNode,
  CspNonceAttrNode,
  LoadNode,
  TemplatetagNode,
  WidthRatioNode,
  DebugNode,
  parsers: {
    static: parseStatic,
    url: parseUrl,
    regroup: parseRegroup,
    spaceless: parseSpaceless,
    csrf_token: parseCsrfToken,
    csp_nonce_attr: parseCspNonceAttr,
    load: parseLoad,
    templatetag: parseTemplatetag,
    widthratio: parseWidthRatio,
    debug: parseDebug
  }
};
