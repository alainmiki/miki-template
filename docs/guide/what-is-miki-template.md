# What is miki-template?

miki-template is a **Django-style template engine for Node.js and Express**. It brings Django's beloved template language — variables, filters, tags, inheritance, and partials — to the Node.js ecosystem with first-class Express integration and modern JavaScript support.

## Philosophy

miki-template is designed for developers who love Django's template syntax but want the speed and flexibility of Node.js. It prioritizes:

- **Developer experience**: Familiar Django syntax, excellent error messages, and sensible defaults.
- **Performance**: Compiled AST rendering that scales to large, real-world templates.
- **Modern Node.js**: Full ESM and CommonJS support, async rendering, and compatibility with current Express/Koa/Fastify/Hono/Elysia versions.
- **Security**: Auto-escaping, safe strings, and Django-style security primitives built in.

## Key Concepts

- **Templates** are text files using `{{ variables }}`, `{% tags %}`, and `| filters`.
- **Partials** let you define reusable components with `{% partialdef %}` and render them by name.
- **Template inheritance** uses `{% extends %}` and `{% block %}` to build layout hierarchies.
- **Smart discovery** finds templates across `views/`, `app/templates/`, and nested folders automatically.

## Who is it for?

miki-template is a great fit if you:

- Prefer Django-style templates over JSX or pure string concatenation.
- Need **partial rendering** for HTMX or AJAX-heavy apps.
- Want a template engine that **scales** without rewriting templates as your app grows.
- Value **security** and want XSS protection by default.
