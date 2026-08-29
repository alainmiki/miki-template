/**
 * Django-Style Template Engine for Node.js/Express
 * Main entrypoint.
 */
const fs = require('fs');
const path = require('path');
const { tokenize } = require('./lexer');
const { Parser } = require('./parser');
const { Context } = require('./context');

const { registerContextProcessor, applyContextProcessors } = require('./context_processors');
const { registerFilter, getFilter } = require('./filters');
const { SafeString, markSafe, isSafe, escapeHtml } = require('./security');
const { getCompiled } = require('./cache');
const { registerHelper } = require('./tags/helpers');
const { registerTag, getTagRegistry } = require('./tags/registry');
const { asyncRenderAST } = require('./asyncRender');

// Load control tags
const controlTags = require('./tags/control');
for (const [name, parserFn] of Object.entries(controlTags.parsers)) {
  registerTag(name, parserFn);
}

// Load inheritance tags
const inheritanceTags = require('./tags/inheritance');
for (const [name, parserFn] of Object.entries(inheritanceTags.parsers)) {
  registerTag(name, parserFn);
}

// Load utility tags
const utilTags = require('./tags/util');
for (const [name, parserFn] of Object.entries(utilTags.parsers)) {
  registerTag(name, parserFn);
}

/**
 * Render an AST recursively to resolve inheritance chain.
 */
function renderAST(nodes, context) {
  // Clear/Reset the parentTemplate flag for this level
  context.parentTemplate = null;

  // Initial render (populates context.blocks and sets context.parentTemplate if extends is parsed)
  const output = nodes.map(node => node.render(context)).join('');

  if (context.parentTemplate) {
    const parentName = context.parentTemplate;
    context.parentTemplate = null; // Clear to prevent loop recursion

    // Resolve template directory path
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
        const fullPath = path.resolve(dir, parentName);
        fileContent = fs.readFileSync(fullPath, 'utf8');
        loaded = true;
        break;
      } catch (e) {
        // Try next views directory
      }
    }

    if (!loaded) {
      throw new Error(`Template not found: '${parentName}' in directories ${JSON.stringify(viewsDirs)}`);
    }

    // Tokenize and parse parent template
    const parentTokens = tokenize(fileContent);
    const parentParser = new Parser(parentTokens, getTagRegistry());
    const parentNodes = parentParser.parse();

    // Register parent block nodes at the bottom of the override stacks
    if (parentParser.blocks) {
      for (const [name, blockList] of Object.entries(parentParser.blocks)) {
        if (!context.blocks[name]) {
          context.blocks[name] = [];
        }
        for (const blockNode of blockList) {
          if (!context.blocks[name].includes(blockNode)) {
            context.blocks[name].push(blockNode);
          }
        }
      }
    }

    return renderAST(parentNodes, context);
  }

  return output;
}

/**
 * Compiles a template string into a renderable object.
 */
function compile(templateStr, options = {}) {
  // Use AST cache to avoid recompiling identical templates
  return getCompiled(templateStr, options, (tmpl, opts) => {
    const tokens = tokenize(tmpl);
    const parser = new Parser(tokens, getTagRegistry());
    const nodes = parser.parse();

    return {
      render: (contextObj = {}) => {
        const processedContextObj = applyContextProcessors({ ...contextObj });
        const context = new Context(processedContextObj, opts);
        context.blocks = {};
        if (parser.blocks) {
          for (const [name, blockList] of Object.entries(parser.blocks)) {
            context.blocks[name] = [...blockList];
          }
        }
        return renderAST(nodes, context);
      },
      asyncRender: async (contextObj = {}) => {
        const processedContextObj = applyContextProcessors({ ...contextObj });
        const context = new Context(processedContextObj, opts);
        context.blocks = {};
        if (parser.blocks) {
          for (const [name, blockList] of Object.entries(parser.blocks)) {
            context.blocks[name] = [...blockList];
          }
        }
        return await asyncRenderAST(nodes, context);
      },
      renderBlock: (blockName, contextObj = {}) => {
        const processedContextObj = applyContextProcessors({ ...contextObj });
        const context = new Context(processedContextObj, opts);
        context.blocks = {};
        if (parser.blocks) {
          for (const [name, blockList] of Object.entries(parser.blocks)) {
            context.blocks[name] = [...blockList];
          }
        }
        renderAST(nodes, context);
        const blockStack = context.blocks[blockName];
        if (!blockStack || blockStack.length === 0) {
          throw new Error(`Block '${blockName}' not found in template`);
        }
        if (!context.blockRenderIndices) {
          context.blockRenderIndices = {};
        }
        context.blockRenderIndices[blockName] = 0;
        let superVal = '';
        if (blockStack.length > 1) {
          context.blockRenderIndices[blockName] = 1;
          superVal = blockStack[1].render(context);
        }
        context.push({ block: { super: superVal } });
        context.blockRenderIndices[blockName] = 0;
        const result = blockStack[0].body.map(n => n.render(context)).join('');
        context.pop();
        context.blockRenderIndices[blockName] = -1;
        return result;
      },
      renderPartial: (partialName, contextObj = {}) => {
        const context = new Context(contextObj, opts);
        renderAST(nodes, context);
        const partial = context.getPartial(partialName);
        if (!partial) {
          throw new Error(`Partial '${partialName}' not found`);
        }
        return partial.body.map(n => n.render(context)).join('');
      }
    };
  });
} // close compile function


/**
 * Convenience rendering function.
 */
function render(templateStr, contextObj = {}, options = {}) {
  return compile(templateStr, options).render(contextObj);
}

/**
 * Async rendering function – returns a Promise.
 */
function asyncRender(templateStr, contextObj = {}, options = {}) {
  return compile(templateStr, options).asyncRender(contextObj);
}

/**
 * Express adapter engine.
 */
function __express(filePath, options, callback) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Express passes settings object containing view directories
    const renderOptions = {
      views: options.settings ? options.settings.views : path.dirname(filePath),
      ...options
    };
    const result = render(fileContent, options, renderOptions);
    return callback(null, result);
  } catch (err) {
    return callback(err);
  }
}

module.exports = {
  compile,
  render,
  asyncRender,
  __express,
  registerTag,
  registerFilter,
  registerHelper,
  registerContextProcessor,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml
};
