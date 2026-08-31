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
const { getCompiled, clearCache } = require('./cache');
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

// Load i18n tags
const i18nTags = require('./tags/i18n');
for (const [name, parserFn] of Object.entries(i18nTags.parsers)) {
  registerTag(name, parserFn);
}

// i18n module
const i18n = require('./i18n');

// Plugin/filter library system
const libraries = require('./libraries');

// Re-export the library module APIs
module.exports = {
  compile,
  render,
  asyncRender,
  __express,
  __expressAsync,
  stripExpressContext,
  clearCache,
  registerTag,
  registerFilter,
  getFilter,
  registerHelper,
  registerContextProcessor,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml,
  // i18n
  registerTranslation: i18n.registerTranslation,
  unregisterTranslation: i18n.unregisterTranslation,
  setLanguage: i18n.setLanguage,
  getLanguage: i18n.getLanguage,
  setFallbackLanguage: i18n.setFallbackLanguage,
  getFallbackLanguage: i18n.getFallbackLanguage,
  getAvailableLanguages: i18n.getAvailableLanguages,
  // Plugin/filter libraries
  registerLibrary: libraries.registerLibrary,
  unregisterLibrary: libraries.unregisterLibrary,
  getLibrary: libraries.getLibrary,
  getLibraryNames: libraries.getLibraryNames,
  hasLibrary: libraries.hasLibrary,
  registerLibraryFromPath: libraries.registerLibraryFromPath,
  activateLibrary: libraries.activateLibrary
};

/**
 * Render an AST recursively to resolve inheritance chain.
 * Async-aware: awaits Promises from any node.
 */
async function renderASTAsync(nodes, context) {
  context.parentTemplate = null;
  const parts = [];
  for (const node of nodes) {
    const result = node.render(context);
    parts.push(result instanceof Promise ? await result : result);
  }
  let output = parts.join('');

  if (context.parentTemplate) {
    const parentName = context.parentTemplate;
    context.parentTemplate = null;

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
        const relative = path.relative(path.resolve(dir), fullPath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new Error(`Extends tag attempted path traversal outside allowed views: '${parentName}'`);
        }
        fileContent = fs.readFileSync(fullPath, 'utf8');
        loaded = true;
        break;
      } catch (e) {
        if (e.message && e.message.startsWith('Extends tag attempted path traversal')) {
          throw e;
        }
      }
    }

    if (!loaded) {
      throw new Error(`Template not found: '${parentName}' in directories ${JSON.stringify(viewsDirs)}`);
    }

    const parentTokens = tokenize(fileContent);
    const parentParser = new Parser(parentTokens, getTagRegistry());
    const parentNodes = parentParser.parse();

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

    return await renderASTAsync(parentNodes, context);
  }

  return output;
}

/**
 * Synchronous renderAST - throws if any node returns a Promise.
 */
function renderAST(nodes, context) {
  context.parentTemplate = null;
  const output = nodes.map(node => {
    const result = node.render(context);
    if (result instanceof Promise) {
      throw new Error('Async node encountered during sync render. Use asyncRender() instead.');
    }
    return result;
  }).join('');

  if (context.parentTemplate) {
    const parentName = context.parentTemplate;
    context.parentTemplate = null;

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
        const relative = path.relative(path.resolve(dir), fullPath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new Error(`Extends tag attempted path traversal outside allowed views: '${parentName}'`);
        }
        fileContent = fs.readFileSync(fullPath, 'utf8');
        loaded = true;
        break;
      } catch (e) {
        if (e.message && e.message.startsWith('Extends tag attempted path traversal')) {
          throw e;
        }
      }
    }

    if (!loaded) {
      throw new Error(`Template not found: '${parentName}' in directories ${JSON.stringify(viewsDirs)}`);
    }

    const parentTokens = tokenize(fileContent);
    const parentParser = new Parser(parentTokens, getTagRegistry());
    const parentNodes = parentParser.parse();

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
  return getCompiled(templateStr, options, (tmpl, opts) => {
    const tokens = tokenize(tmpl);
    const parser = new Parser(tokens, getTagRegistry());
    const nodes = parser.parse();

    // Collect partial definitions at compile time
    const partialDefs = {};
    function collectPartials(nodeList) {
      for (const node of nodeList) {
        if (node.constructor.name === 'PartialDefNode') {
          partialDefs[node.name] = node;
        }
        if (node.body) {
          collectPartials(node.body);
        }
        if (node.elifBranches) {
          for (const branch of node.elifBranches) {
            collectPartials(branch.body);
          }
        }
        if (node.elseBody) {
          collectPartials(node.elseBody);
        }
      }
    }
    collectPartials(nodes);

    return {
      render: (contextObj = {}) => {
        const processedContextObj = applyContextProcessors({ ...contextObj });
        const context = new Context(processedContextObj, opts);
        context.reset();
        if (parser.blocks) {
          for (const [name, blockList] of Object.entries(parser.blocks)) {
            context.blocks[name] = [...blockList];
          }
        }
        // Register partial definitions from compile-time
        for (const [name, partial] of Object.entries(partialDefs)) {
          context.registerPartial(name, partial);
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
        for (const [name, partial] of Object.entries(partialDefs)) {
          context.registerPartial(name, partial);
        }
        return await renderASTAsync(nodes, context);
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
        for (const [name, partial] of Object.entries(partialDefs)) {
          context.registerPartial(name, partial);
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
        const processedContextObj = applyContextProcessors({ ...contextObj });
        const context = new Context(processedContextObj, opts);
        for (const [name, partial] of Object.entries(partialDefs)) {
          context.registerPartial(name, partial);
        }
        const partial = context.getPartial(partialName);
        if (!partial) {
          throw new Error(`Partial '${partialName}' not found`);
        }
        return partial.body.map(n => n.render(context)).join('');
      }
    };
  });
}

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
 * Express adapter engine (synchronous callback form).
 * Strips Express framework keys from the context so they don't leak
 * into the template scope.
 */
function __express(filePath, options, callback) {
  // Detect Express 5+ async view engine signature:
  // Express 5 calls engine(path, options) and awaits the return value when
  // the engine returns a Promise. We support BOTH signatures.
  if (typeof callback !== 'function') {
    // Express 5 async signature: return a Promise
    return __expressAsync(filePath, options);
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const renderOptions = {
      views: options && options.settings ? options.settings.views : path.dirname(filePath),
      ...(options || {})
    };
    // Strip Express framework keys from the context
    const ctx = stripExpressContext(options);
    const result = render(fileContent, ctx, renderOptions);
    return callback(null, result);
  } catch (err) {
    return callback(err);
  }
}

/**
 * Strip Express-specific framework keys from a context object.
 * Internal keys (those starting with `_`), `settings`, and `cache` are removed.
 */
function stripExpressContext(options) {
  if (!options) return {};
  const ctx = {};
  for (const [k, v] of Object.entries(options)) {
    if (!k.startsWith('_') && k !== 'settings' && k !== 'cache') {
      ctx[k] = v;
    }
  }
  return ctx;
}

/**
 * Async view engine for Express 5+. Returns a Promise that resolves
 * to the rendered HTML. Use this when your templates have async helpers.
 *
 *   app.engine('html', miki.__expressAsync);
 */
function __expressAsync(filePath, options) {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const renderOptions = {
        views: options && options.settings ? options.settings.views : path.dirname(filePath),
        ...(options || {})
      };
      const ctx = stripExpressContext(options);
      // Use asyncRender so async helpers are awaited
      asyncRender(fileContent, ctx, renderOptions)
        .then(resolve)
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  compile,
  render,
  asyncRender,
  __express,
  __expressAsync,
  stripExpressContext,
  clearCache,
  registerTag,
  registerFilter,
  getFilter,
  registerHelper,
  registerContextProcessor,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml,
  // i18n
  registerTranslation: i18n.registerTranslation,
  unregisterTranslation: i18n.unregisterTranslation,
  setLanguage: i18n.setLanguage,
  getLanguage: i18n.getLanguage,
  setFallbackLanguage: i18n.setFallbackLanguage,
  getFallbackLanguage: i18n.getFallbackLanguage,
  getAvailableLanguages: i18n.getAvailableLanguages,
  // Plugin/filter libraries
  registerLibrary: libraries.registerLibrary,
  unregisterLibrary: libraries.unregisterLibrary,
  getLibrary: libraries.getLibrary,
  getLibraryNames: libraries.getLibraryNames,
  hasLibrary: libraries.hasLibrary,
  registerLibraryFromPath: libraries.registerLibraryFromPath,
  activateLibrary: libraries.activateLibrary
};
