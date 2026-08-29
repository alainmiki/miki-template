# AGENT.md - Agent Instructions, Guardrails, & Architecture Rules

This repository implements a Django-Style Template Engine for Node.js/Express. To ensure high code quality, consistent architecture, and full feature parity with Django without guesswork, all AI agents and developers must strictly follow these instructions and guardrails.

---

## 🎯 Core Objectives
1. **Full Feature Parity**: Match Django's template engine rules for rendering variables, dotted lookups, built-in tags, filters, and template inheritance.
2. **Deterministic & Secure**: Escape output by default using a safe-string mechanism.
3. **No Spaghetti Code**: Maintain a strict separation of Lexer, Parser, Renderer, Context, and Tag/Filter registries.

---

## ⚠️ Strict Guardrails & Anti-Hallucination Rules

> [!IMPORTANT]
> **No Guesswork / Assumptions**
> - If a tag or filter's behavior is not clearly defined in [prd.md](file:///c:/Users/Coder%20Miki/Desktop/miki-template/context/prd.md) or Django documentation, **DO NOT guess**. 
> - If you notice ambiguities (e.g., how to handle circular extends or nested cycles), raise a question to the user immediately or throw a descriptive compilation error.

> [!WARNING]
> **No Regex-Based Global Search & Replace**
> - You **must not** implement tags or filters using global regex replacements on the final string. All templates must go through:
>   `Lexer (String -> Tokens) -> Parser (Tokens -> AST) -> Renderer (AST + Context -> HTML)`.
> - Direct regex replacement on HTML bypasses nesting, escaping, and blocks, which introduces severe bugs.

> [!CAUTION]
> **Security Guardrails**
> - All variable output must be HTML-escaped by default.
> - A variable is only safe from escaping if it is marked as a `SafeString` (e.g., using the `safe` filter or internally flagged).
> - Dynamic expression evaluation (such as in `if` tags) **must not** use direct JS `eval()`. Use a safe AST evaluator or sandboxed parser to prevent remote code execution.

---

## 🧩 Architectural Guidelines

### 1. Lexing (`src/lexer.js`)
*   Tokens must be generated for three primary types:
    - `TEXT`: Plain HTML/text.
    - `VAR`: Variables wrapped in `{{ ... }}`.
    - `BLOCK`: Structural tags wrapped in `{% ... %}`.
*   The Lexer must correctly handle verbatim blocks `{% verbatim %}` and comments `{% comment %}` by suppressing token output or passing raw text tokens.

### 2. Parsing (`src/parser.js`)
*   The Parser takes a stream of tokens and constructs an AST of nodes.
*   Every node must implement a `.render(context)` method (async or sync).
*   For tags that have closing tags (e.g., `{% if %}`...`{% endif %}`), the parser must parse nested tokens recursively until the matching close tag is encountered.

### 3. Context & Scope Isolation (`src/context.js`)
*   Context must support a stack-like structure: `.push()` to create a new scope, and `.pop()` to revert.
*   **Variable Lookups**: Support dotted lookups:
    - Example: `{{ user.profile.name }}` should search `user` in context, then resolve property `profile`, then property `name`.
    - If a resolved value is a function, call it (without arguments, just like Django).
    - If a lookup fails, return an empty string `""` by default, unless configured otherwise.

### 4. Template Inheritance (`src/tags/inheritance.js`)
*   Inheritance works by having a child template load a parent template via `{% extends "parent.html" %}`.
*   The child overrides blocks defined as `{% block block_name %}`.
*   During render, the parent's AST is evaluated, but block nodes are replaced by the child's corresponding block nodes.
*   Support block nesting and the `{{ block.super }}` variable to render parent block content.

---

## 🛠️ Step-by-Step Task Execution Protocol

When executing tasks:
1. **Analyze Requirements**: Check [prd.md](file:///c:/Users/Coder%20Miki/Desktop/miki-template/context/prd.md) and [component.md](file:///c:/Users/Coder%20Miki/Desktop/miki-template/context/component.md).
2. **Check Existing Tests**: Run current test suite using `npm test` or `node --test` to ensure a green state.
3. **Write Tests First**: For any new filter, tag, or parser logic, write a corresponding unit test in `tests/` showing the expected template string and its expected output.
4. **Implement Modular Code**: Put tag handlers in `src/tags/`, filters in `src/filters.js`, and maintain registry isolation.
5. **Verify**: Ensure the test suite passes, check for escaping vulnerabilities, and check that no scope leaks occur.
