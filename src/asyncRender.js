// Async rendering utilities

/**
 * Async version of renderAST that awaits any Promise returned by node.render.
 * Handles async nodes anywhere in the AST (inside conditionals, loops, etc.)
 */
async function asyncRenderAST(nodes, context) {
  // Helper to render a single node, awaiting if needed, and recursively handling children
  const renderNode = async (node) => {
    const result = node.render(context);
    return result instanceof Promise ? await result : result;
  };

  const parts = [];
  for (const node of nodes) {
    parts.push(await renderNode(node));
  }
  return parts.join('');
}

module.exports = { asyncRenderAST };