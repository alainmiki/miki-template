/**
 * Control flow template tags: if, for, with, cycle.
 */
const { Parser } = require('../parser');

// Helper to tokenize condition expressions safely
function tokenizeExpr(exprStr) {
  const regex = /(".*?"|'.*?'|\bnot\s+in\b|\bin\b|\band\b|\bor\b|\bnot\b|==|!=|<=|>=|<|>|[^\s"'<>!=]+)/g;
  const matches = exprStr.match(regex) || [];
  return matches.map(m => m.trim());
}

// Helper to resolve expression values safely
function resolveValue(token, context) {
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    return token.slice(1, -1);
  }
  if (!isNaN(token) && token !== '') {
    return Number(token);
  }
  if (token === 'true' || token === 'True') return true;
  if (token === 'false' || token === 'False') return false;
  if (token === 'none' || token === 'None' || token === 'null') return null;
  return context.get(token);
}

// Safely evaluates parsed expression tokens
function evaluateConditionTokens(tokens, context) {
  const items = tokens.map(t => {
    const lower = t.toLowerCase();
    if (['and', 'or', 'not', '==', '!=', '<', '<=', '>', '>=', 'in', 'not in'].includes(lower)) {
      return { type: 'op', value: lower };
    }
    return { type: 'val', value: resolveValue(t, context) };
  });

  // Evaluate unary 'not' operators (right-to-left)
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].type === 'op' && items[i].value === 'not') {
      const right = items[i + 1];
      if (right && right.type === 'val') {
        items.splice(i, 2, { type: 'val', value: !right.value });
      }
    }
  }

  // Evaluate comparisons
  for (let i = 0; i < items.length; i++) {
    if (items[i].type === 'op' && ['==', '!=', '<', '<=', '>', '>=', 'in', 'not in'].includes(items[i].value)) {
      const op = items[i].value;
      const left = items[i - 1];
      const right = items[i + 1];
      if (left && left.type === 'val' && right && right.type === 'val') {
        let res = false;
        const lv = left.value;
        const rv = right.value;
        switch (op) {
          case '==': res = (lv == rv); break;
          case '!=': res = (lv != rv); break;
          case '<': res = (lv < rv); break;
          case '<=': res = (lv <= rv); break;
          case '>': res = (lv > rv); break;
          case '>=': res = (lv >= rv); break;
          case 'in':
            res = Array.isArray(rv) || typeof rv === 'string' ? rv.includes(lv) : false;
            break;
          case 'not in':
            res = Array.isArray(rv) || typeof rv === 'string' ? !rv.includes(lv) : true;
            break;
        }
        items.splice(i - 1, 3, { type: 'val', value: res });
        i--;
      }
    }
  }

  // Evaluate 'and'
  for (let i = 0; i < items.length; i++) {
    if (items[i].type === 'op' && items[i].value === 'and') {
      const left = items[i - 1];
      const right = items[i + 1];
      if (left && left.type === 'val' && right && right.type === 'val') {
        const res = left.value && right.value;
        items.splice(i - 1, 3, { type: 'val', value: res });
        i--;
      }
    }
  }

  // Evaluate 'or'
  for (let i = 0; i < items.length; i++) {
    if (items[i].type === 'op' && items[i].value === 'or') {
      const left = items[i - 1];
      const right = items[i + 1];
      if (left && left.type === 'val' && right && right.type === 'val') {
        const res = left.value || right.value;
        items.splice(i - 1, 3, { type: 'val', value: res });
        i--;
      }
    }
  }

  return items.length > 0 ? !!items[0].value : false;
}

class IfNode {
  constructor(conditionStr, body, elifBranches, elseBody) {
    this.conditionStr = conditionStr;
    this.body = body;
    this.elifBranches = elifBranches; // Array of { conditionStr, body }
    this.elseBody = elseBody;
  }

  render(context) {
    const tokens = tokenizeExpr(this.conditionStr);
    if (evaluateConditionTokens(tokens, context)) {
      return this.body.map(n => n.render(context)).join('');
    }

    for (const branch of this.elifBranches) {
      const branchTokens = tokenizeExpr(branch.conditionStr);
      if (evaluateConditionTokens(branchTokens, context)) {
        return branch.body.map(n => n.render(context)).join('');
      }
    }

    if (this.elseBody) {
      return this.elseBody.map(n => n.render(context)).join('');
    }

    return '';
  }
}

class ForNode {
  constructor(loopVars, iterablePath, body, emptyBody) {
    this.loopVars = loopVars;
    this.iterablePath = iterablePath;
    this.body = body;
    this.emptyBody = emptyBody;
  }

  render(context) {
    const rawItems = context.get(this.iterablePath);
    let items = [];

    if (Array.isArray(rawItems)) {
      items = rawItems;
    } else if (rawItems && typeof rawItems === 'object') {
      // Support object key/value iterating or plain keys
      items = Object.keys(rawItems);
    }

    if (items.length === 0) {
      return this.emptyBody ? this.emptyBody.map(n => n.render(context)).join('') : '';
    }

    let output = '';
    const length = items.length;
    const parentLoop = context.get('forloop');

    for (let i = 0; i < length; i++) {
      const item = items[i];
      
      const forloop = {
        counter: i + 1,
        counter0: i,
        revcounter: length - i,
        revcounter0: length - i - 1,
        first: i === 0,
        last: i === length - 1,
        parentloop: parentLoop || null
      };

      const loopContext = { forloop };

      // Variable Unpacking
      if (this.loopVars.length === 1) {
        loopContext[this.loopVars[0]] = item;
      } else {
        // Multi-variable unpacking (e.g. key, val in dict)
        if (Array.isArray(item)) {
          for (let j = 0; j < this.loopVars.length; j++) {
            loopContext[this.loopVars[j]] = item[j];
          }
        } else if (typeof item === 'string') {
          for (let j = 0; j < this.loopVars.length; j++) {
            loopContext[this.loopVars[j]] = item[j] || '';
          }
        } else {
          loopContext[this.loopVars[0]] = item;
        }
      }

      context.push(loopContext);
      output += this.body.map(n => n.render(context)).join('');
      context.pop();
    }

    return output;
  }
}

class WithNode {
  constructor(mappings, body) {
    this.mappings = mappings; // Array of { name, valPath }
    this.body = body;
  }

  render(context) {
    const scope = {};
    for (const mapping of this.mappings) {
      scope[mapping.name] = context.get(mapping.valPath);
    }
    context.push(scope);
    const result = this.body.map(n => n.render(context)).join('');
    context.pop();
    return result;
  }
}

class CycleNode {
  constructor(args, asName) {
    this.args = args;
    this.asName = asName;
  }

  render(context) {
    const key = this.args.join(',');
    let idx = context.cycleStates.get(key) || 0;
    const token = this.args[idx % this.args.length];
    
    // Resolve token value (handles quoted string literals vs variable names)
    const val = resolveValue(token, context);
    
    context.cycleStates.set(key, idx + 1);

    if (this.asName) {
      context.scopes[0][this.asName] = val;
    }
    return String(val);
  }
}

/* Partial definition support */

class PartialDefNode {
  constructor(name, body, inline = false) {
    this.name = name;
    this.body = body; // array of child nodes
    this.inline = inline; // whether to render immediately
  }
  render(context) {
    // Register the partial definition in the context for later use.
    context.registerPartial(this.name, this);
    if (this.inline) {
      // Render the body immediately for inline partialdef.
      return this.body.map(n => n.render(context)).join('');
    }
    return '';
  }
}

class PartialNode {
  constructor(name) {
    this.name = name;
  }
  render(context) {
    const partial = context.getPartial(this.name);
    if (!partial) {
      throw new Error(`Partial not found: '${this.name}'`);
    }
    // Render the stored body within the current context.
    return partial.body.map(n => n.render(context)).join('');
  }
}

function parsePartialDef(tagContent, parser) {
  // Expected syntax: {% partialdef name [inline] %}
  const parts = tagContent.slice(10).trim().split(/\s+/);
  const name = parts[0];
  const inline = parts.includes('inline');
  if (!name) {
    throw new Error('partialdef tag requires a name');
  }
  const body = parser.parse(['endpartialdef']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endpartialdef') {
    parser.advance();
  }
  return new PartialDefNode(name, body, inline);
}

function parsePartial(tagContent, parser) {
  const name = tagContent.slice(7).trim();
  if (!name) {
    throw new Error('partial tag requires a name');
  }
  return new PartialNode(name);
}

class AutoescapeNode {
  constructor(setting, body) {
    this.setting = setting;
    this.body = body;
  }

  render(context) {
    const oldEscape = context.autoescape;
    context.autoescape = this.setting === 'on';
    const output = this.body.map(n => n.render(context)).join('');
    context.autoescape = oldEscape;
    return output;
  }
}

// --- Tag Registry Parsers ---

function parseAutoescape(tagContent, parser) {
  const setting = tagContent.slice(10).trim();
  if (setting !== 'on' && setting !== 'off') {
    throw new Error(`Invalid autoescape setting: '${setting}'`);
  }

  const body = parser.parse(['endautoescape']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endautoescape') {
    parser.advance();
  }

  return new AutoescapeNode(setting, body);
}

function parseIf(tagContent, parser) {
  // Extract the condition after the initial 'if'
  const conditionStr = tagContent.slice(2).trim();
  // Parse the body until an elif, else, or endif tag
  const body = parser.parse(['elif', 'else', 'endif']);

  const elifBranches = [];
  let elseBody = null;

  while (true) {
    const next = parser.peek();
    if (!next || next.type !== 'block') break;
    const tagName = next.content.split(/\s+/)[0];
    if (tagName === 'elif') {
      parser.advance(); // consume 'elif' token
      const branchCond = next.content.slice(4).trim();
      const branchBody = parser.parse(['elif', 'else', 'endif']);
      elifBranches.push({ conditionStr: branchCond, body: branchBody });
    } else if (tagName === 'else') {
      parser.advance(); // consume 'else'
      elseBody = parser.parse(['endif']);
    } else if (tagName === 'endif') {
      parser.advance(); // consume endif and exit
      break;
    } else {
      // Unexpected token, break to avoid infinite loop
      break;
    }
  }

  return new IfNode(conditionStr, body, elifBranches, elseBody);
}
function parseFor(tagContent, parser) {
  // tagContent: "for item in items" or "for k, v in items"
  const match = tagContent.match(/^for\s+(.+?)\s+in\s+(.+)$/);
  if (!match) {
    throw new Error(`Invalid for tag format: '${tagContent}'`);
  }

  const loopVars = match[1].split(',').map(s => s.trim()).filter(Boolean);
  const iterablePath = match[2].trim();

  const body = parser.parse(['empty', 'endfor']);
  let emptyBody = null;

  let next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'empty') {
    parser.advance(); // Consume empty
    emptyBody = parser.parse(['endfor']);
  }

  next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endfor') {
    parser.advance(); // Consume endfor
  }

  return new ForNode(loopVars, iterablePath, body, emptyBody);
}

function parseWith(tagContent, parser) {
  // tagContent can be:
  // "with val1=var1 val2=var2" OR "with var1 as val1"
  const mappings = [];
  const content = tagContent.slice(4).trim();

  if (content.includes(' as ')) {
    const parts = content.split(/\s+as\s+/);
    if (parts.length === 2) {
      mappings.push({ name: parts[1].trim(), valPath: parts[0].trim() });
    }
  } else {
    // E.g., `val1=var1 val2=var2`
    // Splitting by spaces, but avoiding splitting inside quotes if present
    const pairRegex = /(\w+)=([^\s]+)/g;
    let match;
    while ((match = pairRegex.exec(content)) !== null) {
      mappings.push({ name: match[1], valPath: match[2] });
    }
  }

  const body = parser.parse(['endwith']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endwith') {
    parser.advance(); // Consume endwith
  }

  return new WithNode(mappings, body);
}

function parseCycle(tagContent, parser) {
  // tagContent: "cycle 'row1' 'row2'" or "cycle 'row1' 'row2' as myvar"
  const parts = [];
  const content = tagContent.slice(5).trim();
  
  // Regex to extract arguments, supporting single/double quotes or unquoted variables
  const argRegex = /(".*?"|'.*?'|[^\s]+)/g;
  const matches = content.match(argRegex) || [];
  
  let asName = null;
  const args = [];

  for (let i = 0; i < matches.length; i++) {
    if (matches[i] === 'as' && i < matches.length - 1) {
      asName = matches[i + 1];
      break;
    }
    args.push(matches[i]);
  }

  return new CycleNode(args, asName);
}

module.exports = {
  IfNode,
  ForNode,
  WithNode,
  CycleNode,
  parsers: {
    if: parseIf,
    for: parseFor,
    with: parseWith,
    cycle: parseCycle,
    autoescape: parseAutoescape,
    partialdef: parsePartialDef,
    partial: parsePartial
  }
};
