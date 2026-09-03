/**
 * Django-Style Template Engine for Node.js/Express
 * Main entrypoint.
 */
const fs = require('fs');
const path = require('path');
const { tokenize } = require('./lexer');
const { Parser } = require('./parser');
const { Context } = require('./context');

const { registerContextProcessor, applyContextProcessors, clearContextProcessors } = require('./context_processors');
const { registerFilter, getFilter } = require('./filters');
const { SafeString, markSafe, isSafe, escapeHtml } = require('./security');
const { getCompiled, clearCache } = require('./cache');
const { registerHelper } = require('./tags/helpers');
const { registerTag, getTagRegistry } = require('./tags/registry');

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

// Inject the registration functions so libraries can activate without
// triggering a circular require. This must happen BEFORE the
// auto-activation loop below.
libraries.setRegistrationFunctions({
  registerTag,
  registerFilter,
  registerHelper
});

// Auto-activate the built-in libraries so their filters/tags/helpers
// are available out of the box. Users can still opt out by calling
// `unregisterLibrary` or by re-registering without activating.
for (const libName of libraries.getLibraryNames()) {
  libraries.activateLibrary(libName);
}

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
      renderWith: (contextObj = {}, callOptions = {}) => {
        const processedContextObj = applyContextProcessors({ ...contextObj });
        const mergedOpts = { ...opts, ...callOptions };
        const context = new Context(processedContextObj, mergedOpts);
        context.reset();
        if (parser.blocks) {
          for (const [name, blockList] of Object.entries(parser.blocks)) {
            context.blocks[name] = [...blockList];
          }
        }
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
      asyncRenderWith: async (contextObj = {}, callOptions = {}) => {
        const processedContextObj = applyContextProcessors({ ...contextObj });
        const mergedOpts = { ...opts, ...callOptions };
        const context = new Context(processedContextObj, mergedOpts);
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
 *
 * If `templateStr` looks like a file path with a `#partialName` suffix
 * (e.g. `"home.html#card"`) AND `options.views` is set, the file is
 * loaded from the views dir(s) and only the named partial is rendered.
 * This is the engine's idiomatic way to serve HTMX partial responses.
 *
 * If the string contains template syntax (`{{` or `{%`), it is always
 * treated as a template string (not a file path), so existing call
 * sites that pass template source are unaffected.
 *
 * Without a `#` suffix, the whole template is rendered (existing
 * behavior).
 */
function render(templateStr, contextObj = {}, options = {}) {
  // Only treat the input as a file path when:
  //   1. It has a `#` and a partial name
  //   2. options.views is configured
  //   3. The string does NOT contain template syntax
  const hashIdx = templateStr.indexOf('#');
  const hasTemplateSyntax = /\{[{%]/.test(templateStr);
  if (hashIdx >= 0 && !hasTemplateSyntax && options && options.views) {
    const fileName = templateStr.slice(0, hashIdx);
    const partialName = templateStr.slice(hashIdx + 1);
    return renderPartialFromFile(fileName, partialName, contextObj, options);
  }

  const compiled = compile(templateStr, options);
  if (options && Object.keys(options).length > 0) {
    return compiled.renderWith(contextObj, options);
  }
  return compiled.render(contextObj);
}

/**
 * Load a template file from the configured views dir(s), register its
 * partials, and render only the named partial. This is the
 * implementation behind `render("file.html#partial", ...)`.
 */
function renderPartialFromFile(fileName, partialName, contextObj, options) {
  const { Context } = require('./context');
  const { tokenize } = require('./lexer');
  const { Parser } = require('./parser');
  const { getTagRegistry } = require('./tags/registry');
  const { applyContextProcessors } = require('./context_processors');

  let viewsDirs = ['.'];
  if (options.settings && options.settings.views) {
    viewsDirs = Array.isArray(options.settings.views) ? options.settings.views : [options.settings.views];
  } else if (options.views) {
    viewsDirs = Array.isArray(options.views) ? options.views : [options.views];
  }

  let fileContent = null;
  let loaded = false;
  // Try the literal name first, then with each supported extension appended.
  const candidates = [];
  if (/\.[a-z0-9]+$/i.test(fileName)) {
    candidates.push(fileName);
  } else {
    candidates.push(fileName + '.html', fileName + '.miki');
  }
  for (const dir of viewsDirs) {
    for (const candidate of candidates) {
      try {
        const fullPath = path.resolve(dir, candidate);
        const relative = path.relative(path.resolve(dir), fullPath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          continue;
        }
        fileContent = fs.readFileSync(fullPath, 'utf8');
        loaded = true;
        break;
      } catch {
        // try next candidate
      }
    }
    if (loaded) break;
  }
  if (!loaded) {
    throw new Error(
      `Template not found: '${fileName}' in directories ${JSON.stringify(viewsDirs)}`
    );
  }

  const tokens = tokenize(fileContent);
  const parser = new Parser(tokens, getTagRegistry());
  const nodes = parser.parse();

  // Build a context to register the partials. We share the partial
  // registry with a fresh context for the actual render.
  const tempContext = new Context({}, options);
  for (const node of nodes) {
    node.render(tempContext);
  }
  const partial = tempContext.getPartial(partialName);
  if (!partial) {
    throw new Error(
      `Partial '${partialName}' not found in template '${fileName}'`
    );
  }

  const processedContextObj = applyContextProcessors({ ...contextObj });
  const context = new Context(processedContextObj, options);
  context.partialDefs = tempContext.partialDefs;
  return partial.body.map(n => n.render(context)).join('');
}

/**
 * Async rendering function – returns a Promise.
 */
function asyncRender(templateStr, contextObj = {}, options = {}) {
  const hashIdx = templateStr.indexOf('#');
  const hasTemplateSyntax = /\{[{%]/.test(templateStr);
  if (hashIdx >= 0 && !hasTemplateSyntax && options && options.views) {
    const fileName = templateStr.slice(0, hashIdx);
    const partialName = templateStr.slice(hashIdx + 1);
    return new Promise((resolve, reject) => {
      try {
        resolve(renderPartialFromFile(fileName, partialName, contextObj, options));
      } catch (e) {
        reject(e);
      }
    });
  }
  const compiled = compile(templateStr, options);
  if (options && Object.keys(options).length > 0) {
    return compiled.asyncRenderWith(contextObj, options);
  }
  return compiled.asyncRender(contextObj);
}

/**
 * Express adapter engine (synchronous callback form).
 * Strips Express framework keys from the context so they don't leak
 * into the template scope.
 *
 * If `filePath` contains a `#partialName` suffix, only the named
 * partial is rendered. This enables HTMX-style partial responses:
 *
 *   res.render('home#card', { ... });
 */
function __express(filePath, options, callback) {
  if (typeof callback !== 'function') {
    return __expressAsync(filePath, options);
  }

  // Detect "file#partial" form
  const hashIdx = filePath.lastIndexOf('#');
  if (hashIdx > 0) {
    const realFilePath = filePath.slice(0, hashIdx);
    const partialName = filePath.slice(hashIdx + 1);
    try {
      const fileContent = fs.readFileSync(realFilePath, 'utf8');
      const renderOptions = {
        views: realFilePath,
        ...(options || {})
      };
      const ctx = stripExpressContext(options);
      const result = renderPartialFromSource(fileContent, partialName, ctx, renderOptions, realFilePath);
      return callback(null, result);
    } catch (err) {
      return callback(err);
    }
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
 * Compile a template source string and render only the named partial
 * from it. Used by __express when a view name carries a `#partial`
 * suffix.
 *
 * The challenge: when a template uses `{% extends 'parent' %}`,
 * the partials are typically defined inside `{% block ... %}` tags.
 * The top-level nodes are [ExtendsNode, BlockNode, ...], not the
 * blocks themselves. We need to register all partials regardless of
 * whether their enclosing for/if blocks have data to iterate.
 */
function renderPartialFromSource(fileContent, partialName, contextObj, options, filePath) {
  const { Context } = require('./context');
  const { tokenize } = require('./lexer');
  const { Parser } = require('./parser');
  const { getTagRegistry } = require('./tags/registry');
  const { applyContextProcessors } = require('./context_processors');

  const tokens = tokenize(fileContent);
  const parser = new Parser(tokens, getTagRegistry());
  const nodes = parser.parse();

  // Build a context with the caller's data so for-loops and other
  // constructs iterate properly when collecting partials.
  const processedContextObj = applyContextProcessors({ ...contextObj });
  const tempContext = new Context(processedContextObj, options);

  // Walk the ENTIRE AST and register every PartialDefNode we find,
  // regardless of whether its enclosing for/if has data. This ensures
  // partials are always available by name even when the caller
  // didn't provide the data the template would need to render them
  // in context.
  function registerAllPartials(nodeList) {
    for (const node of nodeList) {
      if (node.constructor.name === 'PartialDefNode') {
        tempContext.registerPartial(node.name, node);
      }
      if (node.body) registerAllPartials(node.body);
      if (node.elifBranches) for (const b of node.elifBranches) registerAllPartials(b.body);
      if (node.elseBody) registerAllPartials(node.elseBody);
    }
  }
  registerAllPartials(nodes);

  // Also try rendering top-level nodes so partials defined via
  // {% load %} or other dynamic mechanisms get a chance to register.
  // Errors are swallowed — we only care about partial registration.
  for (const node of nodes) {
    try {
      node.render(tempContext);
    } catch {
      // Ignore
    }
  }

  // If the template extends a parent, also collect partials from
  // the parent. This handles the common case where partials are
  // defined inside blocks that are part of an extended template.
  if (tempContext.parentTemplate) {
    try {
      const parentName = tempContext.parentTemplate;
      let viewsDirs = ['.'];
      if (options && options.settings && options.settings.views) {
        const v = options.settings.views;
        viewsDirs = Array.isArray(v) ? v : [v];
      } else if (options && options.views) {
        const v = options.views;
        viewsDirs = Array.isArray(v) ? v : [v];
      }
      for (const dir of viewsDirs) {
        const parentPath = require('path').resolve(dir, parentName);
        const relative = require('path').relative(require('path').resolve(dir), parentPath);
        if (relative.startsWith('..') || require('path').isAbsolute(relative)) continue;
        if (!require('fs').existsSync(parentPath)) continue;
        const parentContent = require('fs').readFileSync(parentPath, 'utf8');
        const pTokens = tokenize(parentContent);
        const pParser = new Parser(pTokens, getTagRegistry());
        const pNodes = pParser.parse();
        registerAllPartials(pNodes);
        for (const pNode of pNodes) {
          try { pNode.render(tempContext); } catch {}
        }
        break;
      }
    } catch {
      // Ignore parent resolution errors
    }
  }

  const partial = tempContext.getPartial(partialName);
  if (!partial) {
    throw new Error(
      `Partial '${partialName}' not found in template '${filePath || 'inline'}'`
    );
  }

  // Build a fresh context for the actual render using the caller's
  // data. Share the partial registry from the temp context.
  const context = new Context(processedContextObj, options);
  context.partialDefs = tempContext.partialDefs;
  return partial.body.map(n => n.render(context)).join('');
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
    // Detect "file#partial" form
    const hashIdx = filePath.lastIndexOf('#');
    if (hashIdx > 0) {
      const realFilePath = filePath.slice(0, hashIdx);
      const partialName = filePath.slice(hashIdx + 1);
      try {
        const fileContent = fs.readFileSync(realFilePath, 'utf8');
        const renderOptions = {
          views: realFilePath,
          ...(options || {})
        };
        const ctx = stripExpressContext(options);
        resolve(renderPartialFromSource(fileContent, partialName, ctx, renderOptions, realFilePath));
      } catch (err) {
        reject(err);
      }
      return;
    }

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

/**
 * Express integration helper. Returns a function suitable for
 * `app.engine(ext, fn)` that makes `res.render('view#partial', ...)`
 * just work without any extra middleware.
 *
 * Usage:
 *
 *   const miki = require('miki-template');
 *   const app = express();
 *   app.engine('html', miki.express());
 *   app.set('view engine', 'html');
 *   app.set('views', './views');
 *
 *   // Full page:
 *   app.get('/', (req, res) => res.render('home', { user }));
 *
 *   // HTMX partial — just one named partial from a template:
 *   app.get('/partials/:name', (req, res) =>
 *     res.render(`home#${req.params.name}`, { user })
 *   );
 *
 * The wrapper detects a `#partialName` suffix in the view name BEFORE
 * Express's view lookup runs, so it never tries to open a file like
 * `home#card.html`. It resolves the real file, calls the partial
 * renderer, and sends the result.
 */
function express(options = {}) {
  const baseEngine = options.async ? __expressAsync : __express;
  return function mikiViewEngine(filePath, engineOptions, callback) {
    // Detect the partial selector in the view name. Express passes
    // the resolved file path here — if the user wrote
    // `res.render('home#card', ...)`, Express will have already
    // tried (and failed) to resolve `home#card.html`. To support
    // partials, we need to intercept BEFORE Express resolves the
    // view. We do that by hooking `res.render` when this engine is
    // installed.
    // For the direct path (when called from `res.renderPartial` or
    // from our own `res.render` shim), we honor the `#partial`
    // suffix here.
    if (typeof callback !== 'function') {
      return Promise.reject(
        new Error('miki.express() engine must be called via res.render() with a callback')
      );
    }
    return baseEngine(filePath, engineOptions, callback);
  };
}

/**
 * One-shot Express setup. Wires `app.engine('html', ...)` and
 * installs a `res.render` shim so that `res.render('view#partial')`
 * works without any extra middleware. This is the recommended way
 * to integrate miki-template with Express.
 *
 * Usage:
 *
 *   const miki = require('miki-template');
 *   const app = express();
 *   miki.setupExpress(app, { extension: 'html', views: './views' });
 *
 *   app.get('/partials/:name', (req, res) =>
 *     res.render(`home#${req.params.name}`, { user: req.user })
 *   );
 */
function setupExpress(app, opts = {}) {
  const ext = (opts.extension || 'html').replace(/^\.+/, '');
  const async = !!opts.async;

  // Set view engine if not already set
  if (!app.get('view engine')) {
    app.set('view engine', ext);
  }
  // If opts.views is provided, always set it (so users can set
  // views via setupExpress without an extra app.set call).
  if (opts.views) {
    app.set('views', opts.views);
  }

  // Install the raw engine so Express can use it
  app.engine(ext, async ? __expressAsync : __express);

  // Capture config in a closure so patchedRender can use it even
  // when called before the request handler runs.
  const configExt = ext;
  const configViews = opts.views;

  // Capture the original res.render so we can dispatch on #partial
  const originalRender = app.response.render;
  app.response.render = function patchedRender(view, locals, callback) {
    // Normalize arguments: (view, callback) or (view, locals, callback)
    let cb = callback;
    let opts = locals;
    if (typeof locals === 'function') {
      cb = locals;
      opts = {};
    }
    opts = opts || {};
    // Inject settings so the engine can find the views dir
    if (!opts.settings) {
      opts.settings = this.req && this.req.app ? this.req.app.settings : {};
    }

    // If the view name has a `#partial` suffix, handle it ourselves
    // and never delegate to Express's view lookup.
    if (typeof view === 'string' && view.includes('#')) {
      const hashIdx = view.lastIndexOf('#');
      const fileName = view.slice(0, hashIdx);
      const partialName = view.slice(hashIdx + 1);

      // Resolve the real file path. Prefer opts.views (set by
      // setupExpress), then app.get('views'), then the default.
      const extname = require('path').extname(fileName);
      const candidates = extname
        ? [fileName]
        : [fileName + '.' + configExt, fileName + '.miki'];
      const viewsDir = configViews
        || (this.req && this.req.app ? this.req.app.get('views') : null)
        || process.cwd() + '/views';
      let filePath = null;
      for (const cand of candidates) {
        const p = require('path').resolve(viewsDir, cand);
        if (require('fs').existsSync(p)) {
          filePath = p;
          break;
        }
      }
      if (!filePath) {
        const err = new Error(
          `Failed to lookup view "${view}" in views directory "${viewsDir}"`
        );
        if (typeof cb === 'function') return cb(err);
        throw err;
      }

      const fileContent = require('fs').readFileSync(filePath, 'utf8');
      try {
        const html = renderPartialFromSource(
          fileContent,
          partialName,
          stripExpressContext(opts),
          Object.assign({ views: viewsDir }, opts),
          fileName
        );
        if (typeof cb === 'function') {
          return cb(null, html);
        }
        this.send(html);
        return;
      } catch (e) {
        if (typeof cb === 'function') return cb(e);
        throw e;
      }
    }

    // No partial selector: behave exactly like the original res.render
    if (cb) {
      return originalRender.call(this, view, opts, cb);
    }
    return originalRender.call(this, view, opts);
  };
}

/**
 * Express middleware helper. Adds a `res.renderPartial(view, locals)`
 * method that renders only the named partial (after a `#`) from a
 * view file. The view name follows the same syntax as `render()`:
 *
 *   app.use(miki.expressPartialRenderer());
 *   app.get('/card', (req, res) => res.renderPartial('home#card', { user }));
 */
function expressPartialRenderer() {
  return function (req, res, next) {
    res.renderPartial = function (view, locals = {}) {
      // Compose an Express-shaped options object so the engine can
      // find the view file. We mirror what res.render provides.
      const opts = Object.assign({}, res.locals, locals, {
        settings: req.app.settings
      });
      const hashIdx = view.lastIndexOf('#');
      if (hashIdx < 0) {
        // No partial selector: just delegate to res.render
        return res.render(view, locals);
      }
      const fileName = view.slice(0, hashIdx);
      const partialName = view.slice(hashIdx + 1);
      // Find the actual file the way Express would
      const ext = require('path').extname(fileName);
      const candidates = ext
        ? [fileName]
        : [fileName + '.html', fileName + '.miki'];
      const viewsDir = req.app.get('views');
      let filePath = null;
      for (const cand of candidates) {
        try {
          filePath = require('path').resolve(viewsDir, cand);
          if (require('fs').existsSync(filePath)) break;
          filePath = null;
        } catch { filePath = null; }
      }
      if (!filePath) {
        return res.status(404).send(
          `Template not found: '${fileName}' in '${viewsDir}'`
        );
      }
      try {
        const html = renderPartialFromSource(
          require('fs').readFileSync(filePath, 'utf8'),
          partialName,
          stripExpressContext(opts),
          { views: viewsDir, ...opts },
          fileName
        );
        res.send(html);
      } catch (err) {
        res.status(500).send(err.message);
      }
    };
    next();
  };
}

module.exports = {
  compile,
  render,
  asyncRender,
  renderPartialFromFile,
  renderPartialFromSource,
  __express,
  __expressAsync,
  express,
  setupExpress,
  expressPartialRenderer,
  stripExpressContext,
  clearCache,
  registerTag,
  registerFilter,
  getFilter,
  registerHelper,
  registerContextProcessor,
  clearContextProcessors,
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
