# Smart Template Discovery

miki-template includes a Django-inspired template finder that searches your project structure intelligently. You no longer need to manually configure every views directory or worry about `Failed to lookup view` errors when templates live in nested app folders.

## How It Works

When you call `res.render('name')` or `render('name', ctx, { views })`, miki-template:

1. Resolves the view name against the configured views directories.
2. Searches recursively through subdirectories for matching files.
3. Recognizes app-style `templates/` directories automatically.
4. Supports custom directory names via `setAppTemplateDirNames()`.

## Supported Layouts

```text
project/
├── views/
│   └── home.html
├── app/
│   └── templates/
│       └── dashboard.html
├── packages/
│   └── admin/
│       └── templates/
│           └── settings.html
```

All of these are discoverable without extra configuration.

## Express Integration

When you use `setupExpress()`, the engine automatically expands your views roots:

```javascript
miki.setupExpress(app, { extension: 'html', views: './views' });

// Templates placed deeply in your project are found automatically:
app.get('/', (req, res) => res.render('home'));
app.get('/admin', (req, res) => res.render('settings'));
```

## Custom Template Directory Names

If your project uses a different convention than `templates`, configure it globally:

```javascript
const { setAppTemplateDirNames } = require('miki-template');

setAppTemplateDirNames(['templates', 'views', 'pages']);
```

## Manual Lookup

You can also use the finder directly:

```javascript
const { findTemplateInViews } = require('miki-template');

const found = findTemplateInViews('home', [
  './views',
  './app/templates'
]);

console.log(found);
// Output: /absolute/path/to/home.html
```

## Next Steps

- [Partial Templates](./partial-templates)
- [Integrations: Express](../integrations/express)
