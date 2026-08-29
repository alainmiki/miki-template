# Project Roadmap - Django-Style Template Engine

Our release and packaging timeline.

---

## 🏁 Phase 1 - Core Delivery (Day 1-2)
- [x] High-performance tokenizing Lexer.
- [x] AST parser mapping nested blocks.
- [x] Context Stack Manager supporting dotted lookup and function calls.
- [x] HTML Auto-escaping using `he` library and `SafeString` wrappers.
- [x] Complete suite of built-in filters (25+ filters).
- [x] Core control flow tags (`if`, `for`, `with`, `cycle`, `autoescape`, `comment`, `verbatim`).
- [x] Dynamic inheritance (`extends`, `block`, `include` with parameter scope).
- [x] Express layout adapter (`__express`).
- [x] Complete test suite verification.

---

## 🚀 Phase 2 - Advanced Performance & Ecosystem (Next Month)
- [x] **CI/CD Pipeline** – linting, testing, and automated npm publishing via GitHub Actions.
- [x] **AST Caching** – cache compiled ASTs for static templates (implemented).
- [x] **Custom Tag Helpers** – simplify registration of custom block tags (implemented via helpers).
- [x] **Async Render Options** – support async filters/tags for DB lookups (implemented).
- [x] **Extended Date Syntax** – integrate `date-fns` for full date formatting parity (implemented).
- [x] **Advanced Usage Docs** – examples covering partialdef, block rendering, and API (added).
- [x] **Performance Benchmarks** – baseline measurements and optimization guide (added).

---

## 📦 Phase 3 - Ecosystem & Tooling (Q4)
- [ ] VS Code Extension: Syntax highlighting for `.dtpl` or `.html` Django templates.
- [ ] Web Playground: An interactive sandbox to experiment with the engine.
- [ ] CLI Compiler: Render templates from the command line.

---

## 📚 Documentation
- [x] Comprehensive docs in `docs/` covering installation, usage, tags, filters, partialdef, security, and API.
- [x] Advanced examples and performance guide (added).
