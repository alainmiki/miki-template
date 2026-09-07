# Tags API

## registerTag

Register a custom tag callable from templates as `{% tag_name content %}...{% endtag_name %}`.

=== "CommonJS"

    ```javascript
    const { registerTag } = require('miki-template');

    registerTag('hello', (tagContent, parser) => {
      return {
        render: (context) => 'Hello World!'
      };
    });
    ```

=== "ES Modules"

    ```javascript
    import { registerTag } from 'miki-template';

    registerTag('hello', (tagContent, parser) => {
      return {
        render: (context) => 'Hello World!'
      };
    });
    ```

### Tag Parser Signature

- `tagContent` — The full text after the tag name, as a string.
- `parser` — The Parser instance, providing `parser.parse()`, `parser.peek()`, `parser.skipTag()`.

Returns a **Node** object with a `render(context)` method. The render method receives the `Context` object and returns a string.

## Built-in Tags

### Control Flow

| Tag | Description |
|-----|-------------|
| `if / elif / else / endif` | Conditional blocks |
| `for / empty / endfor` | Loop over arrays/objects |
| `with / endwith` | Create a scoped context |
| `cycle` | Cycle through values |
| `firstof` | Output first non-empty value |
| `ifchanged / endifchanged` | Only output if value changed |

### Variable Assignment

| Tag | Description |
|-----|-------------|
| `set var = expr` | Inline variable assignment |
| `set var %}...{% endset` | Capture block output into a variable |

### Date and Time

| Tag | Description |
|-----|-------------|
| `now "Y-m-d H:i:s"` | Output current date/time |

### Utility

| Tag | Description |
|-----|-------------|
| `static "path"` | Resolve static asset path |
| `url 'route.name' arg1 arg2` | Generate URL by route name |
| `regroup list by attr as name` | Regroup a list by an attribute |
| `spaceless / endspaceless` | Remove whitespace between HTML tags |
| `widthratio value max max_width` | Calculate CSS width ratio |
| `debug` | Output debugging context information |

### Security

| Tag | Description |
|-----|-------------|
| `csrf_token` | Output CSRF hidden input |
| `csp_nonce_attr` | Output `nonce` attribute for CSP |

### Comments and Raw Output

| Tag | Description |
|-----|-------------|
| `comment / endcomment` | Comment out content |
| `verbatim / endverbatim` | Disable tag parsing within |

### Autoescape

| Tag | Description |
|-----|-------------|
| `autoescape on / off / endautoescape` | Toggle HTML escaping |

### Library Loading

| Tag | Description |
|-----|-------------|
| `load library_name` | Load a registered library |

### Template Tags

| Tag | Description |
|-----|-------------|
| `templatetag token` | Output a template syntax character (e.g. `{% templatetag openpercentblock %}`) |

### Inheritance

| Tag | Description |
|-----|-------------|
| `extends "parent.html"` | Inherit from a parent template |
| `block name / endblock` | Define/overriding inheritable block |
| `include "file.html"` | Include another template |

### Partials

| Tag | Description |
|-----|-------------|
| `partialdef name / endpartialdef` | Define a named partial |
| `partial name with k=v` | Render a defined partial |

### i18n

| Tag | Description |
|-----|-------------|
| `trans "key"` | Translate a string |
| `blocktrans / endblocktrans` | Translate with variables |
| `language "xx" / endlanguage` | Switch language for a block |

## Next Steps

- [Tags Guide](../guide/tags)
- [Custom Tags](../guide/custom-tags)
- [API Reference](../)
