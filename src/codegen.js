/**
 * High-performance codegen — generates native JavaScript compilation functions.
 *
 * Strategy: Translate 100% of template AST nodes and condition expressions
 * directly into native JS code executed by V8 at full machine speed.
 */
const filtersModule = require('./filters');
const { SafeString } = require('./security');
const { tokenizeExpr } = require('./tags/control');

function js(v) {
  if (v === null) return 'null';
  if (v === undefined) return 'void 0';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return '[' + v.map(js).join(',') + ']';
  if (typeof v === 'object') return JSON.stringify(v);
  return JSON.stringify(String(v));
}

function pad(s, level) {
  return '  '.repeat(level) + s;
}

function compileExprToJs(conditionStr, loopVarMap = {}) {
  if (!conditionStr || !conditionStr.trim()) return 'false';
  const tokens = tokenizeExpr(conditionStr);
  if (tokens.length === 0) return 'false';

  const ops = [];
  const vals = [];  function compileValue(t) {
    if (!t) return '""';
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('\'') && t.endsWith('\''))) {
      return js(t.slice(1, -1));
    }
    if (t === 'true' || t === 'True') return 'true';
    if (t === 'false' || t === 'False') return 'false';
    if (t === 'none' || t === 'None' || t === 'null') return 'null';
    if (/^-?\d+(\.\d+)?$/.test(t)) return String(Number(t));
    if (loopVarMap && loopVarMap[t]) return loopVarMap[t];
    return `_get(_ctx, ${js(t)})`;
  }

  function applyBinaryOp(op) {
    const b = vals.pop();
    const a = vals.pop();
    switch (op) {
    case '==': vals.push(`(${a} == ${b})`); break;
    case '!=': vals.push(`(${a} != ${b})`); break;
    case '<':  vals.push(`(${a} < ${b})`); break;
    case '<=': vals.push(`(${a} <= ${b})`); break;
    case '>':  vals.push(`(${a} > ${b})`); break;
    case '>=': vals.push(`(${a} >= ${b})`); break;
    case '%':  vals.push(`(${a} % ${b})`); break;
    case '*':  vals.push(`(${a} * ${b})`); break;
    case '/':  vals.push(`(${a} / ${b})`); break;
    case '+':  vals.push(`(${a} + ${b})`); break;
    case '-':  vals.push(`(${a} - ${b})`); break;
    case 'and': vals.push(`(${a} && ${b})`); break;
    case 'or':  vals.push(`(${a} || ${b})`); break;
    case 'in': vals.push(`_in(${a}, ${b})`); break;
    case 'not in': vals.push(`(!_in(${a}, ${b}))`); break;
    default: vals.push('false');
    }
  }

  function applyUnaryNot() {
    const a = vals.pop();
    vals.push(`(!${a})`);
  }

  const prec = {
    'or': 1,
    'and': 2,
    '==': 4,
    '!=': 4,
    '<': 5,
    '<=': 5,
    '>': 5,
    '>=': 5,
    '+': 6,
    '-': 6,
    '%': 7,
    '*': 7,
    '/': 7,
    'in': 8,
    'not in': 8
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'not') {
      ops.push('not');
    } else if (['and', 'or', '==', '!=', '<', '<=', '>', '>=', '%', '*', '/', '+', '-', 'in', 'not in'].includes(t)) {
      while (ops.length > 0 && ops[ops.length - 1] !== 'not' && prec[ops[ops.length - 1]] >= prec[t]) {
        applyBinaryOp(ops.pop());
      }
      ops.push(t);
    } else {
      vals.push(compileValue(t));
    }
  }

  while (ops.length > 0) {
    const op = ops.pop();
    if (op === 'not') applyUnaryNot();
    else applyBinaryOp(op);
  }

  return vals.length > 0 ? vals[0] : 'false';
}

function hasForloopRef(nodes) {
  if (!nodes) return false;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    const name = n.constructor ? n.constructor.name : '';
    if (name === 'VariableNode' && n.varPath && n.varPath.startsWith('forloop')) return true;
    if (name === 'IfNode') {
      if (n.conditionStr && n.conditionStr.includes('forloop')) return true;
    }
    if (n.body && hasForloopRef(n.body)) return true;
    if (n.elseBody && hasForloopRef(n.elseBody)) return true;
    if (n.emptyBody && hasForloopRef(n.emptyBody)) return true;
    if (n.elifBranches) {
      for (let j = 0; j < n.elifBranches.length; j++) {
        if (n.elifBranches[j].conditionStr && n.elifBranches[j].conditionStr.includes('forloop')) return true;
        if (hasForloopRef(n.elifBranches[j].body)) return true;
      }
    }
  }
  return false;
}

function genNodes(nodes, stmts, level, buf = 'out', loopVarMap = {}) {
  for (let i = 0; i < nodes.length; i++) genNode(nodes[i], stmts, level, buf, loopVarMap);
}

function genNode(node, stmts, level, buf = 'out', loopVarMap = {}) {
  if (!node) return;
  const name = node.constructor.name;
  switch (name) {
  case 'TextNode':
    if (node.content) stmts.push(pad(`${buf} += ${js(node.content)};`, level));
    return;

  case 'VariableNode': {
    let expr;
    if (node.isLiteral) {
      expr = js(node.literalValue);
    } else if (loopVarMap && loopVarMap[node.varPath]) {
      expr = loopVarMap[node.varPath];
    } else {
      expr = `_get(_ctx, ${js(node.varPath)})`;
    }
    for (let i = 0; i < node.filters.length; i++) {
      const f = node.filters[i];
      let arg = 'void 0';
      if (f.arg) {
        if (f.arg.type === 'literal') arg = js(f.arg.value);
        else if (loopVarMap && loopVarMap[f.arg.value]) arg = loopVarMap[f.arg.value];
        else arg = `_get(_ctx, ${js(f.arg.value)})`;
      }
      if (f.name === 'upper' && (arg === 'void 0' || !arg)) {
        expr = `(typeof ${expr} === 'string' ? ${expr}.toUpperCase() : String(${expr} == null ? '' : ${expr}).toUpperCase())`;
      } else if (f.name === 'lower' && (arg === 'void 0' || !arg)) {
        expr = `(typeof ${expr} === 'string' ? ${expr}.toLowerCase() : String(${expr} == null ? '' : ${expr}).toLowerCase())`;
      } else if (f.name === 'length' && (arg === 'void 0' || !arg)) {
        expr = `(${expr} ? (${expr}.length !== undefined ? ${expr}.length : (typeof ${expr} === 'object' ? Object.keys(${expr}).length : 0)) : 0)`;
      } else if (f.name === 'repeat' && arg !== 'void 0') {
        expr = `String(${expr} == null ? '' : ${expr}).repeat(${arg})`;
      } else {
        const fnRef = f._fnRef ? `_f_${f.name}` : '_missingFilter';
        if (f._fnRef) {
          expr = `${fnRef}(${expr}, ${arg}, _ctx)`;
        } else {
          expr = `_missingFilter('${f.name}', ${expr}, ${arg}, _ctx)`;
        }
      }
    }
    const vName = `_v${node._id}`;
    if (node.isLiteral && node.filters.length === 0) {
      stmts.push(pad(`${buf} += ((${expr}) == null ? '' : String(${expr}));`, level));
      return;
    }
    stmts.push(pad(`const ${vName} = ${expr};`, level));
    stmts.push(pad(`if (typeof ${vName} === 'number') ${buf} += ${vName}; else if (typeof ${vName} === 'string') ${buf} += (a ? _escapeStr(${vName}) : ${vName}); else if (${vName} != null) ${buf} += (typeof ${vName} === 'function' ? ${vName}() : (a && !(${vName} instanceof _SafeString) ? _escape(${vName}) : ${vName}));`, level));
    return;
  }

  case 'IfNode': {
    const condJs = compileExprToJs(node.conditionStr, loopVarMap);
    stmts.push(pad(`if (${condJs}) {`, level));
    genNodes(node.body, stmts, level + 1, buf, loopVarMap);
    stmts.push(pad('}', level));
    for (let i = 0; i < node.elifBranches.length; i++) {
      const b = node.elifBranches[i];
      const elifJs = compileExprToJs(b.conditionStr, loopVarMap);
      stmts.push(pad(`else if (${elifJs}) {`, level));
      genNodes(b.body, stmts, level + 1, buf, loopVarMap);
      stmts.push(pad('}', level));
    }
    if (node.elseBody) {
      stmts.push(pad('else {', level));
      genNodes(node.elseBody, stmts, level + 1, buf, loopVarMap);
      stmts.push(pad('}', level));
    }
    return;
  }

  case 'ForNode': {
    const s = '_' + level;
    stmts.push(pad('{', level));
    const iterExpr = node.isLiteral ? js(node.literalValue) : ((loopVarMap && loopVarMap[node.iterablePath]) ? loopVarMap[node.iterablePath] : `_get(_ctx, ${js(node.iterablePath)})`);
    stmts.push(pad(`let _raw${s} = ${iterExpr};`, level + 1));
    for (let i = 0; i < node.filters.length; i++) {
      const f = node.filters[i];
      let arg = 'void 0';
      if (f.arg) {
        if (f.arg.type === 'literal') arg = js(f.arg.value);
        else arg = (loopVarMap && loopVarMap[f.arg.value]) ? loopVarMap[f.arg.value] : `_get(_ctx, ${js(f.arg.value)})`;
      }
      const fnRef = f._fnRef ? `_f_${f.name}` : '_missingFilter';
      if (f._fnRef) {
        stmts.push(pad(`_raw${s} = ${fnRef}(_raw${s}, ${arg}, _ctx);`, level + 1));
      } else {
        stmts.push(pad(`_raw${s} = _missingFilter('${f.name}', _raw${s}, ${arg}, _ctx);`, level + 1));
      }
    }

    const needForloop = hasForloopRef(node.body);
    const loopVars = node.loopVars;
    const newLoopVarMap = Object.assign({}, loopVarMap);

    stmts.push(pad(`if (Array.isArray(_raw${s})) {`, level + 1));
    stmts.push(pad(`const _len${s} = _raw${s}.length;`, level + 2));
    stmts.push(pad(`if (_len${s} === 0) {`, level + 2));
    if (node.emptyBody) genNodes(node.emptyBody, stmts, level + 3, buf, loopVarMap);
    stmts.push(pad('} else {', level + 2));

    if (needForloop) stmts.push(pad(`const _parentLoop${s} = _get(_ctx, 'forloop');`, level + 3));
    for (let i = 0; i < loopVars.length; i++) {
      const v = loopVars[i];
      stmts.push(pad(`const _saved_${v}${s} = _ctx._local[${js(v)}];`, level + 3));
    }
    if (needForloop) stmts.push(pad(`const _saved_forloop${s} = _ctx._local.forloop;`, level + 3));

    stmts.push(pad(`for (let _i${s} = 0; _i${s} < _len${s}; _i${s}++) {`, level + 3));
    stmts.push(pad(`const _item${s} = _raw${s}[_i${s}];`, level + 4));
    if (loopVars.length === 1) {
      stmts.push(pad(`_ctx._local[${js(loopVars[0])}] = _item${s};`, level + 4));
      newLoopVarMap[loopVars[0]] = `_item${s}`;
    } else if (loopVars.length === 2) {
      stmts.push(pad(`_ctx._local[${js(loopVars[0])}] = Array.isArray(_item${s}) ? _item${s}[0] : null;`, level + 4));
      stmts.push(pad(`_ctx._local[${js(loopVars[1])}] = Array.isArray(_item${s}) ? _item${s}[1] : _item${s};`, level + 4));
      newLoopVarMap[loopVars[0]] = `(Array.isArray(_item${s}) ? _item${s}[0] : null)`;
      newLoopVarMap[loopVars[1]] = `(Array.isArray(_item${s}) ? _item${s}[1] : _item${s})`;
    }

    if (needForloop) {
      stmts.push(pad(`_ctx._local.forloop = { counter: _i${s}+1, counter0: _i${s}, revcounter: _len${s}-_i${s}, revcounter0: _len${s}-_i${s}-1, first: _i${s}===0, last: _i${s}===_len${s}-1, parentloop: _parentLoop${s} && typeof _parentLoop${s} === 'object' ? _parentLoop${s} : null };`, level + 4));
    }

    genNodes(node.body, stmts, level + 4, buf, newLoopVarMap);

    stmts.push(pad('}', level + 3));

    for (let i = 0; i < loopVars.length; i++) {
      const v = loopVars[i];
      stmts.push(pad(`_ctx._local[${js(v)}] = _saved_${v}${s};`, level + 3));
    }
    if (needForloop) stmts.push(pad(`_ctx._local.forloop = _saved_forloop${s};`, level + 3));

    stmts.push(pad('}', level + 2));

    stmts.push(pad('} else {', level + 1));
    stmts.push(pad(`const _items${s} = _normalizeFor(_raw${s});`, level + 2));
    stmts.push(pad(`if (_items${s}.length === 0) {`, level + 2));
    if (node.emptyBody) genNodes(node.emptyBody, stmts, level + 3, buf, loopVarMap);
    stmts.push(pad('} else {', level + 2));
    stmts.push(pad(`const _len${s} = _items${s}.length;`, level + 3));
    if (needForloop) stmts.push(pad(`const _parentLoop${s} = _get(_ctx, 'forloop');`, level + 3));
    for (let i = 0; i < loopVars.length; i++) {
      const v = loopVars[i];
      stmts.push(pad(`const _saved_${v}${s} = _ctx._local[${js(v)}];`, level + 3));
    }
    if (needForloop) stmts.push(pad(`const _saved_forloop${s} = _ctx._local.forloop;`, level + 3));

    stmts.push(pad(`for (let _i${s} = 0; _i${s} < _len${s}; _i${s}++) {`, level + 3));
    stmts.push(pad(`const _kv${s} = _items${s}[_i${s}];`, level + 4));
    for (let i = 0; i < loopVars.length; i++) {
      const v = loopVars[i];
      const valExpr = loopVars.length === 1 ? `_kv${s}[1]` : (i === 0 ? `_kv${s}[0]` : (i === 1 ? `_kv${s}[1]` : `[_kv${s}[0], _kv${s}[1]]`));
      stmts.push(pad(`_ctx._local[${js(v)}] = ${valExpr};`, level + 4));
      newLoopVarMap[v] = valExpr;
    }
    if (needForloop) {
      stmts.push(pad(`_ctx._local.forloop = { counter: _i${s}+1, counter0: _i${s}, revcounter: _len${s}-_i${s}, revcounter0: _len${s}-_i${s}-1, first: _i${s}===0, last: _i${s}===_len${s}-1, parentloop: _parentLoop${s} && typeof _parentLoop${s} === 'object' ? _parentLoop${s} : null };`, level + 4));
    }
    genNodes(node.body, stmts, level + 4, buf, newLoopVarMap);

    stmts.push(pad('}', level + 3));

    for (let i = 0; i < loopVars.length; i++) {
      const v = loopVars[i];
      stmts.push(pad(`_ctx._local[${js(v)}] = _saved_${v}${s};`, level + 3));
    }
    if (needForloop) stmts.push(pad(`_ctx._local.forloop = _saved_forloop${s};`, level + 3));

    stmts.push(pad('}', level + 2));
    stmts.push(pad('}', level + 1));
    stmts.push(pad('}', level));
    return;
  }

  case 'WithNode': {
    stmts.push(pad('{', level));
    stmts.push(pad('const _scope = {};', level + 1));
    const savedKeys = [];
    for (let i = 0; i < node.mappings.length; i++) {
      const m = node.mappings[i];
      stmts.push(pad(`_scope[${js(m.name)}] = _resolveVal(${js(m.valPath)}, _ctx);`, level + 1));
      savedKeys.push(m.name);
    }
    if (node.aliasName && node.mappings.length > 0) {
      const last = node.mappings[node.mappings.length - 1];
      stmts.push(pad(`_scope[${js(node.aliasName)}] = _scope[${js(last.name)}];`, level + 1));
      savedKeys.push(node.aliasName);
    }
    for (let i = 0; i < savedKeys.length; i++) {
      stmts.push(pad(`const _saved_${savedKeys[i]} = _ctx._local[${js(savedKeys[i])}];`, level + 1));
    }
    for (let i = 0; i < savedKeys.length; i++) {
      stmts.push(pad(`_ctx._local[${js(savedKeys[i])}] = _scope[${js(savedKeys[i])}];`, level + 1));
    }
    genNodes(node.body, stmts, level + 1, buf, loopVarMap);
    for (let i = 0; i < savedKeys.length; i++) {
      stmts.push(pad(`_ctx._local[${js(savedKeys[i])}] = _saved_${savedKeys[i]};`, level + 1));
    }
    stmts.push(pad('}', level));
    return;
  }

  case 'CommentNode':
    return;

  case 'AutoescapeNode': {
    stmts.push(pad('{', level));
    stmts.push(pad(`const _ae = a; a = ${node.setting === 'on' ? 'true' : 'false'};`, level + 1));
    genNodes(node.body, stmts, level + 1, buf, loopVarMap);
    stmts.push(pad('a = _ae;', level + 1));
    stmts.push(pad('}', level));
    return;
  }

  case 'CycleNode':
    stmts.push(pad(`${buf} += _cycle(_ctx, ${js(node.args)}, ${js(node.asName)});`, level));
    return;

  case 'FirstofNode':
    stmts.push(pad(`${buf} += _firstof(_ctx, ${js(node.args)});`, level));
    return;

  case 'PartialDefNode': {
    stmts.push(pad(`_registerPartial(_ctx, ${js(node.name)}, _partials[${node._partialId}]);`, level));
    if (node.inline) {
      stmts.push(pad('{', level));
      genNodes(node.body, stmts, level + 1, buf, loopVarMap);
      stmts.push(pad('}', level));
    }
    return;
  }

  case 'PartialNode': {
    stmts.push(pad(`${buf} += _partial(_ctx, ${js(node.name)}, ${js(node.extraMappings)});`, level));
    return;
  }

  case 'StaticNode':
    stmts.push(pad(`${buf} += _static(_ctx, ${js(node.pathExpr)});`, level));
    return;

  case 'UrlNode':
    stmts.push(pad(`${buf} += _url(_ctx, ${js(node.routeNameExpr)}, ${js(node.positionalArgs)}, ${js(node.kwargs)});`, level));
    return;

  case 'RegroupNode':
    stmts.push(pad(`${buf} += _regroup(_ctx, ${js(node.listPath)}, ${js(node.attr)}, ${js(node.targetName)});`, level));
    return;

  case 'SpacelessNode': {
    stmts.push(pad('{', level));
    stmts.push(pad('let _spaceBuf = \'\';', level + 1));
    genNodes(node.body, stmts, level + 1, '_spaceBuf', loopVarMap);
    stmts.push(pad(`${buf} += _spaceBuf.replace(/>\\s+</g, '><'); }`, level));
    return;
  }

  case 'CsrfTokenNode':
    stmts.push(pad(`${buf} += _csrf(_ctx);`, level));
    return;

  case 'CspNonceAttrNode':
    stmts.push(pad(`${buf} += _csp_nonce(_ctx);`, level));
    return;

  case 'LoadNode':
    stmts.push(pad(`_loadLibs(_ctx, ${js(node.libraries)});`, level));
    return;

  case 'TemplatetagNode': {
    const map = {
      'openblock': '{%',
      'closeblock': '%}',
      'openvariable': '{{',
      'closevariable': '}}',
      'openbrace': '{',
      'closebrace': '}',
      'opencomment': '{#',
      'closecomment': '#}'
    };
    const tokenStr = map[node.token] || node.token;
    stmts.push(pad(`${buf} += ${js(tokenStr)};`, level));
    return;
  }

  case 'WidthRatioNode': {
    const out = String(Math.max(0, Math.min(Math.floor((node.value / node.maxValue) * node.maxWidth), node.maxWidth)));
    stmts.push(pad(`${buf} += ${js(out)};`, level));
    return;
  }

  case 'DebugNode':
    stmts.push(pad(`${buf} += _debug(_ctx);`, level));
    return;

  case 'NowNode':
    stmts.push(pad(`${buf} += _now(_ctx, ${js(node.formatExpr)});`, level));
    return;

  case 'SetNode': {
    const valExpr = node.valueExpr !== undefined ? `_resolveVal(${js(node.valueExpr)}, _ctx)` : '\'\'';
    stmts.push(pad(`_ctx._local[${js(node.nameExpr)}] = ${valExpr};`, level));
    if (node.body && node.body.length) genNodes(node.body, stmts, level, buf, loopVarMap);
    return;
  }

  case 'IfChangedNode': {
    stmts.push(pad('{', level));
    stmts.push(pad('if (!_ctx.ifChangedState) _ctx.ifChangedState = new Map();', level + 1));
    stmts.push(pad(`const _cur = _resolveVal(${js(node.conditionStr)}, _ctx);`, level + 1));
    stmts.push(pad(`const _last = _ctx.ifChangedState.get(${js(node.conditionStr)});`, level + 1));
    stmts.push(pad('if (_last === undefined || _cur !== _last) {', level + 1));
    stmts.push(pad(`_ctx.ifChangedState.set(${js(node.conditionStr)}, _cur);`, level + 2));
    stmts.push(pad('let _subBuf = \'\';', level + 2));
    genNodes(node.body, stmts, level + 3, '_subBuf', loopVarMap);
    stmts.push(pad(`${buf} += _subBuf; }`, level + 2));
    if (node.elseBody) {
      stmts.push(pad('else {', level + 1));
      stmts.push(pad('let _subBuf2 = \'\';', level + 2));
      genNodes(node.elseBody, stmts, level + 3, '_subBuf2', loopVarMap);
      stmts.push(pad(`${buf} += _subBuf2; }`, level + 2));
    }
    stmts.push(pad('}', level + 1));
    return;
  }

  case 'TransNode':
    stmts.push(pad(`${buf} += _trans(_ctx, ${js(node.key)}, ${js(node.args)});`, level));
    return;

  case 'BlockTransNode':
    stmts.push(pad(`${buf} += _blocktrans(_ctx, ${js(node.textParts)}, ${js(node.withMappings)}, ${js(node.pluralMappings)});`, level));
    return;

  case 'LanguageNode':
    stmts.push(pad(`${buf} += _language(_ctx, ${js(node.lang)}, _languages[${node._langId}]);`, level));
    return;

  case 'HelperNode': {
    stmts.push(pad(`${buf} += _astNodes[${node._id}].render(_ctx);`, level));
    return;
  }

  case 'PluralMappingNode':
    return;

  case 'ExtendsNode':
    stmts.push(pad(`${buf} += _extends(_ctx, ${js(node.parentTemplateExpr)});`, level));
    return;

  case 'BlockNode':
    stmts.push(pad(`${buf} += _block(_ctx, ${js(node.name)});`, level));
    return;

  case 'IncludeNode':
    stmts.push(pad(`${buf} += _include(_ctx, ${js(node.templateNameExpr)}, ${js(node.extraMappings)}, ${js(node.partialName)});`, level));
    return;

  default:
    stmts.push(pad(`${buf} += _fallback(_ctx, _astNodes[${node._id}]);`, level));
  }
}

function preResolveFilters(nodes) {
  function walk(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (n.filters) {
        for (let j = 0; j < n.filters.length; j++) {
          const fn = filtersModule.getFilter(n.filters[j].name);
          if (fn) {
            n.filters[j]._fnRef = `_f_${n.filters[j].name}`;
            n.filters[j]._fn = fn;
          }
        }
      }
      if (n.body) walk(n.body);
      if (n.elseBody) walk(n.elseBody);
      if (n.elifBranches) for (let j = 0; j < n.elifBranches.length; j++) walk(n.elifBranches[j].body);
    }
  }
  walk(nodes);
}

function collectFilterNames(nodes) {
  const names = new Set();
  function walk(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (n.filters) {
        for (let j = 0; j < n.filters.length; j++) {
          if (n.filters[j]._fnRef) names.add(n.filters[j].name);
        }
      }
      if (n.body) walk(n.body);
      if (n.elseBody) walk(n.elseBody);
      if (n.elifBranches) for (let j = 0; j < n.elifBranches.length; j++) walk(n.elifBranches[j].body);
    }
  }
  walk(nodes);
  return Array.from(names);
}

function canCodegen(_nodes) {
  return true;
}

function tagNodes(nodes) {
  let nextId = 0;
  function walk(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      list[i]._id = nextId++;
      if (list[i].body) walk(list[i].body);
      if (list[i].elseBody) walk(list[i].elseBody);
      if (list[i].elifBranches) for (let j = 0; j < list[i].elifBranches.length; j++) walk(list[i].elifBranches[j].body);
    }
  }
  walk(nodes);
}

function tagPartialNodes(nodes) {
  let nextId = 0;
  function walk(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      if (list[i].constructor.name === 'PartialDefNode') {
        list[i]._partialId = nextId++;
      }
      if (list[i].body) walk(list[i].body);
      if (list[i].elseBody) walk(list[i].elseBody);
      if (list[i].elifBranches) for (let j = 0; j < list[i].elifBranches.length; j++) walk(list[i].elifBranches[j].body);
    }
  }
  walk(nodes);
}

function tagLanguageNodes(nodes) {
  let nextId = 0;
  function walk(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      if (list[i].constructor.name === 'LanguageNode') {
        list[i]._langId = nextId++;
      }
      if (list[i].body) walk(list[i].body);
      if (list[i].elseBody) walk(list[i].elseBody);
      if (list[i].elifBranches) for (let j = 0; j < list[i].elifBranches.length; j++) walk(list[i].elifBranches[j].body);
    }
  }
  walk(nodes);
}

function flattenNodes(nodes) {
  const out = [];
  function walk(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      out.push(list[i]);
      if (list[i].body) walk(list[i].body);
      if (list[i].elseBody) walk(list[i].elseBody);
      if (list[i].elifBranches) for (let j = 0; j < list[i].elifBranches.length; j++) walk(list[i].elifBranches[j].body);
    }
  }
  walk(nodes);
  return out;
}

function buildCode(nodes) {
  preResolveFilters(nodes);
  tagNodes(nodes);
  tagPartialNodes(nodes);
  tagLanguageNodes(nodes);

  const filterNames = collectFilterNames(nodes);
  const filterDecls = filterNames.map(n => `const _f_${n} = _f['${n}'];`).join('\n');

  const stmts = [];
  stmts.push('\'use strict\';');
  stmts.push('let out = \'\';');
  stmts.push('let a = _ctx.autoescape;');
  if (filterDecls) stmts.push(filterDecls);
  genNodes(nodes, stmts, 1, 'out', {});
  stmts.push('return out;');

  const body = stmts.join('\n');

  const args = [
    '_ctx', '_get', '_escape', '_escapeStr', '_f', '_cycle', '_firstof',
    '_partial', '_include', '_static', '_url', '_regroup', '_csrf',
    '_csp_nonce', '_loadLibs', '_debug', '_now', '_set', '_ifchanged',
    '_resolveVal', '_helperCall', '_missingFilter', '_normalizeFor',
    '_trans', '_blocktrans', '_registerPartial', '_extends', '_block',
    '_language', '_fallback', '_SafeString', '_astNodes', '_partials', '_languages', '_in'
  ];

  const src = `"use strict"; return function(${args.join(',')}) { ${body} }`;

  // eslint-disable-next-line no-new-func
  return new Function(src)();
}

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' };
const HAS_ESCAPE_RE = /[&<>"']/;
const ESCAPE_RE = /[&<>"']/g;

function fastEscape(v) {
  if (v == null) return '';
  if (v instanceof SafeString) return v.toString();
  const str = typeof v === 'string' ? v : String(v);
  if (!HAS_ESCAPE_RE.test(str)) return str;
  return str.replace(ESCAPE_RE, c => ESCAPE_MAP[c]);
}

function fastEscapeString(s) {
  return HAS_ESCAPE_RE.test(s) ? s.replace(ESCAPE_RE, c => ESCAPE_MAP[c]) : s;
}

function inHelper(a, b) {
  if (Array.isArray(b) || typeof b === 'string') return b.includes(a);
  if (b && typeof b === 'object') return a in b;
  return false;
}

function resolveVal(token, context) {
  if (token === undefined || token === null) return '';
  if (typeof token !== 'string') return token;
  if (token === '') return '';

  let idx = 0;
  const len = token.length;

  function skipWs() {
    while (idx < len && /\s/.test(token[idx])) idx++;
  }

  let isLiteral = false;
  let literalValue = null;
  let varPath = '';

  if (idx < len && (token[idx] === '"' || token[idx] === '\'')) {
    const quote = token[idx];
    idx++;
    let str = '';
    while (idx < len && token[idx] !== quote) {
      if (token[idx] === '\\' && idx + 1 < len) idx++;
      str += token[idx];
      idx++;
    }
    idx++;
    isLiteral = true;
    literalValue = str;
    skipWs();
  }

  if (!isLiteral && idx < len) {
    const remaining = token.slice(idx);
    if (remaining.startsWith('true') || remaining.startsWith('True')) {
      isLiteral = true;
      literalValue = true;
      idx += remaining.startsWith('True') ? 4 : 5;
      skipWs();
    } else if (remaining.startsWith('false') || remaining.startsWith('False')) {
      isLiteral = true;
      literalValue = false;
      idx += remaining.startsWith('False') ? 5 : 6;
      skipWs();
    } else if (remaining.startsWith('null') || remaining.startsWith('None') || remaining.startsWith('none')) {
      isLiteral = true;
      literalValue = null;
      idx += 4;
      skipWs();
    }
  }

  if (!isLiteral && idx < len && /[\d.-]/.test(token[idx])) {
    let numStr = '';
    if (token[idx] === '-') {
      numStr += '-';
      idx++;
    }
    while (idx < len && /[\d]/.test(token[idx])) {
      numStr += token[idx];
      idx++;
    }
    if (token[idx] === '.') {
      numStr += '.';
      idx++;
      while (idx < len && /[\d]/.test(token[idx])) {
        numStr += token[idx];
        idx++;
      }
    }
    isLiteral = true;
    literalValue = Number(numStr);
    skipWs();
  }

  if (!isLiteral) {
    while (idx < len && token[idx] !== '|') {
      varPath += token[idx];
      idx++;
    }
    varPath = varPath.trim();
  }

  let val = isLiteral ? literalValue : (varPath ? context.get(varPath) : undefined);

  while (idx < len) {
    if (token[idx] === '|') {
      idx++;
      skipWs();
      let name = '';
      while (idx < len && token[idx] !== ':' && token[idx] !== '|' && !/\s/.test(token[idx])) {
        name += token[idx];
        idx++;
      }
      skipWs();
      let argVal = undefined;
      if (idx < len && token[idx] === ':') {
        idx++;
        skipWs();
        if (idx < len && (token[idx] === '"' || token[idx] === '\'')) {
          const quote = token[idx];
          idx++;
          let s = '';
          while (idx < len && token[idx] !== quote) {
            if (token[idx] === '\\' && idx + 1 < len) idx++;
            s += token[idx];
            idx++;
          }
          idx++;
          argVal = s;
        } else {
          let s = '';
          while (idx < len && token[idx] !== '|' && !/\s/.test(token[idx])) {
            s += token[idx];
            idx++;
          }
          s = s.trim();
          if (s !== '' && !isNaN(s)) argVal = Number(s);
          else if (s === 'true') argVal = true;
          else if (s === 'false') argVal = false;
          else if (s === 'null' || s === 'None' || s === 'none') argVal = null;
          else argVal = s;
        }
      }
      const fn = filtersModule.getFilter(name);
      if (!fn) throw new Error(`Unknown filter: '${name}'`);
      val = fn(val, argVal, context);
      skipWs();
    } else {
      idx++;
    }
  }

  if (val === undefined) {
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith('\'') && token.endsWith('\''))) {
      return token.slice(1, -1);
    }
    if (token === 'true' || token === 'True') return true;
    if (token === 'false' || token === 'False') return false;
    if (token === 'none' || token === 'None' || token === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
    return context.get(token);
  }
  return val;
}

function getVal(ctx, path) {
  let v = ctx._local[path];
  if (v === undefined) v = ctx.get(path);
  return typeof v === 'function' ? v.call(null) : v;
}

function normalizeFor(raw) {
  if (Array.isArray(raw)) {
    const out = new Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = [null, raw[i]];
    return out;
  }
  if (raw && typeof raw === 'object' && !(raw instanceof Date)) {
    const out = [];
    for (const k of Object.keys(raw)) out.push([k, raw[k]]);
    return out;
  }
  return [];
}

function cycleHelper(ctx, args, asName) {
  const key = args.join(',');
  let idx = ctx.cycleStates.get(key) || 0;
  const token = args[idx % args.length];
  const val = resolveVal(token, ctx);
  ctx.cycleStates.set(key, idx + 1);
  if (asName) {
    ctx._local[asName] = val;
    return '';
  }
  return String(val);
}

function firstofHelper(ctx, args) {
  for (let i = 0; i < args.length; i++) {
    const v = resolveVal(args[i], ctx);
    if (v && v !== '' && v !== null && v !== undefined) return String(v);
  }
  return '';
}

function partialHelper(ctx, name, extra) {
  const partial = ctx.getPartial(name);
  if (!partial) throw new Error(`Partial '${name}' not found`);
  if (extra && extra.length) {
    const scope = {};
    for (let i = 0; i < extra.length; i++) scope[extra[i].name] = resolveVal(extra[i].valPath, ctx);
    ctx.push(scope);
    let out = '';
    for (let i = 0; i < partial.body.length; i++) {
      const r = partial.body[i].render(ctx);
      out += r instanceof Promise ? '' : (r || '');
    }
    ctx.pop();
    return out;
  }
  let out = '';
  for (let i = 0; i < partial.body.length; i++) {
    const r = partial.body[i].render(ctx);
    out += r instanceof Promise ? '' : (r || '');
  }
  return out;
}

function includeHelper(ctx, name, extra, partial) {
  const { IncludeNode } = require('./tags/inheritance');
  return new IncludeNode(name, extra, partial).render(ctx);
}

function staticHelper(ctx, path) {
  const { StaticNode } = require('./tags/util');
  return new StaticNode(path).render(ctx);
}

function urlHelper(ctx, route, pos, kw) {
  const { UrlNode } = require('./tags/util');
  return new UrlNode(route, pos, kw).render(ctx);
}

function regroupHelper(ctx, list, attr, target) {
  const { RegroupNode } = require('./tags/util');
  return new RegroupNode(list, attr, target).render(ctx);
}

function csrfHelper(ctx) {
  const { CsrfTokenNode } = require('./tags/util');
  return new CsrfTokenNode().render(ctx);
}

function cspNonceHelper(ctx) {
  const { CspNonceAttrNode } = require('./tags/util');
  return new CspNonceAttrNode().render(ctx);
}

function loadLibsHelper(ctx, libs) {
  const { LoadNode } = require('./tags/util');
  return new LoadNode(libs).render(ctx);
}

function debugHelper(ctx) {
  const { DebugNode } = require('./tags/util');
  return new DebugNode().render(ctx);
}

function nowHelper(ctx, fmt) {
  const { NowNode } = require('./tags/extra');
  return new NowNode(fmt).render(ctx);
}

function transHelper(ctx, key, args) {
  const i18n = require('./i18n');
  const params = {};
  if (args) for (const [k, v] of Object.entries(args)) params[k] = ctx.get(v);
  let k = key;
  if (!k.startsWith('"') && !k.startsWith('\'') && !k.includes(' ')) {
    const resolved = ctx.get(k);
    if (typeof resolved === 'string' && resolved.length > 0) k = resolved;
  } else {
    k = k.slice(1, -1);
  }
  return i18n.lookup(k, params);
}

function blocktransHelper(ctx, parts, withMap, pluralMap) {
  const { BlockTransNode } = require('./tags/i18n');
  return new BlockTransNode(parts, withMap, pluralMap, []).render(ctx);
}

function languageHelper(ctx, lang, node) { return node.render(ctx); }
function extendsHelper(ctx, expr) {
  const { ExtendsNode } = require('./tags/inheritance');
  return new ExtendsNode(expr).render(ctx);
}
function blockHelper(ctx, name) {
  const { BlockNode } = require('./tags/inheritance');
  return new BlockNode(name, []).render(ctx);
}
function helperCall(ctx, name, inner) {
  const fn = ctx._helpers && ctx._helpers.get(name);
  if (!fn) throw new Error(`Helper '${name}' not found`);
  return fn(inner, ctx);
}
function registerPartialHelper(ctx, name, node) { ctx.registerPartial(name, node); }
function fallbackHelper(ctx, node) { if (!node) return ''; const r = node.render(ctx); return r instanceof Promise ? '' : (r || ''); }
function missingFilter(name) { throw new Error(`Unknown filter: '${name}'`); }

function generateCode(nodes) {
  if (!canCodegen(nodes)) return null;
  const fn = buildCode(nodes);
  const partialsList = [];
  const languagesList = [];
  function collect(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (n.constructor.name === 'PartialDefNode') partialsList.push(n);
      if (n.constructor.name === 'LanguageNode') languagesList.push(n);
      if (n.body) collect(n.body);
      if (n.elseBody) collect(n.elseBody);
      if (n.elifBranches) for (let j = 0; j < n.elifBranches.length; j++) collect(n.elifBranches[j].body);
    }
  }
  collect(nodes);
  const flat = flattenNodes(nodes);

  const filterNames = collectFilterNames(nodes);
  const filterMap = {};
  for (const name of filterNames) {
    const fn = filtersModule.getFilter(name);
    if (fn) filterMap[name] = fn;
  }

  return function renderGenerated(ctx) {
    return fn(
      ctx,
      getVal,
      fastEscape,
      fastEscapeString,
      filterMap,
      cycleHelper,
      firstofHelper,
      partialHelper,
      includeHelper,
      staticHelper,
      urlHelper,
      regroupHelper,
      csrfHelper,
      cspNonceHelper,
      loadLibsHelper,
      debugHelper,
      nowHelper,
      null,
      null,
      resolveVal,
      helperCall,
      missingFilter,
      normalizeFor,
      transHelper,
      blocktransHelper,
      registerPartialHelper,
      extendsHelper,
      blockHelper,
      languageHelper,
      fallbackHelper,
      SafeString,
      flat,
      partialsList,
      languagesList,
      inHelper
    );
  };
}

module.exports = {
  generateCode,
  canCodegen,
  buildCode,
  tagNodes,
  flattenNodes,
  preResolveFilters,
  collectFilterNames,
  genNodes
};
