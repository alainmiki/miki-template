# Filters Reference

`miki-template` ships with a comprehensive set of built‑in filters that mimic Django's filter library. They are grouped by purpose for easy navigation.

## Text Filters
| Filter | Example | Description |
|--------|----------|-------------|
| `upper` | `{{ name|upper }}` | Convert to uppercase |
| `lower` | `{{ name|lower }}` | Convert to lowercase |
| `title` | `{{ name|title }}` | Title‑case (first letter of each word) |
| `capfirst` | `{{ name|capfirst }}` | Capitalise first character |
| `slugify` | `{{ title|slugify }}` | URL‑friendly slug |
| `wordcount` | `{{ article|wordcount }}` | Number of words |
| `striptags` | `{{ html|striptags }}` | Remove HTML tags |
| `linebreaks` | `{{ text|linebreaks }}` | Convert line breaks to `<p>`/`<br>` |
| `truncatewords:N` | `{{ text|truncatewords:5 }}` | Limit to N words |
| `truncatechars:N` | `{{ text|truncatechars:10 }}` | Limit to N characters |

## HTML Filters
| Filter | Example | Description |
|--------|----------|-------------|
| `safe` | `{{ html|safe }}` | Mark string as safe – bypass auto‑escaping |
| `escape` | `{{ user_input|escape }}` | Escape HTML entities |

## List / Sequence Filters
| Filter | Example | Description |
|--------|----------|-------------|
| `length` | `{{ items|length }}` | Return length of array/object |
| `join:sep` | `{{ items|join:", " }}` | Join array items with separator |
| `slice:start:end` | `{{ items|slice:"1:3" }}` | Slice array like Python slicing |
| `dictsort:key` | `{{ dict|dictsort:"name" }}` | Sort object by key |
| `dictsortreversed:key` | `{{ dict|dictsortreversed:"age" }}` | Reverse sort |

## Default / Fallback Filters
| Filter | Example | Description |
|--------|----------|-------------|
| `default:"fallback"` | `{{ value|default:"N/A" }}` | Use fallback if value is falsy |
| `default_if_none:"fallback"` | `{{ value|default_if_none:"N/A" }}` | Use fallback only if value is `null`/`undefined` |

## Date / Time Filters
| Filter | Example | Description |
|--------|----------|-------------|
| `date:"Y-m-d"` | `{{ now|date:"Y-m-d" }}` | Format Date object |
| `time:"H:i"` | `{{ now|time:"H:i" }}` | Format time |
| `timesince` | `{{ past_date|timesince }}` | Human‑readable "time ago" |
| `timeuntil` | `{{ future_date|timeuntil }}` | Human‑readable "time until" |

## Numeric Filters
| Filter | Example | Description |
|--------|----------|-------------|
| `add:5` | `{{ count|add:5 }}` | Add number |
| `divisibleby:2` | `{{ count|divisibleby:2 }}` | Check divisibility |
| `floatformat:2` | `{{ price|floatformat:2 }}` | Format float with 2 decimals |

## Miscellaneous Filters
| Filter | Example | Description |
|--------|----------|-------------|
| `yesno:"yes,no,maybe"` | `{{ flag|yesno:"yes,no,maybe" }}` | Map boolean/None to custom strings |
| `pluralize:"s"` | `{{ count|pluralize:"s" }}` | Append suffix when count != 1 |
| `filesizeformat` | `{{ size|filesizeformat }}` | Human‑readable file size |

All filters are **pure functions** and can be overridden or extended via `registerFilter(name, fn)`.
