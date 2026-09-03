# miki-template VS Code Extension

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=alainmiki&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/alainmiki)

The **ultimate** VS Code extension for **miki-template** and **Django** templates. Packed with features to supercharge your template development.

## Why miki-template?

- 100% Django compatible
- All Django template tags & filters
- miki-template extensions (partialdef, cache, addtoblock)
- Works with `.django`, `.dj`, `.miki`, `.miki-template` files

---

## Features

### 🔥 Intelligent Completions
- **Tags**: All 50+ Django/miki-template tags
- **Filters**: All 70+ filters with argument hints
- **forloop.* variables**: Auto-complete when inside for loops
- **Custom tags/filters**: Auto-detected from project config
- **Common variables**: user, request, form, items, etc.
- **Path completions**: Auto-suggest template files for `{% include %}` and `{% extends %}`

### 📖 Hover Documentation
Hover over any tag or filter to see:
- Full description
- Syntax example
- Argument hints for filters
- `{{ block.super }}` shows parent block content explanation

### ⚡ Real-time Validation
- Unclosed tag detection
- Mismatched opening/closing tags
- `{% extends %}` placement validation
- Performance optimized with debouncing

### 🎨 Color Decorations
Automatically highlights:
- `#ff0000`, `#fff`, `#ffffffaa`
- `rgb()`, `rgba()`
- `hsl()`, `hsla()`

### 🔧 Code Actions (Quick Fixes)
- Add missing `{% endif %}`
- Add missing `{% endfor %}`
- Wrap selection in `{% block %}`
- Add `{# prettier-ignore #}`

### 💡 Inlay Hints
Show inline parameter hints for filter arguments.

### 🔗 Bracket Matching Highlights
Highlight matching `{% if %}` / `{% endif %}` pairs.

### 🚀 Go-to-Definition
Jump to:
- `{% include "file" %}`
- `{% extends "file" %}`
- `{% block name %}`
- `{% partialdef name %}`

### 🔍 Project-wide Find References
Find all references to:
- Block definitions across workspace
- Included templates
- Extended templates

### 📋 Smart Tag Selection
Double-click to select entire `{% block %}` content.

### 🎯 Quick Outline Navigation
Jump between blocks with keyboard shortcuts.

### 📝 Template Preview
Preview template syntax in a new tab.

### ✏️ Rename Blocks (F2)
Rename any `{% block name %}` and automatically update all `{{ block.name }}` references across your entire workspace. Just place cursor on a block name and press F2.

### 🎨 Semantic Highlighting
Enhanced syntax highlighting using VS Code's Semantic Token API for better theme support and more accurate token classification.

### 🌐 HTML/CSS/JS Support
Full embedded language support for:
- **HTML**: Proper tag and attribute highlighting
- **CSS**: Syntax highlighting in `<style>` tags
- **JavaScript**: Syntax highlighting in `<script>` tags
- **Emmet**: Full Emmet abbreviation support for HTML and JavaScript
- **Auto-closing**: HTML tags, brackets, and quotes
- **Bracket matching**: HTML tags, parentheses, brackets

### 📋 Smart Paste
Paste HTML content and the extension will automatically append `|safe` filter to prevent escaping issues.

### 🔧 Code Actions
Quick fixes for common issues.

---

## Quick Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `insertFilter` | Wrap with filter | `Ctrl+Shift+F` |
| `wrapInBlock` | Wrap in block | - |
| `wrapInFor` | Wrap in for loop | - |
| `wrapInIf` | Wrap in if condition | - |
| `addPrettierIgnore` | Add prettier ignore | - |
| `goToNextBlock` | Next block | `Ctrl+Shift+.` |
| `goToPrevBlock` | Previous block | `Ctrl+Shift+,` |
| `previewTemplate` | Preview template | - |
| `showOutline` | Show outline | - |
| `findBlockReferences` | Find block refs | - |
| `validateAll` | Validate all | - |

> **Tip:** Press `F2` on any block name to rename it across the workspace!

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `enableValidation` | `true` | Enable validation |
| `enableCompletions` | `true` | Enable completions |
| `enableHover` | `true` | Enable hover docs |
| `enableColorDecorations` | `true` | Highlight colors |
| `enableCodeActions` | `true` | Enable quick fixes |
| `enableInlayHints` | `true` | Show inlay hints |
| `enableBracketHighlight` | `true` | Highlight brackets |
| `enableSmartPaste` | `true` | Smart paste handling |
| `formatOnSave` | `false` | Format on save |

---

## File Associations

| Extension | Language |
|-----------|----------|
| `.miki` | miki-template |
| `.miki-template` | miki-template |
| `.django` | Django HTML |
| `.dj` | Django HTML |

---

## Format on Save

```json
{
  "[django-html]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Custom Tags/Filters Detection

The extension auto-detects custom tags and filters from:
- `miki-template.config.js`
- `miki-template.config.json`
- `.mikirc`
- `package.json`

```javascript
// miki-template.config.js
module.exports = {
  filters: ['myFilter', 'customFilter'],
  tags: ['myTag', 'customTag']
};
```

---

## Path Completions

When typing `{% include %}` or `{% extends %}`, the extension automatically suggests template files from your workspace:

```html
{% include "partials/"  ← Shows all template files
{% extends "base"       ← Shows matching templates
```

Files are searched recursively throughout your workspace and filtered as you type.

---

## Examples

### Basic Template
```html
{% extends "base.html" %}

{% block content %}
<h1>{{ title|default:"Welcome" }}</h1>

{% if user.is_authenticated %}
  <p>Hello, {{ user.name }}!</p>
{% else %}
  <p>Please log in.</p>
{% endif %}

{% for item in items %}
  <li>{{ forloop.counter }}. {{ item }}</li>
{% empty %}
  <li>No items found.</li>
{% endfor %}
{% endblock %}
```

### Rename Blocks
Place cursor on any `{% block name %}` and press `F2`:

```html
<!-- Before rename: block title → block heading -->
{% block title %}Welcome{% endblock %}
{{ block.title }}

<!-- After pressing F2 and entering "heading": -->
{% block heading %}Welcome{% endblock %}
{{ block.heading }}
```

All references across the workspace are updated automatically.

### With Partial
```html
{% partialdef card inline %}
<div class="card">
  <h3>{{ title }}</h3>
  <p>{{ description }}</p>
</div>
{% endpartialdef %}

{% partial card with title="Hello" %}
```

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Package
npm run package

# Watch & install
npm run watch
```

---

## License

MIT

---

## Support

If this extension helps you, consider [buying me a coffee](https://www.buymeacoffee.com/alainmiki)!

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=alainmiki&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/alainmiki)
