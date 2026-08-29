# Component Hierarchy — Django-Style Template Engine (Node.js/Express)

## 📖 Purpose
This document defines the **modules, responsibilities, and relationships** for the template engine. It ensures clarity in implementation and maintainability.

---

## 🧩 Core Components

### 1. **Lexer**
- **Responsibility**: Tokenize template strings into `TEXT`, `VAR`, `BLOCK`.
- **Inputs**: Raw template string.
- **Outputs**: Token stream.
- **Dependencies**: None.

### 2. **Parser**
- **Responsibility**: Convert tokens into an AST (Abstract Syntax Tree).
- **Inputs**: Token stream.
- **Outputs**: AST nodes (`Text`, `Var`, `If`, `For`, `Block`, etc.).
- **Dependencies**: Lexer.

### 3. **Renderer**
- **Responsibility**: Walk AST, evaluate expressions, apply filters, render output.
- **Inputs**: AST + context.
- **Outputs**: Final HTML string.
- **Dependencies**: Parser, Filter Registry, Tag Handlers.

---

## 🔧 Supporting Modules

### 4. **Filter Registry**
- **Responsibility**: Store and apply filters.
- **Built-in Filters**: `upper`, `lower`, `date`, `truncatechars`, `safe`, `escape`, etc.
- **Extensibility**: Developers can register custom filters.
- **Dependencies**: Renderer.

### 5. **Tag Handlers**
- **Responsibility**: Implement logic for each tag.
- **Control Flow**: `if`, `elif`, `else`, `for`, `empty`, `with`, `cycle`.
- **Inheritance**: `extends`, `block`, `include`.
- **Utilities**: `url`, `static`, `regroup`, `spaceless`, `comment`, `verbatim`.
- **Security**: `autoescape`, `csrf_token`, `csp_nonce_attr`.
- **Dependencies**: Renderer, Context.

### 6. **Inheritance System**
- **Responsibility**: Manage parent/child templates, block overrides.
- **Mechanism**: Block registry + AST merging.
- **Dependencies**: Parser, Renderer.

### 7. **Context Manager**
- **Responsibility**: Provide variables to templates.
- **Features**: Dotted lookups (`user.name`), querystring injection, context processors.
- **Dependencies**: Renderer.

---

## 🔐 Security Components

### 8. **Escaping Engine**
- **Responsibility**: Autoescape HTML by default.
- **Features**: `safe` filter disables escaping, `escape` forces escaping.
- **Dependencies**: Renderer, Filter Registry.

---

## 📦 Integration Layer

### 9. **Express Adapter**
- **Responsibility**: Integrate engine with Express.
- **API**: `app.engine('dtpl', renderFile)`.
- **Dependencies**: Renderer, Context Manager.

---

## 🛠️ Extensibility Components

### 10. **Custom Tag API**
- **Responsibility**: Allow developers to register new tags.
- **Mechanism**: Tag registry with handler functions.

### 11. **Custom Filter API**
- **Responsibility**: Allow developers to register new filters.
- **Mechanism**: Filter registry extension.

### 12. **Context Processors**
- **Responsibility**: Inject global variables (e.g., `user`, `request`).
- **Mechanism**: Middleware-like hooks.

---

## 📋 Relationships Diagram (Textual)

- **Lexer → Parser → Renderer**
- **Renderer → Filter Registry + Tag Handlers + Context Manager**
- **Tag Handlers → Inheritance System + Escaping Engine**
- **Express Adapter → Renderer**
- **Custom APIs → Filter Registry + Tag Handlers**
- **Context Processors → Context Manager**

---

## 🎯 Deliverables
- Modular codebase with clear separation of concerns.
- Each tag/filter implemented as independent handler.
- Extensible APIs for developers.
- Secure rendering pipeline with autoescape.
- Seamless Express integration.

