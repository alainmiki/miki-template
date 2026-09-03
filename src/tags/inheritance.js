/**
 * Inheritance template tags: extends, block, include.
 */
const fs = require('fs');
const path = require('path');
const { Context } = require('../context');

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
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  return context.get(token);
}

class ExtendsNode {
  constructor(parentTemplateExpr) {
    this.parentTemplateExpr = parentTemplateExpr;
  }

  render(context) {
    const parentName = resolveValue(this.parentTemplateExpr, context);
    if (!parentName) return '';
    context.parentTemplate = parentName;
    return '';
  }
}

class BlockNode {
  constructor(name, body) {
    this.name = name;
    this.body = body;
  }

  render(context) {
    const blockStack = context.blocks[this.name];
    if (!blockStack || blockStack.length === 0) {
      // If block is not overridden, render its default body
      return this.body.map(n => n.render(context)).join('');
    }

    if (!context.blockRenderIndices) {
      context.blockRenderIndices = {};
    }

    const currentIndex = context.blockRenderIndices[this.name] !== undefined 
      ? context.blockRenderIndices[this.name] 
      : -1;

    if (currentIndex === -1) {
      // Direct rendering entrypoint: start at the child-most block (index 0)
      context.blockRenderIndices[this.name] = 0;
      
      let superVal = '';
      if (blockStack.length > 1) {
        context.blockRenderIndices[this.name] = 1;
        superVal = blockStack[1].render(context);
      }
      
      context.push({ block: { super: superVal } });
      context.blockRenderIndices[this.name] = 0;
      const result = blockStack[0].body.map(n => n.render(context)).join('');
      context.pop();
      
      context.blockRenderIndices[this.name] = -1;
      return result;
    } else {
      // Rendering a parent/super block in the inheritance stack
      const nextIndex = currentIndex + 1;
      let superVal = '';
      if (nextIndex < blockStack.length) {
        context.blockRenderIndices[this.name] = nextIndex;
        superVal = blockStack[nextIndex].render(context);
      }
      
      context.push({ block: { super: superVal } });
      context.blockRenderIndices[this.name] = currentIndex;
      const result = blockStack[currentIndex].body.map(n => n.render(context)).join('');
      context.pop();
      
      return result;
    }
  }
}

class IncludeNode {
  constructor(templateNameExpr, extraMappings, partialName = null) {
    this.templateNameExpr = templateNameExpr;
    this.extraMappings = extraMappings; // Array of { name, valPath }
    this.partialName = partialName;     // When set, render only this partial
  }

  render(context) {
    const rawName = resolveValue(this.templateNameExpr, context);
    if (!rawName) return '';

    // Django-style partial selector: "home.html#card" means render
    // only the `card` partial defined inside `home.html`.
    let templateName = rawName;
    let partialName = this.partialName;
    const hashIdx = rawName.indexOf('#');
    if (hashIdx >= 0) {
      templateName = rawName.slice(0, hashIdx);
      partialName = rawName.slice(hashIdx + 1);
    }

    let viewsDirs = ['.'];
    if (context.options && context.options.settings && context.options.settings.views) {
      const views = context.options.settings.views;
      viewsDirs = Array.isArray(views) ? views : [views];
    } else if (context.options && context.options.views) {
      const views = context.options.views;
      viewsDirs = Array.isArray(views) ? views : [views];
    }

    let fileContent = '';
    let loaded = false;
    for (const dir of viewsDirs) {
      try {
        const fullPath = path.resolve(dir, templateName);
        // Security check: ensure the resolved path is within the allowed view directory
        const relative = path.relative(path.resolve(dir), fullPath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new Error(`Include tag attempted path traversal outside allowed views: '${templateName}'`);
        }
        fileContent = fs.readFileSync(fullPath, 'utf8');
        loaded = true;
        break;
      } catch (e) {
        if (e.message && e.message.startsWith('Include tag attempted path traversal')) {
          throw e;
        }
      }
    }

    if (!loaded) {
      throw new Error(`Template not found: '${templateName}' in directories ${JSON.stringify(viewsDirs)}`);
    }

    // Parse the included file. We use the same lexer/parser/registry
    // as the outer compile, which means {% load %}, custom tags, and
    // all partialdefs are registered when we parse the file.
    const { tokenize } = require('../lexer');
    const { Parser } = require('../parser');
    const { getTagRegistry } = require('./registry');

    const tokens = tokenize(fileContent);
    const parser = new Parser(tokens, getTagRegistry());
    const nodes = parser.parse();

    // If a partial selector was specified, compile the file so its
    // partialdefs register themselves, then render only the named
    // partial using the current context.
    if (partialName) {
      // Use a fresh context so partials from the included file do NOT
      // leak into the caller's partial registry. Only the requested
      // partial is rendered, and it can reference other partials from
      // the same included file via the temp context's registry.
      const tempContext = new Context({}, context.options || {});
      nodes.map(n => n.render(tempContext));
      const partial = tempContext.getPartial(partialName);
      if (!partial) {
        throw new Error(`Partial '${partialName}' not found in template '${templateName}'`);
      }
      // Build a render context that carries the caller's state but
      // only the included file's partial definitions.
      const renderCtx = new Context({}, context.options || {});
      renderCtx.scopes = context.scopes.slice();
      renderCtx.blocks = context.blocks;
      renderCtx.cycleStates = context.cycleStates;
      renderCtx.autoescape = context.autoescape;
      renderCtx.parentTemplate = context.parentTemplate;
      renderCtx.blockRenderIndices = context.blockRenderIndices;
      renderCtx.partialDefs = tempContext.partialDefs;
      // Apply include's `with` extra mappings on top of caller's ctx
      if (this.extraMappings && this.extraMappings.length > 0) {
        const extraScope = {};
        for (const m of this.extraMappings) {
          extraScope[m.name] = resolveValue(m.valPath, context);
        }
        renderCtx.push(extraScope);
        const out = partial.body.map(n => n.render(renderCtx)).join('');
        renderCtx.pop();
        return out;
      }
      return partial.body.map(n => n.render(renderCtx)).join('');
    }

    // Plain include (no partial selector): render the included body
    // inside the caller's context, applying any `with` extra mappings.
    if (this.extraMappings && this.extraMappings.length > 0) {
      const extraScope = {};
      for (const mapping of this.extraMappings) {
        extraScope[mapping.name] = resolveValue(mapping.valPath, context);
      }
      context.push(extraScope);
      const res = nodes.map(n => n.render(context)).join('');
      context.pop();
      return res;
    }

    return nodes.map(n => n.render(context)).join('');
  }
}

module.exports = {
  ExtendsNode,
  BlockNode,
  IncludeNode,
  parsers: {
    extends: parseExtends,
    block: parseBlock,
    include: parseInclude
  }
};

function parseExtends(tagContent, _parser) {
  // tagContent: "extends 'base.html'"
  const parentTemplateExpr = tagContent.slice(8).trim();
  return new ExtendsNode(parentTemplateExpr);
}

function parseBlock(tagContent, parser) {
  // tagContent: "block content"
  const name = tagContent.slice(6).trim();
  const body = parser.parse(['endblock']);
  
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endblock') {
    parser.advance(); // Consume endblock
  }

  const blockNode = new BlockNode(name, body);

  // Register the block stack on the parser so we track overriding chain
  parser.blocks = parser.blocks || {};
  if (!parser.blocks[name]) {
    parser.blocks[name] = [];
  }
  parser.blocks[name].push(blockNode);

  return blockNode;
}

function parseInclude(tagContent, _parser) {
  // tagContent: "include 'header.html'" or
  //             "include 'header.html' with val1=var1 val2='literal'"
  //             "include 'header.html#partial_name'"
  const content = tagContent.slice(8).trim();

  // Extract template expression (may be quoted)
  const tmplMatch = content.match(/^(".*?"|'.*?'|\S+)/);
  if (!tmplMatch) {
    throw new Error('include tag requires a template name');
  }
  const templateNameExpr = tmplMatch[1];
  const rest = content.slice(tmplMatch[0].length).trim();

  // Optional `with k1=v1 k2='v2' k3=v3`
  let extraMappings = [];
  if (rest) {
    const withMatch = rest.match(/^with\s+(.+)$/s);
    if (withMatch) {
      extraMappings = parseKeyValuePairs(withMatch[1]);
    }
  }

  return new IncludeNode(templateNameExpr, extraMappings);
}

/**
 * Parse a whitespace-separated list of `key=value` pairs. Values may be
 * quoted (single or double quotes) or bare identifiers. The
 * control.js parseKeyValuePairs handles commas, so prefer that — but
 * include's `with` historically used a whitespace separator. Support
 * both for backwards compatibility.
 */
function parseKeyValuePairs(str) {
  const pairs = [];
  let i = 0;
  while (i < str.length) {
    while (i < str.length && /\s/.test(str[i])) i++;
    if (i >= str.length) break;

    // Read key
    let key = '';
    while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
      key += str[i++];
    }
    if (!key) { i++; continue; }
    while (i < str.length && /\s/.test(str[i])) i++;
    if (str[i] !== '=') { i++; continue; }
    i++; // consume '='
    while (i < str.length && /\s/.test(str[i])) i++;

    let val = '';
    if (str[i] === '"' || str[i] === '\'') {
      const quote = str[i++];
      while (i < str.length && str[i] !== quote) {
        if (str[i] === '\\' && i + 1 < str.length) i++;
        val += str[i++];
      }
      if (str[i] === quote) i++;
      // Preserve quotes so resolveValue can recognize the literal
      val = quote + val + quote;
    } else {
      // Unquoted value: read until comma or whitespace
      while (i < str.length && str[i] !== ',' && !/\s/.test(str[i])) {
        val += str[i++];
      }
      // Consume trailing comma if present
      if (str[i] === ',') i++;
    }
    pairs.push({ name: key, valPath: val });
  }
  return pairs;
}

module.exports = {
  ExtendsNode,
  BlockNode,
  IncludeNode,
  parsers: {
    extends: parseExtends,
    block: parseBlock,
    include: parseInclude
  }
};
