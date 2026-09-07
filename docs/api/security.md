# Security API

## markSafe

Mark a string as safe (no escaping).

```javascript
const { markSafe } = require('miki-template');

const html = markSafe('<b>ok</b>');
// Will not be escaped
```

## isSafe

Check if a value is marked safe.

```javascript
const { isSafe } = require('miki-template');

if (isSafe(value)) {
  // value is marked safe
}
```

## escapeHtml

Escape HTML special characters.

```javascript
const { escapeHtml } = require('miki-template');

const escaped = escapeHtml('<script>');
// Output: &lt;script&gt;
```

## SafeString Class

```javascript
const { SafeString } = require('miki-template');

const safe = new SafeString('<b>ok</b>');
```

## Next Steps

- [Security Guide](../guide/security)
- [API Reference](../)
