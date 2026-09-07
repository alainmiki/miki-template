# Filters

Filters transform variable output using the pipe (`|`) syntax. You can chain multiple filters left-to-right, and many accept arguments after a colon (`:`).

## Usage

```html
{{ name|upper }}
{{ price|floatformat:2 }}
{{ body|truncatewords:30|escape }}
```

## Filter Chaining

Filters apply left-to-right. The output of each filter becomes the input of the next:

```html
{{ name|lower|capfirst }}
<!-- "miki" → "miki" → "Miki" -->

{{ bio|striptags|truncatewords:20 }}
<!-- Strip HTML tags, then truncate to 20 words -->
```

## Filter Arguments

Filters accept the following argument types:

| Syntax | Type | Example |
|--------|------|---------|
| Unquoted | Variable lookup | `{{ value|filter:count }}` |
| Double-quoted | String literal | `{{ value|filter:"hello" }}` |
| Single-quoted | String literal | `{{ value|filter:'world' }}` |
| Number | Integer literal | `{{ value|truncatewords:10 }}` |

## Text Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `upper` | Uppercase | `{{ name \| upper }}` |
| `lower` | Lowercase | `{{ name \| lower }}` |
| `title` | Title case | `{{ name \| title }}` |
| `capfirst` | Capitalize first letter | `{{ name \| capfirst }}` |
| `truncatewords:N` | Truncate to N words, appends ` ...` | `{{ body \| truncatewords:30 }}` |
| `truncatechars:N` | Truncate to N chars, appends `...` | `{{ title \| truncatechars:50 }}` |
| `truncatechars_html:N` | HTML-aware truncation to N chars, preserves tags | `{{ html \| truncatechars_html:100 }}` |
| `wordcount` | Count words | `{{ body \| wordcount }}` |
| `linebreaks` | Convert double newlines to `<p>` and single to `<br>` | `{{ text \| linebreaks }}` |
| `linebreaksbr` | Convert all newlines to `<br>` | `{{ text \| linebreaksbr }}` |
| `striptags` | Remove HTML tags | `{{ html \| striptags }}` |
| `slugify` | URL-friendly slug | `{{ title \| slugify }}` |
| `length_is:N` | Test if length equals N | `{% if items\|length_is:0 %}Empty{% endif %}` |

### truncatechars_html

Like `truncatechars` but respects HTML tags — tags are preserved in full and only visible text counts toward the limit:

```html
{{ "<p>Hello world</p>"|truncatechars_html:10 }}
<!-- → "<p>Hello worl...</p>" -->
```

### linebreaks

Converts newlines into paragraphs (`<p>`) and standalone line breaks into `<br>`:

```html
{{ "Line one\n\nLine two\nLine three"|linebreaks }}
<!-- Output: <p>Line one</p><p>Line two<br>Line three</p> -->
```

### linebreaksbr

Converts all newlines to `<br>` tags. Does **not** wrap in `<p>` tags:

```html
{{ "Line one\nLine two"|linebreaksbr }}
<!-- Output: Line one<br>Line two -->
```

## HTML Filters

| Filter | Description |
|--------|-------------|
| `safe` | Mark string as safe (no escaping) |
| `escape` | Force HTML escaping, even on SafeString |

## List Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `length` | Length of list/string | `{{ items \| length }}` |
| `join:","` | Join with separator | `{{ tags \| join:", " }}` |
| `slice:"start:end"` | Slice list | `{{ items \| slice:"0:5" }}` |
| `dictsort:"key"` | Sort dict by key | `{{ dict \| dictsort:"name" }}` |
| `dictsortreversed:"key"` | Reverse sort dict | `{{ dict \| dictsortreversed:"name" }}` |
| `sort` | Sort array | `{{ items \| sort }}` |
| `unique` | Deduplicate array | `{{ items \| unique }}` |
| `random` | Random item from array | `{{ items \| random }}` |
| `reverse` | Reverse array or string | `{{ items \| reverse }}` |
| `split:","` | Split string into array | `{{ csv \| split:"," }}` |
| `replace:"old,new"` | Replace substring | `{{ text \| replace:"foo,bar" }}` |

### slice

Slices an array or string like Python (`[start:end]`). Supports negative indices:

```html
{{ items|slice:"1:3" }}     → items[1], items[2]
{{ items|slice:":2" }}      → first 2 items
{{ items|slice:"1:" }}      → items from index 1 onwards
{{ "hello"|slice:"1:4" }}   → "ell"
```

## Default Filters

| Filter | Description |
|--------|-------------|
| `default:"fallback"` | Use fallback for empty string, null, or undefined |
| `default_if_none:"fallback"` | Use fallback only for null/undefined |
| `firstof:v1 v2 v3` | Return first truthy value |

### default vs default_if_none

- `default` uses the fallback for falsy values: `null`, `undefined`, `""`, `0`, `false`
- `default_if_none` only uses the fallback for `null` and `undefined`

```html
{{ ""|default:"empty" }}           → "empty"
{{ ""|default_if_none:"N/A" }}     → "" (empty string is not none)
{{ 0|default:"zero" }}             → "zero"
{{ 0|default_if_none:"N/A" }}      → 0 (zero is not none)
```

## Date and Time Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `date:"Y-m-d"` | Format date (Django-style tokens) | `{{ d \| date:"Y-m-d" }}` |
| `time:"H:i"` | Format time | `{{ d \| time:"H:i" }}` |
| `date_format:"yyyy-MM-dd"` | Format date (date-fns tokens) | `{{ d \| date_format:"yyyy-MM-dd" }}` |
| `strftime:"PPpp"` | Format date (strftime/date-fns) | `{{ now \| strftime:"PPpp" }}` |
| `timesince` | Time since date | `{{ created \| timesince }}` |
| `timeuntil` | Time until date | `{{ start \| timeuntil }}` |
| `ago` | Time since date, human-readable | `{{ created \| ago }}` |
| `until` | Time until date, human-readable | `{{ start \| until }}` |
| `time_diff:other_date` | Difference between two dates | `{{ start \| time_diff:end }}` |

### Date format tokens

The `date` filter supports Django-style tokens:

| Token | Output |
|-------|--------|
| `Y` | 4-digit year |
| `y` | 2-digit year |
| `m` | Month number (no pad) |
| `n` | Month number (no pad) |
| `d` | Day number (no pad) |
| `j` | Day number (no pad) |
| `H` | 24-hour hour (no pad) |
| `G` | 24-hour hour (no pad) |
| `i` | Minutes |
| `s` | Seconds |
| `F` | Long month name |
| `D` | Short day name |

### timesince / timeuntil

Returns a human-readable time difference:

```html
{{ post.created|timesince }}  → "2 hours"
{{ post.created|timesince:other_date }}  → "3 days" (relative to other_date)
{{ event.date|timeuntil }}  → "5 days"
```

### ago / until

Returns a human-readable relative time string:

```html
{{ comment.created|ago }}  → "2 days ago"
{{ comment.created|ago }}  → "just now" (if less than 1 minute ago)
{{ event.date|until }}  → "3 days"
```

## Numeric Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `add:N` | Add number | `{{ x \| add:5 }}` |
| `sub:N` | Subtract number | `{{ x \| sub:3 }}` |
| `mult:N` | Multiply number | `{{ x \| mult:2 }}` |
| `divisibleby:N` | Test divisibility | `{% if x\|divisibleby:2 %}Even{% endif %}` |
| `mod:N` | Modulo | `{{ x \| mod:3 }}` |
| `floatformat:N` | Format float | `{{ price \| floatformat:2 }}` |
| `square` | Square a number | `{{ x \| square }}` |
| `sqrt` | Square root | `{{ x \| sqrt }}` |
| `abs` | Absolute value | `{{ x \| abs }}` |
| `round:N` | Round to decimals | `{{ x \| round:2 }}` |
| `floor` | Floor | `{{ x \| floor }}` |
| `ceil` | Ceiling | `{{ x \| ceil }}` |
| `min:N` | Minimum of value and arg | `{{ x \| min:10 }}` |
| `max:N` | Maximum of value and arg | `{{ x \| max:100 }}` |
| `sum` | Sum array | `{{ items \| sum }}` |
| `average` | Average array | `{{ items \| average }}` |

### floatformat behavior

| arg | behavior |
|-----|----------|
| (none) | 1 decimal (`3.4`) |
| `0` | 0 decimals (`3`) |
| `1` | 1 decimal (`3.4`) |
| `2` | 2 decimals (`3.40`) |
| `-1` | all decimals, trimmed |

## Currency and Data Formatting Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `currency:"$"` | Format as currency | `{{ price \| currency:"$" }}` |
| `phone_number` | Format as phone number | `{{ raw \| phone_number }}` |
| `email` | Format as mailto link | `{{ address \| email }}` |
| `url` | Format as URL | `{{ domain \| url }}` |
| `mask:"*"` | Mask string, show last 4 chars | `{{ card \| mask }}` |
| `whatsapp_link:"message"` | Generate WhatsApp link | `{{ phone \| whatsapp_link }}` |
| `credit_card` | Format as credit card | `{{ raw \| credit_card }}` |
| `ssn` | Format as SSN | `{{ raw \| ssn }}` |
| `ip_address` | Format as IP address | `{{ raw \| ip_address }}` |
| `uuid` | Generate UUID | `{% filter uuid %}{% endfilter %}` |
| `filesizeformat` | Human-readable file size | `{{ bytes \| filesizeformat }}` |
| `yesno:"yes,no,maybe"` | Convert bool to string | `{{ active \| yesno:"Active,Inactive" }}` |
| `pluralize:"s"` | Pluralize based on count | `{{ count \| pluralize }}` |
| `urlencode` | URL encode | `{{ text \| urlencode }}` |
| `escapeuri` | URI encode | `{{ text \| escapeuri }}` |
| `stringformat:"%s"` | sprintf-style formatting | `{{ name \| stringformat:"%s" }}` |
| `cut:"text"` | Remove substring | `{{ text \| cut:"foo" }}` |
| `addslashes` | Escape quotes | `{{ text \| addslashes }}` |
| `removetags:"p,div"` | Remove specific tags | `{{ html \| removetags:"p,div" }}` |
| `trans` | Translate via i18n | `{{ "hello" \| trans }}` |
| `regroup:"attr"` | Group list by attribute | `{% for g in items\|regroup:"category" %}` |
| `json` | JSON-encode value | `{{ obj \| json }}` |
| `urlize` | Convert URLs to links | `{{ text \| urlize }}` |

### phone_number

Formats a 10-digit US phone number as `(123) 456-7890`. Handles 11-digit numbers with leading `1` as `+1 (123) 456-7890`:

```html
{{ "1234567890"|phone_number }}       → "(123) 456-7890"
{{ "11234567890"|phone_number }}      → "+1 (123) 456-7890"
```

### credit_card

Formats a credit card number with dashes every 4 digits:

```html
{{ "4111111111111111"|credit_card }}  → "4111-1111-1111-1111"
```

### ssn

Formats a 9-digit Social Security Number as `XXX-XX-XXXX`:

```html
{{ "123456789"|ssn }}  → "123-45-6789"
```

### ip_address

Formats a 10 or 12 digit string as a dotted IP address:

```html
{{ "192168011001"|ip_address }}  → "192.168.11.001"
```

### mask

Masks all but the last 4 characters of a string. Default mask character is `*`:

```html
{{ "1234567890"|mask }}      → "******7890"
{{ "1234567890"|mask:"#" }}  → "######7890"
```

### whatsapp_link

Generates a WhatsApp link (`https://wa.me/NUMBER`) with an optional pre-filled message:

```html
{{ "1234567890"|whatsapp_link }}            → "https://wa.me/1234567890"
{{ "1234567890"|whatsapp_link:"Hello" }}    → "https://wa.me/1234567890?text=Hello"
```

### url

Ensures a URL has a protocol prefix. Prepends `https://` if missing:

```html
{{ "example.com"|url }}          → "https://example.com"
{{ "https://example.com"|url }} → "https://example.com"
```

### email

Wraps an email address in a `mailto:` link:

```html
{{ "user@example.com"|email }}  → "mailto:user@example.com"
```

### json

Safely serializes a value to JSON, marked safe for use inside `<script>` blocks:

```html
{{ data|json }}
<!-- Output: {"users":[{"name":"Alice"}]} (not HTML-escaped) -->
```

### stringformat

Formats the value using Python-style format strings (`%s`, `%d`, etc.):

```html
{{ 42|stringformat:"d" }}       → "42"
{{ 3.14159|stringformat:".2f" }} → "3.14"
{{ "x"|stringformat:"s" }}     → "x"
```

## Time Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `time_diff:other` | Human-readable time difference | `{{ start \| time_diff:end }}` |
| `ago` | Time since date | `{{ created \| ago }}` |
| `until` | Time until date | `{{ start \| until }}` |

## Encoding Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `base64_encode` | Base64 encode | `{{ text \| base64_encode }}` |
| `base64_decode` | Base64 decode | `{{ text \| base64_decode }}` |

## Built-in Library Filters

### humanize

Available after `{% load humanize %}`:

| Filter | Description | Example |
|--------|-------------|---------|
| `intcomma` | Add comma separators | `{{ views \| intcomma }}` → `1,234` |
| `intword` | Convert to human word | `{{ 1000000 \| intword }}` → `1.0 million` |
| `apnumber` | Convert 0-19 to words | `{{ 3 \| apnumber }}` → `three` |
| `ordinal` | Add ordinal suffix | `{{ 1 \| ordinal }}` → `1st` |
| `naturalday` | Convert date to relative day | `{{ date \| naturalday }}` → `today` |

Usage:

```html
{% load humanize %}
{{ views|intcomma }}
{{ count|ordinal }}
```

### cache

The `cache` library provides a `{% cache %}` tag, not a filter.

### lorem

The `lorem` library provides a `{% lorem %}` tag and a `lorem` filter.

## Next Steps

- [Tags](./tags)
- [API Reference: Filters](../api/filters)
