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

  // Regex to split by delimiters: {{ ... }}, {% ... %}, and {# ... #}
  // Using 's' flag to match dot as newline (dotAll)
  const tagRegexp = /(\{\{.*?\}\}|\{\%.*?\%\}|\{\#.*?\#\})/gs;
  const parts = template.split(tagRegexp);
  const tokens = [];
  
  let inVerbatim = false;
  let verbatimBuffer = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === undefined || part === null) continue;

    // Handle verbatim mode
    if (inVerbatim) {
      if (part.startsWith('{%') && part.endsWith('%}') && part.slice(2, -2).trim() === 'endverbatim') {
        inVerbatim = false;
        if (verbatimBuffer.length > 0) {
          tokens.push({
            type: 'text',
            content: verbatimBuffer.join('')
          });
          verbatimBuffer = [];
        }
      } else {
        verbatimBuffer.push(part);
      }
      continue;
    }

    if (part.startsWith('{#') && part.endsWith('#}')) {
      // Comments are ignored in the token output
      continue;
    } else if (part.startsWith('{{') && part.endsWith('}}')) {
      const content = part.slice(2, -2).trim();
      tokens.push({
        type: 'var',
        content,
        raw: part
      });
    } else if (part.startsWith('{%') && part.endsWith('%}')) {
      const content = part.slice(2, -2).trim();
      if (content === 'verbatim') {
        inVerbatim = true;
      } else {
        tokens.push({
          type: 'block',
          content,
          raw: part
        });
      }
    } else {
      // Do not push empty text tokens to keep AST clean
      if (part !== '') {
        tokens.push({
          type: 'text',
          content: part
        });
      }
    }
  }

  // If verbatim wasn't closed, treat the remaining buffer as text
  if (inVerbatim && verbatimBuffer.length > 0) {
    tokens.push({
      type: 'text',
      content: verbatimBuffer.join('')
    });
  }

  return tokens;
}

module.exports = {
  tokenize
};
