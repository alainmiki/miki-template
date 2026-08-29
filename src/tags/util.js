/**
 * Utility template tags: static, url, regroup, spaceless.
 */

// Helper to resolve expression values
function resolveValue(token, context) {
  if (!token) return '';
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    return token.slice(1, -1);
  }
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
    const relative = resolvedPath.startsWith('/') ? resolvedPath.slice(1) : resolvedPath;
    
    return base + relative;
  }
}

class UrlNode {
  constructor(routeNameExpr, argsExprs) {
    this.routeNameExpr = routeNameExpr;
    this.argsExprs = argsExprs || [];
  }

  render(context) {
    const routeName = resolveValue(this.routeNameExpr, context);
    const resolvedArgs = this.argsExprs.map(arg => resolveValue(arg, context));

    // If an Express urlHelper is provided, use it
    if (context.options && typeof context.options.urlHelper === 'function') {
      return context.options.urlHelper(routeName, ...resolvedArgs);
    }

    // Fallback URL generator
    return '/' + [routeName, ...resolvedArgs].filter(Boolean).join('/');
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
    const html = `<input type="hidden" name="csrfmiddlewaretoken" value="${token}">`;
    const { markSafe } = require('../security');
    return markSafe(html);
  }
}

class CspNonceAttrNode {
  render(context) {
    const nonce = context.get('csp_nonce') || '';
    if (!nonce) return '';
    const html = `nonce="${nonce}"`;
    const { markSafe } = require('../security');
    return markSafe(html);
  }
}

// --- Tag Registry Parsers ---

function parseStatic(tagContent, parser) {
  // tagContent: "static 'css/style.css'"
  const pathExpr = tagContent.slice(6).trim();
  return new StaticNode(pathExpr);
}

function parseUrl(tagContent, parser) {
  // tagContent: "url 'route_name' arg1 arg2"
  const content = tagContent.slice(3).trim();
  
  // Extract route name and arguments
  const argRegex = /(".*?"|'.*?'|[^\s]+)/g;
  const matches = content.match(argRegex) || [];
  
  const routeNameExpr = matches[0];
  const argsExprs = matches.slice(1);

  return new UrlNode(routeNameExpr, argsExprs);
}

function parseRegroup(tagContent, parser) {
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

function parseCsrfToken(tagContent, parser) {
  return new CsrfTokenNode();
}

function parseCspNonceAttr(tagContent, parser) {
  return new CspNonceAttrNode();
}

module.exports = {
  StaticNode,
  UrlNode,
  RegroupNode,
  SpacelessNode,
  CsrfTokenNode,
  CspNonceAttrNode,
  parsers: {
    static: parseStatic,
    url: parseUrl,
    regroup: parseRegroup,
    spaceless: parseSpaceless,
    csrf_token: parseCsrfToken,
    csp_nonce_attr: parseCspNonceAttr
  }
};
