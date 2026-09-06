# Tags API

## registerTag

Register a custom tag.

```javascript
const { registerTag } = require('miki-template');

registerTag('hello', (tagContent, parser) => {
  return {
    render: (context) => 'Hello World!'
  };
});
```

## Built-in Tags

### Control Flow
- `if / elif / else / endif`
- `for / empty / endfor`
- `with / endwith`
- `cycle`
- `firstof`
- `ifchanged / endifchanged`

### Variable Assignment
- `set var = expr`
- `set var %}...{% endset`

### Date and Time
- `now "Y-m-d H:i:s"`

### Utility
- `static "path"`
- `url 'route.name' arg1 arg2`
- `regroup list by attr as name`
- `spaceless / endspaceless`
- `widthratio value max max_width`
- `debug`

### Security
- `csrf_token`
- `csp_nonce_attr`

### Comments and Raw Output
- `comment / endcomment`
- `verbatim / endverbatim`

### Autoescape
- `autoescape on / off / endautoescape`

### Library Loading
- `load library_name`

### Template Tags
- `templatetag token`

## Next Steps

- [Tags Guide](../guide/tags)
- [API Reference](../)
