/**
 * Fast string concatenation for an array of AST nodes.
 *
 * Replaces the common pattern
 *   body.map(n => n.render(context)).join('')
 * with a tight loop that calls .render() and concatenates directly.
 * V8 optimizes `let s = ''; s += x` well (cons strings), whereas
 * `.map().join('')` allocates an intermediate array.
 */
function renderBody(body, context) {
  let out = '';
  if (!body) return out;
  for (let i = 0, len = body.length; i < len; i++) {
    const r = body[i].render(context);
    if (r instanceof Promise) {
      out += '';
    } else {
      out += r;
    }
  }
  return out;
}

/**
 * Async version of renderBody — awaits Promises from any node.
 */
async function renderBodyAsync(body, context) {
  let out = '';
  if (!body) return out;
  for (let i = 0, len = body.length; i < len; i++) {
    const r = body[i].render(context);
    if (r instanceof Promise) out += await r;
    else out += r;
  }
  return out;
}

/**
 * Render body, returning a Promise or string based on what nodes
 * produce. Used by HelperNode and the render* entry points.
 */
function renderBodyMaybeAsync(body, context) {
  let out = '';
  let pending = null;
  for (let i = 0, len = body.length; i < len; i++) {
    const r = body[i].render(context);
    if (r instanceof Promise) {
      if (!pending) pending = [];
      pending.push(r.then(v => { out += v; }));
    } else {
      out += r;
    }
  }
  if (pending) {
    return Promise.all(pending).then(() => out);
  }
  return out;
}

module.exports = { renderBody, renderBodyAsync, renderBodyMaybeAsync };
