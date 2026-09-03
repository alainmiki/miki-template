# Changelog

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-09-03

### Added

- **Inlay Hints**: Show inline parameter hints for filter arguments
- **Project-wide Find References**: Find blocks, includes, extends across entire workspace
- **Smart Tag Selection**: Double-click to select entire `{% block %}` content
- **Custom Tag/Filters Detection**: Auto-detect from project config files
- **Template Preview Command**: Preview template syntax in a webview panel
- **Smart Paste**: Auto-detect HTML paste for potential escaping
- **Bracket Matching Highlights**: Visual highlight for matching `{% if %}`/`{% endif %}` pairs
- **Template Variables IntelliSense**: Common variable names (user, request, form, items, etc.)
- **Performance Debouncing**: Optimized validation and decorations with debounce
- **Quick Outline Navigation**: `Ctrl+Shift+.` and `Ctrl+Shift+,` to jump between blocks

### New Commands
- `goToNextBlock` / `goToPrevBlock` - Navigate between blocks
- `previewTemplate` - Preview template in new tab
- `showOutline` - Quick outline navigation
- `findBlockReferences` - Find all block references

### New Settings
- `enableInlayHints` - Toggle inlay hints
- `enableBracketHighlight` - Toggle bracket highlighting
- `enableSmartPaste` - Toggle smart paste

## [1.6.0] - 2026-09-03

### Added

- **Color Decorations**: Automatically highlights color values (`#ff0000`, `rgb()`, `rgba()`, `hsl()`, `hsla()`) in templates
- **Code Actions**: Quick fixes for common issues
- **Find References**: Find all references to blocks and includes
- **New Commands**: wrapInBlock, wrapInFor, wrapInIf, addPrettierIgnore
- **New Settings**: enableColorDecorations, enableCodeActions

### Changed

- Improved completion items with argument hints
- Better validation diagnostics
- Enhanced outline view with icons

## [1.5.0] - 2026-09-03

### Added

- **Go-to-Definition**: Jump to included/extended templates and block definitions
- **Outline View**: See template structure
- **forloop.* Completions**: Auto-complete loop variables
- **Keyboard Shortcut**: `Ctrl+Shift+F` to wrap selection with filter

## [1.4.0] - 2026-09-02

### Added

- Dual language support: `miki-template` and `django-html`
- File associations: `.miki`, `.miki-template`, `.django`, `.dj`
- Comprehensive filter support (70+ filters)
- Prettier integration with `prettier-ignore`

## [1.3.0] - 2026-08-15

### Added

- Buy Me a Coffee integration
- Format on save configuration

## [1.2.0] - 2026-06-01

### Added

- Initial release
- Basic syntax highlighting
- Code snippets
