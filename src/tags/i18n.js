/**
 * i18n template tags: trans, blocktrans, language.
 */
const i18n = require('../i18n');

/**
 * {% trans "translation key" %}
 * {% trans "Hello, %s!" name %}
 * Optional context: {% trans context "key" %}
 */
class TransNode {
  constructor(key, args) {
    this.key = key;
    this.args = args; // { name: 'userName', ... }
  }

  render(context) {
    const params = {};
    if (this.args) {
      for (const [k, v] of Object.entries(this.args)) {
        params[k] = context.get(v);
      }
    }
    // For unquoted keys: if the key is a variable name, resolve it
    let key = this.key;
    if (!key.startsWith('"') && !key.startsWith('\'') && !key.includes(' ')) {
      const resolved = context.get(key);
      if (typeof resolved === 'string' && resolved.length > 0) {
        key = resolved;
      }
    } else {
      key = key.slice(1, -1);
    }
    return i18n.lookup(key, params);
  }
}

class LanguageNode {
  constructor(lang, body) {
    this.lang = lang;
    this.body = body;
  }

  render(context) {
    // Strip quotes
    const lang = this.lang.startsWith('"') || this.lang.startsWith('\'')
      ? this.lang.slice(1, -1)
      : (context.get(this.lang) || this.lang);
    const previous = i18n.getLanguage();
    i18n.setLanguage(lang);
    try {
      return this.body.map(n => n.render(context)).join('');
    } finally {
      i18n.setLanguage(previous);
    }
  }
}

/**
 * {% blocktrans %}...{% endblocktrans %}
 * Supports {% with name=value %}, {% plural count %}, {% endblocktrans %}
 * Inner text may contain {% with %} and {% plural %} tags.
 */
class BlockTransNode {
  constructor(textParts, withMappings, pluralMappings, body) {
    // textParts: array of raw string segments between variable interpolations
    // e.g. "Hello, " + [name] + "!"  => ['Hello, ', { type: 'var', name: 'name' }, '!']
    this.textParts = textParts;
    this.withMappings = withMappings || [];
    this.pluralMappings = pluralMappings || [];
    this.body = body; // for nested tags (unused currently)
  }

  render(context) {
    // 1. Apply {% with %} mappings to a local scope
    const localParams = {};
    for (const m of this.withMappings) {
      localParams[m.name] = context.get(m.valPath);
    }
    // 2. Apply {% plural count %} mappings
    for (const m of this.pluralMappings) {
      localParams[m.name] = context.get(m.valPath);
    }

    // 3. Reassemble the full text
    let fullText = '';
    for (const part of this.textParts) {
      if (typeof part === 'string') {
        fullText += part;
      } else if (part.type === 'var') {
        const val = localParams[part.name] !== undefined
          ? localParams[part.name]
          : context.get(part.name);
        fullText += String(val);
      }
    }

    // 4. Look up translation
    const count = Object.values(localParams).find(v => typeof v === 'number');
    return i18n.lookup(fullText, localParams, count);
  }
}

// --- Parsers ---

function parseTrans(tagContent, _parser) {
  // {% trans "key" %}
  // {% trans "Hello %s" name=user.name %}
  // {% trans context "key" %}
  const trimmed = tagContent.slice(5).trim(); // strip "trans"
  const tokens = trimmed.match(/(?:"[^"]*"|'[^']*'|\S+)/g) || [];

  let keyIdx = 0;
  if (tokens[0] && tokens[0] === 'context') {
    keyIdx = 2;
  }
  const key = tokens[keyIdx] || '';
  const args = {};
  for (let i = keyIdx + 1; i < tokens.length; i++) {
    const eq = tokens[i].indexOf('=');
    if (eq > 0) {
      const name = tokens[i].slice(0, eq);
      let val = tokens[i].slice(eq + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      args[name] = val;
    }
  }
  return new TransNode(key, Object.keys(args).length ? args : null);
}

function parseLanguage(tagContent, parser) {
  const lang = tagContent.slice(9).trim(); // strip "language"
  const body = parser.parse(['endlanguage']);
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endlanguage') {
    parser.advance();
  }
  return new LanguageNode(lang, body);
}

function parseBlockTrans(tagContent, parser) {
  // Collect body until {% endblocktrans %}. The parser will stop at the
  // first matching end tag it encounters in its untilTags list.
  const body = parser.parse(['endblocktrans']);
  // Consume the endblocktrans token if it's still pending.
  const next = parser.peek();
  if (next && next.type === 'block' && next.content.split(/\s+/)[0] === 'endblocktrans') {
    parser.advance();
  }

  // Parse `with name=value` and `count` from the blocktrans tag content.
  // Format: {% blocktrans with name1=var1 name2=var2 count n %}...{% endblocktrans %}
  const withMappings = [];
  const pluralMappings = [];
  const afterTrans = tagContent.replace(/^blocktrans\s*/, '').trim();
  // Split on "with" / "count" boundaries, keeping the keywords
  const tokens = afterTrans.match(/(?:"[^"]*"|'[^']*'|\S+)/g) || [];
  let i = 0;
  // Skip any leading context (e.g. "context")
  if (tokens[i] === 'context') i += 2;
  // Check for `with` or `count` after the main text
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === 'with') {
      i++;
      // Read name=var pairs until we hit end or another keyword
      while (i < tokens.length && tokens[i].indexOf('=') > 0) {
        const pair = tokens[i];
        const eq = pair.indexOf('=');
        const name = pair.slice(0, eq);
        let val = pair.slice(eq + 1);
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
          val = val.slice(1, -1);
        }
        withMappings.push({ name, valPath: val });
        i++;
      }
    } else if (tok === 'count') {
      i++;
      // Next token is the count variable
      if (i < tokens.length) {
        pluralMappings.push({ name: 'count', valPath: tokens[i++] });
      }
    } else {
      i++;
    }
  }

  return new BlockTransNode(
    extractTextAndVars(body),
    withMappings.length ? withMappings : extractWithMappings(body),
    pluralMappings,
    body
  );
}

/** Extract raw text + {% with %}-bound variable references from a body. */
function extractTextAndVars(body) {
  const parts = [];
  for (const node of body) {
    if (node.constructor.name === 'TextNode') {
      parts.push(node.content);
    } else if (node.constructor.name === 'VariableNode') {
      // Top-level var: bind it to the parsed varPath so it can be filled
      parts.push({ type: 'var', name: node.varPath });
    } else {
      parts.push('');
    }
  }
  return parts;
}

function extractWithMappings(body) {
  const mappings = [];
  for (const node of body) {
    if (node.constructor.name === 'WithNode' && node.mappings) {
      for (const m of node.mappings) {
        mappings.push({ name: m.name, valPath: m.valPath });
      }
    }
  }
  return mappings;
}

function extractPluralMappings(body) {
  // Look for a custom PluralNode (we mark it via a special tag)
  // For now, treat WithNodes that have a count attribute as plural mappings.
  const mappings = [];
  for (const node of body) {
    if (node.constructor.name === 'PluralMappingNode') {
      mappings.push({ name: node.name, valPath: node.valPath });
    }
  }
  return mappings;
}

class PluralMappingNode {
  constructor(name, valPath) {
    this.name = name;
    this.valPath = valPath;
  }
  render() { return ''; }
}

function parsePlural(tagContent, _parser) {
  // {% plural count %}
  const rest = tagContent.slice(6).trim();
  const eq = rest.indexOf('=');
  if (eq > 0) {
    return new PluralMappingNode(rest.slice(0, eq).trim(), rest.slice(eq + 1).trim());
  }
  return new PluralMappingNode('count', rest);
}

module.exports = {
  TransNode,
  LanguageNode,
  BlockTransNode,
  PluralMappingNode,
  parsers: {
    trans: parseTrans,
    language: parseLanguage,
    blocktrans: parseBlockTrans,
    plural: parsePlural
  }
};
