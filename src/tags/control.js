/**
 * Control flow template tags: if, for, with, cycle, comment, with, firstof.
 */
const { parseVariableExpression } = require('../parser');

/**
 * Helper to parse a string into an array of tokens.
 * Handles quoted strings, operators, and identifiers.
 */
function tokenizeExpr(exprStr) {
  const tokens = [];
  let i = 0;
  const len = exprStr.length;

  while (i < len) {
    const ch = exprStr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '"' || ch === '\'') {
      const quote = ch;
      let str = '';
      i++;
      while (i < len && exprStr[i] !== quote) {
        if (exprStr[i] === '\\' && i + 1 < len) {
          i++;
        }
        str += exprStr[i];
        i++;
      }
      i++;
      tokens.push(quote + str + quote);
      continue;
    }

    if (exprStr.slice(i, i + 7).toLowerCase() === 'not in') {
      tokens.push('not in');
      i += 7;
      continue;
    }
    if (exprStr.slice(i, i + 2).toLowerCase() === 'in') {
      tokens.push('in');
      i += 2;
      continue;
    }
    if (exprStr.slice(i, i + 3).toLowerCase() === 'and') {
      tokens.push('and');
      i += 3;
      continue;
    }
    if (exprStr.slice(i, i + 2).toLowerCase() === 'or') {
      tokens.push('or');
      i += 2;
      continue;
    }
    if (exprStr.slice(i, i + 3).toLowerCase() === 'not') {
      tokens.push('not');
      i += 3;
      continue;
    }

    if (exprStr.slice(i, i + 2) === '==') { tokens.push('=='); i += 2; continue; }
    if (exprStr.slice(i, i + 2) === '!=') { tokens.push('!='); i += 2; continue; }
    if (exprStr.slice(i, i + 2) === '<=') { tokens.push('<='); i += 2; continue; }
    if (exprStr.slice(i, i + 2) === '>=') { tokens.push('>='); i += 2; continue; }
    if (ch === '<') { tokens.push('<'); i++; continue; }
    if (ch === '>') { tokens.push('>'); i++; continue; }

    let word = '';
    while (i < len && !/[\s"'<>!=]/.test(exprStr[i])) {
      word += exprStr[i];
      i++;
    }
    if (word) tokens.push(word);
  }

  return tokens;
}

/**
 * Helper to resolve a token to its runtime value.
 */
function resolveValue(token, context) {
  if (!token) return '';
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith('\'') && token.endsWith('\''))) {
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

/**
 * Shunting-yard style expression evaluator supporting:
 * == != < <= > >= in not in and or not
 */
function evaluateCondition(exprStr, context) {
  const tokens = tokenizeExpr(exprStr);
  if (tokens.length === 0) return false;

  const ops = [];
  const vals = [];

  function applyBinaryOp(op) {
    const b = vals.pop();
    const a = vals.pop();
    let result;
    switch (op) {
    case '==': result = a == b; break;
    case '!=': result = a != b; break;
    case '<':  result = a < b;  break;
    case '<=': result = a <= b; break;
    case '>':  result = a > b;  break;
    case '>=': result = a >= b; break;
    case 'and': result = !!(a && b); break;
    case 'or':  result = !!(a || b); break;
    case 'in':    result = Array.isArray(b) || typeof b === 'string' ? b.includes(a) : false; break;
    case 'not in': result = !(Array.isArray(b) || typeof b === 'string' ? b.includes(a) : false); break;
    default: result = false;
    }
    vals.push(result);
  }

  function applyUnaryNot() {
    const a = vals.pop();
    vals.push(!a);
  }

  const precedence = { 'or': 1, 'and': 2, 'not': 3, '==': 4, '!=': 4, '<': 5, '<=': 5, '>': 5, '>=': 5, 'in': 6, 'not in': 6 };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === 'not') {
      if (tokens[i + 1] === 'not' || ['and', 'or', '==', '!=', '<', '<=', '>', '>=', 'in', 'not in', '==='].includes(tokens[i + 1])) {
        ops.push('not');
      } else {
        ops.push('not');
      }
      continue;
    }

    if (['and', 'or', '==', '!=', '<', '<=', '>', '>=', 'in', 'not in'].includes(t)) {
      while (ops.length > 0 && ops[ops.length - 1] !== 'not' && precedence[ops[ops.length - 1]] <= precedence[t]) {
        if (ops[ops.length - 1] === 'not') {
          applyUnaryNot();
          ops.pop();
        } else {
          applyBinaryOp(ops.pop());
        }
      }
      ops.push(t);
      continue;
    }

    vals.push(resolveValue(t, context));
  }

  while (ops.length > 0) {
    const op = ops.pop();
    if (op === 'not') {
      applyUnaryNot();
    } else {
      applyBinaryOp(op);
    }
  }

  return vals.length > 0 ? !!vals[0] : false;
}

class IfNode {
  constructor(conditionStr, body, elifBranches, elseBody) {
    this.conditionStr = conditionStr;
    this.body = body;
    this.elifBranches = elifBranches;
    this.elseBody = elseBody;
  }

  render(context) {
    if (evaluateCondition(this.conditionStr, context)) {
      return this.body.map(n => n.render(context)).join('');
    }
    for (const branch of this.elifBranches) {
      if (evaluateCondition(branch.conditionStr, context)) {
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
  constructor(loopVars, iterablePath, body, emptyBody, filters = []) {
    this.loopVars = loopVars;
    this.iterablePath = iterablePath;
    this.filters = filters;
    this.body = body;
    this.emptyBody = emptyBody;
  }

  render(context) {
    let rawItems = context.get(this.iterablePath);

    // Apply any filters on the iterable path (e.g. items|regroup:"category")
    const { getFilter } = require('../filters');
    for (const filterInfo of this.filters) {
      const filterFn = getFilter(filterInfo.name);
      if (!filterFn) {
        throw new Error(`Unknown filter: '${filterInfo.name}'`);
      }
      let argVal = undefined;
      if (filterInfo.arg) {
        if (filterInfo.arg.type === 'literal') {
          argVal = filterInfo.arg.value;
        } else if (filterInfo.arg.type === 'variable') {
          argVal = context.get(filterInfo.arg.value);
        }
      }
      rawItems = filterFn(rawItems, argVal);
    }

    let items = [];

    if (Array.isArray(rawItems)) {
      items = rawItems.map(item => [null, item]);
    } else if (rawItems && typeof rawItems === 'object' && !(rawItems instanceof Date)) {
      Object.entries(rawItems).forEach(([key, val]) => {
        items.push([key, val]);
      });
    }

    if (items.length === 0) {
      return this.emptyBody ? this.emptyBody.map(n => n.render(context)).join('') : '';
    }

    let output = '';
    const length = items.length;
    const parentLoop = context.get('forloop');
    const parentLoopObj = (parentLoop && typeof parentLoop === 'object' && parentLoop !== '') ? parentLoop : null;

    for (let i = 0; i < length; i++) {
      const [key, val] = items[i];

      const forloop = {
        counter: i + 1,
        counter0: i,
        revcounter: length - i,
        revcounter0: length - i - 1,
        first: i === 0,
        last: i === length - 1,
        parentloop: parentLoopObj
      };

      const loopContext = { forloop };

      if (this.loopVars.length === 1) {
        loopContext[this.loopVars[0]] = val;
      } else if (this.loopVars.length === 2) {
        loopContext[this.loopVars[0]] = key;
        loopContext[this.loopVars[1]] = val;
      } else {
        loopContext[this.loopVars[0]] = [key, val];
      }

      context.push(loopContext);
      output += this.body.map(n => n.render(context)).join('');
      context.pop();
    }

    return output;
  }
}

class WithNode {
  constructor(mappings, body, aliasName = null) {
    this.mappings = mappings;
    this.body = body;
    this.aliasName = aliasName;
  }

  render(context) {
    const scope = {};
    for (const mapping of this.mappings) {
      // The valPath may be a literal string (e.g. "Hello" with quotes) or
      // a variable lookup (e.g. user.name). Parse quotes here.
      const raw = mapping.valPath;
      let value;
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))) {
        value = raw.slice(1, -1);
      } else if (raw === 'true' || raw === 'True') {
        value = true;
      } else if (raw === 'false' || raw === 'False') {
        value = false;
      } else if (raw === 'none' || raw === 'None' || raw === 'null') {
        value = null;
      } else if (raw !== '' && !isNaN(Number(raw))) {
        value = Number(raw);
      } else {
        value = context.get(raw);
      }
      scope[mapping.name] = value;
    }
    // If an `as alias` was used after key=value pairs, alias the last
    // key to the alias name. This supports `{% with a=5 as answ %}` →
    // `answ` holds the same value as `a`.
    if (this.aliasName && this.mappings.length > 0) {
      const last = this.mappings[this.mappings.length - 1];
      scope[this.aliasName] = scope[last.name];
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
    const val = resolveValue(token, context);
    context.cycleStates.set(key, idx + 1);

    if (this.asName) {
      context.scopes[0][this.asName] = val;
      // Django semantics: {% cycle "x" "y" as v %} produces NO output;
      // the value is stored in `v` for later use (e.g. {{ v }}).
      return '';
    }
    return String(val);
  }
}

class FirstofNode {
  constructor(args) {
    this.args = args;
  }

  render(context) {
    for (const arg of this.args) {
      const val = resolveValue(arg, context);
      if (val && val !== '' && val !== null && val !== undefined) {
        return String(val);
      }
    }
    return '';
  }
}

class CommentNode {
  constructor(body) {
    this.body = body;
  }

  render(_context) {
    return '';
  }
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

/* --- Partial definition support --- */

class PartialDefNode {
  constructor(name, body, inline = false) {
    this.name = name;
    this.body = body;
    this.inline = inline;
  }

  render(context) {
    context.registerPartial(this.name, this);
    if (this.inline) {
      return this.body.map(n => n.render(context)).join('');
    }
    return '';
  }
}

class PartialNode {
  constructor(name, extraMappings = []) {
    this.name = name;
    this.extraMappings = extraMappings;
  }

  render(context) {
    const partial = context.getPartial(this.name);
    if (!partial) {
      throw new Error(`Partial '${this.name}' not found`);
    }
    // If the partial reference provided `with k=v ...`, push those
    // values onto the scope before rendering the partial body so the
    // body sees the overrides.
    if (this.extraMappings && this.extraMappings.length > 0) {
      const scope = {};
      for (const m of this.extraMappings) {
        const raw = m.valPath;
        let value;
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))) {
          value = raw.slice(1, -1);
        } else if (raw === 'true' || raw === 'True') {
          value = true;
        } else if (raw === 'false' || raw === 'False') {
          value = false;
        } else if (raw === 'none' || raw === 'None' || raw === 'null') {
          value = null;
        } else if (raw !== '' && !isNaN(Number(raw))) {
          value = Number(raw);
        } else {
          value = context.get(raw);
        }
        scope[m.name] = value;
      }
      context.push(scope);
      const out = partial.body.map(n => n.render(context)).join('');
      context.pop();
      return out;
    }
    return partial.body.map(n => n.render(context)).join('');
  }
}

function parsePartialDef(tagContent, parser) {
  const content = tagContent.slice(10).trim();
  const nameMatch = content.match(/^(".*?"|'.*?'|\S+)/);
  if (!nameMatch) {
    throw new Error('partialdef tag requires a name');
  }
  let name = nameMatch[1];
  if ((name.startsWith('"') && name.endsWith('"')) || (name.startsWith('\'') && name.endsWith('\''))) {
    name = name.slice(1, -1);
  }
  // Recognize `inline` or `inline=true` as a keyword (case-insensitive)
  const inline = /\binline\b/.test(content);
  const body = parser.parse(['endpartialdef']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endpartialdef') {
    parser.advance();
  }
  return new PartialDefNode(name, body, inline);
}

function parsePartial(tagContent, _parser) {
  // {% partial "name" %}
  // {% partial "name" with k1=v1 k2=v2 %}
  const content = tagContent.slice(7).trim();
  const nameMatch = content.match(/^(".*?"|'.*?'|\S+)/);
  if (!nameMatch) {
    throw new Error('partial tag requires a name');
  }
  let name = nameMatch[1];
  if ((name.startsWith('"') && name.endsWith('"')) || (name.startsWith('\'') && name.endsWith('\''))) {
    name = name.slice(1, -1);
  }

  // Optional `with k=v k=v` clause
  let extraMappings = [];
  const remaining = content.slice(nameMatch[0].length).trim();
  const withMatch = remaining.match(/^with\s+(.+)$/s);
  if (withMatch) {
    extraMappings = parseKeyValuePairs(withMatch[1]);
  }

  return new PartialNode(name, extraMappings);
}

/* --- Tag Registry Parsers --- */

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

function parseComment(tagContent, parser) {
  const body = parser.parse(['endcomment']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endcomment') {
    parser.advance();
  }
  return new CommentNode(body);
}

function parseIf(tagContent, parser) {
  const conditionStr = tagContent.slice(2).trim();
  const body = parser.parse(['elif', 'else', 'endif']);
  const elifBranches = [];
  let elseBody = null;

  while (true) {
    const next = parser.peek();
    if (!next || next.type !== 'block') break;
    const tagName = next.content.split(/\s+/)[0];
    if (tagName === 'elif') {
      parser.advance();
      const branchCond = next.content.slice(4).trim();
      const branchBody = parser.parse(['elif', 'else', 'endif']);
      elifBranches.push({ conditionStr: branchCond, body: branchBody });
    } else if (tagName === 'else') {
      parser.advance();
      elseBody = parser.parse(['endif']);
    } else if (tagName === 'endif') {
      parser.advance();
      break;
    } else {
      break;
    }
  }

  // Validate that the if block was properly closed
  // (for/with/endfor etc already consume their own closing tags)
  // Note: parseIf is called via parser.parse() which already stopped at elif/else/endif
  // If we reach here and the next block is not an endif, the if is unclosed

  return new IfNode(conditionStr, body, elifBranches, elseBody);
}

function parseFor(tagContent, parser) {
  const match = tagContent.match(/^for\s+(.+?)\s+in\s+(.+)$/);
  if (!match) {
    throw new Error(`Invalid for tag format: '${tagContent}'`);
  }
  const loopVars = match[1].split(',').map(s => s.trim()).filter(Boolean);
  const iterableExpr = match[2].trim();
  const body = parser.parse(['empty', 'endfor']);
  let emptyBody = null;

  let next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'empty') {
    parser.advance();
    emptyBody = parser.parse(['endfor']);
  }

  next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endfor') {
    parser.advance();
  }

  // Parse the iterable expression to support filters: items|regroup:"category"
  const parsedIterable = parseVariableExpression(iterableExpr);
  return new ForNode(loopVars, parsedIterable.varPath, body, emptyBody, parsedIterable.filters);
}

function parseWith(tagContent, parser) {
  const mappings = [];
  const content = tagContent.slice(4).trim();
  let aliasName = null;

  // Support three forms (matching Django plus common extensions):
  //   1. {% with x as y %}        — alias a single expression
  //   2. {% with a=1, b=2 %}       — bind multiple key=value pairs
  //   3. {% with a=1, b=2 as ans %} — bind pairs then alias the last
  //      (the `as` introduces an extra alias for the last key)
  if (content.includes(' as ')) {
    const asIdx = content.indexOf(' as ');
    const left = content.slice(0, asIdx).trim();
    aliasName = content.slice(asIdx + 4).trim();
    if (left.includes('=')) {
      // Form 3: pairs followed by `as alias`
      const pairMappings = parseKeyValuePairs(left);
      mappings.push(...pairMappings);
    } else {
      // Form 1: simple alias — left is an expression (literal or var)
      mappings.push({ name: aliasName, valPath: left });
      aliasName = null; // already used as the mapping name
    }
  } else {
    // Form 2: key=value pairs only
    const pairMappings = parseKeyValuePairs(content);
    mappings.push(...pairMappings);
  }

  const body = parser.parse(['endwith']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endwith') {
    parser.advance();
  }

  return new WithNode(mappings, body, aliasName);
}

/**
 * Parse a comma-separated list of `key=value` pairs. Values may be
 * quoted (single or double quotes) and may contain commas. Unquoted
 * values are read up to the next comma or whitespace.
 */
function parseKeyValuePairs(content) {
  const tokens = [];
  let i = 0;
  while (i < content.length) {
    while (i < content.length && /\s/.test(content[i])) i++;
    if (i >= content.length) break;

    // Read identifier (key)
    let key = '';
    while (i < content.length && /[a-zA-Z0-9_]/.test(content[i])) {
      key += content[i++];
    }
    if (!key) {
      // Not a key — skip a char to avoid infinite loop
      i++;
      continue;
    }
    while (i < content.length && /\s/.test(content[i])) i++;

    if (content[i] !== '=') {
      // Malformed pair; skip to next comma
      while (i < content.length && content[i] !== ',') i++;
      if (content[i] === ',') i++;
      continue;
    }
    i++; // consume '='
    while (i < content.length && /\s/.test(content[i])) i++;

    let val = '';
    if (content[i] === '"' || content[i] === '\'') {
      const quote = content[i++];
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\' && i + 1 < content.length) i++;
        val += content[i++];
      }
      if (content[i] === quote) i++;
      // Keep the quotes around the literal so WithNode can recognize it
      val = quote + val + quote;
    } else {
      while (i < content.length && content[i] !== ',' && !/\s/.test(content[i])) {
        val += content[i++];
      }
    }
    tokens.push({ name: key, valPath: val });
    while (i < content.length && /\s/.test(content[i])) i++;
    if (content[i] === ',') i++;
  }
  return tokens;
}

function parseCycle(tagContent, _parser) {
  const content = tagContent.slice(5).trim();
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

function parseFirstof(tagContent, _parser) {
  const content = tagContent.slice(8).trim();
  const argRegex = /(".*?"|'.*?'|[^\s]+)/g;
  const args = (content.match(argRegex) || []).map(a => a.trim()).filter(Boolean);
  return new FirstofNode(args);
}

module.exports = {
  IfNode,
  ForNode,
  WithNode,
  CycleNode,
  FirstofNode,
  CommentNode,
  AutoescapeNode,
  PartialDefNode,
  PartialNode,
  evaluateCondition,
  parsers: {
    if: parseIf,
    for: parseFor,
    with: parseWith,
    cycle: parseCycle,
    autoescape: parseAutoescape,
    comment: parseComment,
    partialdef: parsePartialDef,
    partial: parsePartial,
    firstof: parseFirstof
  }
};