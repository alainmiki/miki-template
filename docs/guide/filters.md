# Filters

Filters transform variable output using the pipe (`|`) syntax. You can chain multiple filters.

## Usage

```html
{{ name|upper }}
{{ price|floatformat:2 }}
{{ body|truncatewords:30|escape }}
```

## Text Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `upper` | Uppercase | `{{ name \| upper }}` |
| `lower` | Lowercase | `{{ name \| lower }}` |
| `title` | Title case | `{{ name \| title }}` |
| `capfirst` | Capitalize first letter | `{{ name \| capfirst }}` |
| `slugify` | URL-friendly slug | `{{ title \| slugify }}` |
| `wordcount` | Count words | `{{ body \| wordcount }}` |
| `striptags` | Remove HTML tags | `{{ html \| striptags }}` |
| `linebreaks` | Convert newlines to `<p>` and `<br>` | `{{ text \| linebreaks }}` |
| `linebreaksbr` | Convert newlines to `<br>` | `{{ text \| linebreaksbr }}` |
| `truncatewords:N` | Truncate to N words | `{{ body \| truncatewords:30 }}` |
| `truncatechars:N` | Truncate to N chars | `{{ title \| truncatechars:50 }}` |

## HTML Filters

| Filter | Description |
|--------|-------------|
| `safe` | Mark string as safe (no escaping) |
| `escape` | Force HTML escaping |

## List Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `length` | Length of list/string | `{{ items \| length }}` |
| `join:","` | Join with separator | `{{ tags \| join:", " }}` |
| `slice:"start:end"` | Slice list | `{{ items \| slice:"0:5" }}` |
| `dictsort:"key"` | Sort dict by key | `{{ dict \| dictsort:"name" }}` |
| `dictsortreversed:"key"` | Reverse sort dict | `{{ dict \| dictsortreversed:"name" }}` |
| `length_is:N` | Test if length equals N | `{% if items\|length_is:0 %}Empty{% endif %}` |

## Default Filters

| Filter | Description |
|--------|-------------|
| `default:"fallback"` | Use fallback for empty string, null, or undefined |
| `default_if_none:"fallback"` | Use fallback only for null/undefined |

## Date/Time Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `date:"Y-m-d"` | Format date | `{{ d \| date:"Y-m-d" }}` |
| `time:"H:i"` | Format time | `{{ d \| time:"H:i" }}` |
| `timesince` | Time since date | `{{ created \| timesince }}` |
| `timeuntil` | Time until date | `{{ start \| timeuntil }}` |

## Numeric Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `add:5` | Add number | `{{ x \| add:5 }}` |
| `divisibleby:2` | Test divisibility | `{% if x\|divisibleby:2 %}Even{% endif %}` |
| `floatformat:2` | Format float | `{{ price \| floatformat:2 }}` |

## Misc Filters

| Filter | Description |
|--------|-------------|
| `yesno:"yes,no,maybe"` | Convert bool to string |
| `pluralize:"s"` | Pluralize based on count |
| `filesizeformat` | Human-readable file size |
| `urlencode` | URL encode |
| `stringformat:"format"` | sprintf-style formatting |
| `cut:"text"` | Remove substring |
| `addslashes` | Escape quotes |
| `removetags:"tag1,tag2"` | Remove specific tags |

## Chaining Filters

Filters are evaluated left to right:

```html
{{ title|lower|truncatewords:5|capfirst }}
```

## Next Steps

- [Tags](./tags)
- [API Reference: Filters](../api/filters)
