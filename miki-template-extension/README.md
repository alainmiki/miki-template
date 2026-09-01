# miki-template VS Code Extension

Syntax highlighting, bracket matching, and snippets for [miki-template](https://github.com/alainmiki/miki-template) — a Django-style template engine for Node.js and Express.

## Features

- Syntax highlighting for `.miki` and `.miki-template` files
- Snippets for all built-in tags and common patterns
- Bracket auto-closing for `{% %}`, `{{ }}`, `{# #}`
- Comment toggling with `{# #}`

## Supported Tags

`if / elif / else / endif`, `for / empty / endfor`, `with / endwith`, `cycle`, `comment / endcomment`, `verbatim / endverbatim`, `include`, `extends`, `block / endblock`, `partialdef / endpartialdef`, `partial`, `load`, `templatetag`, `trans`, `blocktrans`, `language / endlanguage`, `widthratio`, `debug`, `autoescape / endautoescape`, `filter / endfilter`, `plural`, `cache / endcache`, `markdown / endmarkdown`, `regroup`, `firstof`, `csrf_token`, `csp_nonce_attr`, `static`, `url`

## Supported Filters

`upper`, `lower`, `title`, `capfirst`, `slugify`, `wordcount`, `striptags`, `linebreaks`, `linebreaksbr`, `truncatewords`, `truncatechars`, `safe`, `escape`, `escapejs`, `length`, `length_is`, `join`, `slice`, `dictsort`, `dictsortreversed`, `first`, `last`, `default`, `default_if_none`, `firstof`, `date`, `time`, `strftime`, `timesince`, `timeuntil`, `add`, `divisibleby`, `floatformat`, `yesno`, `pluralize`, `filesizeformat`, `urlencode`, `escapeuri`, `stringformat`, `cut`, `addslashes`, `removetags`, `trans`, `regroup`, `intcomma`, `intword`, `apnumber`, `ordinal`, `naturalday`, `lorem`

## Installation

### From VS Code Marketplace

```bash
code --install-extension miki-template
```

Or search for **miki-template** in the Extensions view (`Ctrl+Shift+X`).

### Manual installation

1. Copy `syntaxes/` and `snippets/` into your project or user settings
2. Associate `.miki` files with `miki-template`

## File Associations

Add to your workspace or user `settings.json`:

```json
{
  "files.associations": {
    "*.miki": "miki-template",
    "*.miki-template": "miki-template"
  }
}
```

## Snippets

Type any of the following prefixes and press `Tab`:

| Prefix | Output |
|--------|--------|
| `if` | `{% if %}...{% endif %}` |
| `ifelse` | `{% if %}...{% else %}...{% endif %}` |
| `for` | `{% for %}` with `empty` |
| `block` | `{% block %}` |
| `extends` | `{% extends %}` |
| `include` | `{% include %}` |
| `with` | `{% with %}` |
| `cycle` | `{% cycle %}` |
| `trans` | `{% trans %}` |
| `blocktrans` | `{% blocktrans %}` |
| `language` | `{% language %}` |
| `partialdef` | `{% partialdef %}` |
| `partial` | `{% partial %}` |
| `csrf` | `{% csrf_token %}` |
| `csp` | `{% csp_nonce_attr %}` |
| `static` | `{% static %}` |
| `url` | `{% url %}` |
| `widthratio` | `{% widthratio %}` |
| `debug` | `{% debug %}` |
| `load` | `{% load %}` |
| `comment` | `{# #}` block comment |
| `verbatim` | `{% verbatim %}` |
| `regroup` | `{% for %}` with `regroup` filter |
| `firstof` | `{% firstof %}` |
| `filter` | `{% filter %}` block |

## License

MIT
