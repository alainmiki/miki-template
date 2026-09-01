/**
 * Parser converting token stream into AST Nodes.
 */
const { escapeHtml, isSafe } = require('./security');
const filtersModule = require('./filters');

class TextNode {
  constructor(content) {
    this.content = content;
  }

  render(_context) {
    return this.content;
  }
}

class VariableNode {
  constructor(varPath, filters, isLiteral = false, literalValue = null) {
    this.varPath = varPath;
    this.filters = filters;
    this.isLiteral = isLiteral;
    this.literalValue = literalValue;
  }

  render(context) {
    let val = this.isLiteral ? this.literalValue : context.get(this.varPath);

    for (const filterInfo of this.filters) {
      const filterFn = filtersModule.getFilter(filterInfo.name);
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

      val = filterFn(val, argVal);
    }

    // Auto-escape logic – skip escaping if value is marked safe
    if (context.autoescape && !isSafe(val)) {
      return escapeHtml(val);
    }

    return val === null || val === undefined ? '' : String(val);
  }
}

/**
 * Parses a variable expression including filters and arguments.
 * E.g., user.name|lower|default:"Guest"
 */
function parseVariableExpression(expr) {
  let idx = 0;
  const len = expr.length;

  function skipWhitespace() {
    while (idx < len && /\s/.test(expr[idx])) {
      idx++;
    }
  }

  let varPath = '';
  let isLiteral = false;
  let literalValue = null;

  // Check for string literal as base value
  if (idx < len && (expr[idx] === '"' || expr[idx] === '\'')) {
    const quote = expr[idx];
    idx++;
    let strVal = '';
    while (idx < len && expr[idx] !== quote) {
      if (expr[idx] === '\\' && idx + 1 < len) {
        idx++;
      }
      strVal += expr[idx];
      idx++;
    }
    idx++; // Skip closing quote
    isLiteral = true;
    literalValue = strVal;
    skipWhitespace();
  }

  // Parse main variable path
  if (!isLiteral) {
    while (idx < len && expr[idx] !== '|') {
      varPath += expr[idx];
      idx++;
    }
    varPath = varPath.trim();
  }

  const filters = [];
  while (idx < len) {
    if (expr[idx] === '|') {
      idx++; // Skip '|'
      skipWhitespace();

      // Read filter name
      let filterName = '';
      while (idx < len && expr[idx] !== ':' && expr[idx] !== '|' && !/\s/.test(expr[idx])) {
        filterName += expr[idx];
        idx++;
      }

      skipWhitespace();
      let arg = null;

      if (idx < len && expr[idx] === ':') {
        idx++; // Skip ':'
        skipWhitespace();

        // Parse argument (string literal, number, boolean, null, or variable)
        if (expr[idx] === '"' || expr[idx] === '\'') {
          const quote = expr[idx];
          idx++; // Skip opening quote
          let argVal = '';
          while (idx < len && expr[idx] !== quote) {
            if (expr[idx] === '\\') {
              idx++;
            }
            if (idx < len) {
              argVal += expr[idx];
              idx++;
            }
          }
          idx++; // Skip closing quote
          arg = { type: 'literal', value: argVal };
        } else {
          // Read unquoted token
          let argVal = '';
          while (idx < len && expr[idx] !== '|' && !/\s/.test(expr[idx])) {
            argVal += expr[idx];
            idx++;
          }
          argVal = argVal.trim();

          // Type coercion
          if (!isNaN(argVal) && argVal !== '') {
            arg = { type: 'literal', value: Number(argVal) };
          } else if (argVal === 'true') {
            arg = { type: 'literal', value: true };
          } else if (argVal === 'false') {
            arg = { type: 'literal', value: false };
          } else if (argVal === 'none' || argVal === 'None' || argVal === 'null') {
            arg = { type: 'literal', value: null };
          } else {
            // Variable lookup
            arg = { type: 'variable', value: argVal };
          }
        }
      }

      filters.push({ name: filterName, arg });
      skipWhitespace();
    } else {
      idx++;
    }
  }

  return { varPath, filters, isLiteral, literalValue };
}

class Parser {
  // Existing constructor and methods remain unchanged
  /**
   * Parse tokens until a specific end tag, consuming the end tag token.
   * @param {string} endTag - Tag name to stop at (e.g., 'endsleep').
   * @returns {Array} Parsed nodes.
   */
  parseUntilTag(endTag) {
    const nodes = this.parse([endTag]);
    // Advance past the end tag token if present
    const next = this.peek();
    if (next && next.type === 'block' && next.content.split(/\s+/)[0] === endTag) {
      this.advance();
    }
    return nodes;
  }

  constructor(tokens, tagRegistry = {}) {
    this.tokens = tokens;
    this.index = 0;
    this.tagRegistry = tagRegistry;
  }

  /**
   * Parses tokens into AST nodes until one of the tags in untilTags is encountered.
   */
  parse(untilTags = []) {
    const nodes = [];
    while (this.index < this.tokens.length) {
      const token = this.tokens[this.index];

      if (token.type === 'text') {
        nodes.push(new TextNode(token.content));
        this.index++;
      } else if (token.type === 'var') {
        const parsed = parseVariableExpression(token.content);
        nodes.push(new VariableNode(parsed.varPath, parsed.filters, parsed.isLiteral, parsed.literalValue));
        this.index++;
      } else if (token.type === 'block') {
        const parts = token.content.split(/\s+/);
        const tagName = parts[0];

        // Stop parsing if we hit a stop tag
        if (untilTags.includes(tagName)) {
          break;
        }

        this.index++; // Consume block token

        const tagParser = this.tagRegistry[tagName];
        if (!tagParser) {
          throw new Error(`Unknown template tag: '${tagName}'`);
        }

        const node = tagParser(token.content, this);
        nodes.push(node);
      }
    }
    // If we were looking for specific end tags but didn't find them, throw
    if (untilTags.length > 0 && this.index >= this.tokens.length) {
      throw new Error(`Unexpected end of template - expected one of: ${untilTags.map(t => '{% ' + t + ' %}').join(', ')}`);
    }
    return nodes;
  }

  peek() {
    return this.tokens[this.index];
  }

  advance() {
    this.index++;
  }
}

module.exports = {
  Parser,
  TextNode,
  VariableNode,
  parseVariableExpression
};
