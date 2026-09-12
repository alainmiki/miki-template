/**
 * Additional utility template tags: now, set, ifchanged.
 */

const { evaluateExpression } = require('../parser');

// --- {% now %} tag ---

class NowNode {
  constructor(formatExpr) {
    this.formatExpr = formatExpr;
  }

  render(context) {
    const fmt = evaluateExpression(this.formatExpr, context);
    const now = new Date();
    if (!fmt) return now.toISOString();
    const dateFilter = require('../filters');
    return dateFilter.getFilter('date')(now, fmt);
  }
}

function parseNow(tagContent, _parser) {
  const fmt = tagContent.slice(3).trim();
  return new NowNode(fmt || '"Y-m-d H:i:s"');
}

// --- {% set %} tag ---

class SetNode {
  constructor(nameExpr, valueExpr, body) {
    this.nameExpr = nameExpr;
    this.valueExpr = valueExpr;
    this.body = body || [];
  }

  render(context) {
    const name = String(this.nameExpr);
    const value = this.valueExpr !== undefined ? evaluateExpression(this.valueExpr, context) : '';
    if (name) {
      context.scopes[0][name] = value;
    }
    return this.body.map(n => n.render(context)).join('');
  }
}

function parseSet(tagContent, parser) {
  // {% set var = expr %}
  // {% set var %}...{% endset %}
  const trimmed = tagContent.slice(3).trim();

  // Block form: {% set var %}...{% endset %}
  if (!trimmed.includes('=')) {
    const varName = trimmed.trim();
    const body = parser.parse(['endset']);
    const next = parser.peek();
    if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endset') {
      parser.advance();
    }
    return new SetNode(varName, undefined, body);
  }

  // Inline form: {% set var = expr %}
  const eqIdx = trimmed.indexOf('=');
  const nameExpr = trimmed.slice(0, eqIdx).trim();
  const valueExpr = trimmed.slice(eqIdx + 1).trim();
  return new SetNode(nameExpr, valueExpr, []);
}

// --- {% ifchanged %} tag ---

class IfChangedNode {
  constructor(conditionStr, body, elseBody) {
    this.conditionStr = conditionStr;
    this.body = body;
    this.elseBody = elseBody;
  }

  render(context) {
    const currentVal = this.conditionStr ? evaluateExpression(this.conditionStr, context) : undefined;

    if (!context.ifChangedState) {
      context.ifChangedState = new Map();
    }

    const lastVal = context.ifChangedState.get(this.conditionStr);

    let changed = false;
    if (lastVal === undefined) {
      changed = true;
    } else if (currentVal !== lastVal) {
      changed = true;
    }

    if (changed) {
      context.ifChangedState.set(this.conditionStr, currentVal);
      return this.body.map(n => n.render(context)).join('');
    }

    if (this.elseBody) {
      return this.elseBody.map(n => n.render(context)).join('');
    }

    return '';
  }
}

function parseIfChanged(tagContent, parser) {
  // {% ifchanged [value] %}
  const conditionStr = tagContent.slice(9).trim();
  const body = parser.parse(['else', 'endifchanged']);
  let elseBody = null;

  while (true) {
    const next = parser.peek();
    if (!next || next.type !== 'block') break;
    const tagName = next.content.split(/\s+/)[0];
    if (tagName === 'else') {
      parser.advance();
      elseBody = parser.parse(['endifchanged']);
    } else if (tagName === 'endifchanged') {
      parser.advance();
      break;
    } else {
      break;
    }
  }

  return new IfChangedNode(conditionStr, body, elseBody);
}

module.exports = {
  NowNode,
  SetNode,
  IfChangedNode,
  parsers: {
    now: parseNow,
    set: parseSet,
    ifchanged: parseIfChanged
  }
};
