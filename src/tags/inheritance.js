/**
 * Inheritance template tags: extends, block, include.
 */
const fs = require('fs');
const path = require('path');

// Helper to resolve expression values
function resolveValue(token, context) {
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    return token.slice(1, -1);
  }
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
  constructor(templateNameExpr, extraMappings) {
    this.templateNameExpr = templateNameExpr;
    this.extraMappings = extraMappings; // Array of { name, valPath }
  }

  render(context) {
    const templateName = resolveValue(this.templateNameExpr, context);
    if (!templateName) return '';

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
        // Propagate traversal errors, otherwise try next directory
        if (e.message && e.message.startsWith('Include tag attempted path traversal')) {
          throw e;
        }
        // continue searching other directories
      }
    }

    if (!loaded) {
      throw new Error(`Template not found: '${templateName}' in directories ${JSON.stringify(viewsDirs)}`);
    }

    // Parse and tokenize dynamically (uses lazy imports to break loops)
    const { tokenize } = require('../lexer');
    const { Parser } = require('../parser');
    const { getTagRegistry } = require('./registry');

    const tokens = tokenize(fileContent);
    const parser = new Parser(tokens, getTagRegistry());
    const nodes = parser.parse();

    // Set up include scope
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


// --- Tag Registry Parsers ---

function parseExtends(tagContent, parser) {
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

function parseInclude(tagContent, parser) {
  // tagContent: "include 'header.html'" or "include 'header.html' with val1=var1"
  const content = tagContent.slice(8).trim();
  
  // Extract template expression
  const parts = content.split(/\s+with\s+/);
  const templateNameExpr = parts[0].trim();
  
  const extraMappings = [];
  if (parts[1]) {
    const pairRegex = /(\w+)=([^\s]+)/g;
    let match;
    while ((match = pairRegex.exec(parts[1])) !== null) {
      extraMappings.push({ name: match[1], valPath: match[2] });
    }
  }

  return new IncludeNode(templateNameExpr, extraMappings);
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
