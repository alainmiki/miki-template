# Tags

Tags control template logic and structure. They use `{% %}` syntax.

## Control Flow

### if / elif / else / endif

```html
{% if user.role == 'admin' %}
  <p>Admin panel</p>
{% elif user.is_staff %}
  <p>Staff dashboard</p>
{% else %}
  <p>Guest view</p>
{% endif %}
```

Supported operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `and`, `or`, `not`.

### for / empty / endfor

```html
{% for item in items %}
  <li>{{ item }}</li>
{% empty %}
  <li>No items found</li>
{% endfor %}
```

#### forloop Metadata

Inside a `{% for %}` loop, use `forloop`:

| Variable | Description |
|----------|-------------|
| `forloop.counter` | 1-based index |
| `forloop.counter0` | 0-based index |
| `forloop.revcounter` | Reverse 1-based index |
| `forloop.revcounter0` | Reverse 0-based index |
| `forloop.first` | True on first iteration |
| `forloop.last` | True on last iteration |
| `forloop.parentloop` | Parent loop context (nested loops) |

### with / endwith

Scope a variable alias or assignment:

```html
{% with user.profile.address as addr %}
  <p>{{ addr.city }}, {{ addr.zip }}</p>
{% endwith %}
```

Multiple assignments:

```html
{% with greeting="Hello", who="World" %}
  <p>{{ greeting }} {{ who }}</p>
{% endwith %}
```

### cycle

Cycle through values on each iteration:

```html
{% for row in rows %}
  <tr class="{% cycle 'row-odd' 'row-even' %}">...</tr>
{% endfor %}
```

### firstof

Return the first truthy value:

```html
{% firstof var1 var2 var3 "fallback" %}
```

## Comments

```html
{% comment %}
  This is a comment and will not appear in output.
{% endcomment %}
```

## Raw Output

```html
{% verbatim %}
  {{ this_will_not_be_parsed }}
{% endverbatim %}
```

## Autoescape

Control escaping for a block:

```html
{% autoescape on %}
  {{ html }}  {# escaped #}
{% endautoescape %}

{% autoescape off %}
  {{ html }}  {# not escaped #}
{% endautoescape %}
```

## Next Steps

- [Filters](./filters)
- [Template Inheritance](./template-inheritance)
