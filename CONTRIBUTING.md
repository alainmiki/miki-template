# Contributing to Django-Style Template Engine

Thank you for your interest in contributing! Please follow these guidelines:

---

## 🛠️ Development Setup

1. **Clone the Repository**
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Tests**:
   ```bash
   npm test
   ```

---

## 🛑 Guardrails & Standards

Before submitting a PR, make sure your code aligns with the strict requirements outlined in [AGENT.md](file:///c:/Users/Coder%20Miki/Desktop/miki-template/AGENT.md):
- Ensure full parity with Django syntax behavior.
- Do not use `eval()` for safety.
- Write corresponding unit tests in `tests/` for all new features or bug fixes.
- Verify that auto-escaping remains secure by default.
