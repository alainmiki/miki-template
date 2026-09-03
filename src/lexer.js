/**
 * Lexer for tokenizing Django-style templates.
 */

/**
 * Token types:
 * - 'text': Raw template content.
 * - 'var': Variable interpolation, e.g. {{ user.name }}.
 * - 'block': Structural tag block, e.g. {% if user.is_active %}.
 */

function tokenize(template) {
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string');
  }

  const tokens = [];
  let i = 0;
  const len = template.length;
  let inVerbatim = false;
  let verbatimBuffer = [];

  while (i < len) {
    // Detect the start of a variable, block, or comment.
    if (template[i] === '{' && i + 1 < len) {
      const next = template[i + 1];
      if (next === '{' || next === '%' || next === '#') {
        // Find the matching closer, accounting for nested {{ }} and {% %}
        // so expressions like {{ x|default:"{{ y }}" }} parse correctly.
        const isVar = next === '{';
        const isBlock = next === '%';
        const isComment = next === '#';
        const closer = isVar ? '}}' : (isBlock ? '%}' : '#}');
        let j = i + 2;
        let depth = 1;
        while (j < len && depth > 0) {
          if (isVar && template[j] === '{' && template[j + 1] === '{') {
            depth++;
            j += 2;
            continue;
          }
          if (isBlock && template[j] === '{' && template[j + 1] === '%') {
            depth++;
            j += 2;
            continue;
          }
          if (template.substr(j, closer.length) === closer) {
            depth--;
            if (depth === 0) break;
            j += closer.length;
            continue;
          }
          j++;
        }
        if (depth !== 0) {
          throw new Error(`Unclosed template tag at position ${i}`);
        }
        const raw = template.slice(i, j + closer.length);
        const inner = template.slice(i + 2, j).trim();

        if (inVerbatim) {
          if (isBlock && inner === 'endverbatim') {
            inVerbatim = false;
            if (verbatimBuffer.length > 0) {
              tokens.push({ type: 'text', content: verbatimBuffer.join('') });
              verbatimBuffer = [];
            }
          } else {
            verbatimBuffer.push(raw);
          }
        } else if (isComment) {
          // Comments are ignored
        } else if (isVar) {
          tokens.push({ type: 'var', content: inner, raw });
        } else {
          // Block tag
          if (inner === 'verbatim') {
            inVerbatim = true;
          } else {
            tokens.push({ type: 'block', content: inner, raw });
          }
        }
        i = j + closer.length;
        continue;
      }
    }

    // Plain text — collect until the next special delimiter.
    let textStart = i;
    while (i < len) {
      if (template[i] === '{' && i + 1 < len) {
        const nx = template[i + 1];
        if (nx === '{' || nx === '%' || nx === '#') break;
      }
      i++;
    }
    const text = template.slice(textStart, i);
    if (inVerbatim) {
      verbatimBuffer.push(text);
    } else if (text !== '') {
      tokens.push({ type: 'text', content: text });
    }
  }

  if (inVerbatim && verbatimBuffer.length > 0) {
    tokens.push({ type: 'text', content: verbatimBuffer.join('') });
  }

  return tokens;
}

module.exports = {
  tokenize
};
