# Why miki-template?

There are plenty of template engines for Node.js. Here is why miki-template stands out.

## Django Syntax You Already Know

If you have used Django, you already know miki-template. The syntax is intentionally aligned:

```html
{% if user.is_admin %}
  <p>Welcome, {{ user.name|title }}!</p>
{% elif user.is_staff %}
  <p>Staff dashboard</p>
{% else %}
  <p>Please log in.</p>
{% endif %}
```

No new DSL to learn. No context switching between backend and frontend templating styles.

## Built for HTMX and Partial Responses

Modern web apps increasingly use HTMX, Turbo, or custom AJAX. miki-template makes partial rendering trivial:

```javascript
app.get('/card/:id', (req, res) =>
  res.render(`home#card`, { title: 'Hello', body: '...' })
);
```

No extra middleware. No manual view resolution. Just `view#partial`.

## Smart Template Discovery

Forget `Failed to lookup view` errors. miki-template searches your project structure intelligently:

- `views/`
- `app/templates/`
- `packages/*/templates/`
- Any custom folder name you configure

This mirrors Django's `APP_DIRS` behavior and means templates can live where they make sense in your codebase.

## Performance That Scales

miki-template's compiled AST approach is especially fast on realistic templates — the ones with loops, conditionals, filters, and partials that make up real pages.

| Template | miki-template | pug | handlebars | ejs |
|----------|--------------|-----|------------|-----|
| Small | ~115k rps | 1.7M rps | 417k rps | 182k rps |
| Medium | ~454k rps | 625k rps | 48k rps | 29k rps |
| Large | **~476k rps** | 3.1k rps | 661 rps | 290 rps |

On large templates, miki-template is **~150× faster** than pug, handlebars, and ejs.

## Security by Default

- Auto-escaping enabled by default.
- SafeString wrapper for explicit bypass.
- CSRF and CSP tags included.
- No `eval()` or unsafe code execution.

## First-Class Express Integration

One function wires everything:

```javascript
miki.setupExpress(app, { extension: 'html', views: './views' });
```

That is it. No `app.engine()` boilerplate. No manual `res.render` patching. Partial responses work out of the box.

## Extensible and Future-Proof

Need a custom tag? A custom filter? The API is clean and well-documented. miki-template is built to grow with your app, not lock you into a fragile abstraction.
