# Filters Reference

`miki-template` includes a comprehensive set of built-in filters matching Django's filter library. Filters are applied to variables using the pipe `|` character, and can be chained: `{{ value|filter1|filter2:"arg" }}`.

---

## Filter Chaining

Filters can be chained — the output of each filter becomes the input of the next:

```html
{{ name|lower|capfirst }}
<!-- "miki" → "miki" → "Miki" -->

{{ user.bio|striptags|truncatewords:20 }}
<!-- Strip HTML tags, then truncate to 20 words -->
```

---

## Text Filters

### `upper`
Converts a string to UPPERCASE.
```html
{{ "hello"|upper }}      → "HELLO"
{{ name|upper }}          → "JOHN"
```

### `lower`
Converts a string to lowercase.
```html
{{ "HELLO"|lower }}      → "hello"
```

### `title`
Converts to Title Case (first letter of each word capitalized).
```html
{{ "hello world"|title }}  → "Hello World"
```

### `capfirst`
Capitalizes only the first character.
```html
{{ "hello"|capfirst }}    → "Hello"
{{ "h"|capfirst }}        → "H"
```

### `slugify`
Converts to a URL-safe slug by lowercasing, removing accents, and replacing spaces with hyphens.
```html
{{ "Hello World!"|slugify }}        → "hello-world"
{{ "Café con Leche"|slugify }}       → "cafe-con-leche"
{{ "  Multiple   Spaces  "|slugify }} → "multiple-spaces"
```

### `wordcount`
Returns the number of words (whitespace-separated tokens).
```html
{{ "one two three"|wordcount }}  → 3
{{ "   "|wordcount }}            → 0
```

### `truncatewords:N`
Truncates the string to approximately N words, appending `...`.
```html
{{ "one two three four five"|truncatewords:3 }}  → "one two three ..."
```

### `truncatechars:N`
Truncates to N characters (including the `...` suffix if truncation occurs).
```html
{{ "Hello World"|truncatechars:8 }}  → "Hello..."
{{ "Hi"|truncatechars:5 }}          → "Hi" (no truncation needed)
```

### `truncatechars_html:N`
Like `truncatechars` but respects HTML tags — tags are preserved in full and only visible text counts toward the limit.
```html
{{ "<p>Hello world</p>"|truncatechars_html:10 }}  → "<p>Hello worl...</p>"
```

### `linebreaks`
Converts newlines into paragraphs (`<p>`) and standalone line breaks into `<br>`.
```html
{{ "Line one\n\nLine two\nLine three"|linebreaks }}
<!-- Output: <p>Line one</p><p>Line two<br>Line three</p> -->
```

### `linebreaksbr`
Converts all newlines to `<br>` tags. Does **not** wrap in `<p>` tags.
```html
{{ "Line one\nLine two"|linebreaksbr }}
<!-- Output: Line one<br>Line two -->
```

### `urlize`
Automatically converts URLs in text into clickable `<a>` links.
```html
{{ "visit https://example.com for more"|urlize }}
<!-- Output: visit <a href="https://example.com">https://example.com</a> for more -->
```

### `cut:value`
Removes all occurrences of the specified value from the string.
```html
{{ "Hello World"|cut:" " }}    → "HelloWorld"
{{ "a|b|c"|cut:"|" }}         → "abc"
```

### `addslashes`
Adds backslashes before single quotes, double quotes, and backslashes.
```html
{{ 'He said "Hello"'|addslashes }}  → 'He said \"Hello\"'
```

### `removetags:tag1,tag2,...`
Removes the named HTML tags (and their contents).
```html
{{ "<p>Hello</p><b>World</b>"|removetags:"p,b" }}  → "HelloWorld"
```

### `reverse`
Reverses a string or array.
```html
{{ "hello"|reverse }}    → "olleh"
{{ items|reverse }}      → [3, 2, 1]
```

### `split:separator`
Splits a string into an array. Default separator is a single space.
```html
{{ "a,b,c"|split:"," }}     → ["a", "b", "c"]
{{ "hello world"|split }}    → ["hello", "world"]
```

### `replace:old,new`
Replaces occurrences of `old` with `new` in the string.
```html
{{ "hello world"|replace:"world,Earth" }}  → "hello Earth"
```

### `length_is:N`
Returns `true` if the value's length equals N, otherwise `false`.
```html
{{ "hello"|length_is:5 }}   → true
{{ items|length_is:3 }}     → true/false
```

---

## HTML / Security Filters

### `safe`
Marks the value as **HTML-safe**, bypassing auto-escaping. Use with caution — never pass unsanitized user input through `|safe`.
```html
{{ "<b>Bold</b>"|safe }}  → <b>Bold</b>  (NOT &lt;b&gt;Bold&lt;/b&gt;)
```

### `escape`
Explicitly escapes HTML entities. Useful when `autoescape` is `off`.
```html
{% autoescape off %}
  {{ user_input|escape }}  → &lt;script&gt;alert()&lt;/script&gt;
{% endautoescape %}
```

---

## URL / Encoding Filters

### `urlencode`
URL-encodes the string. By default, uses query-string encoding (spaces → `+`).
```html
{{ "Hello World"|urlencode }}          → "Hello+World"
{{ "a/b c"|urlencode }}               → "a%2Fb+c"
```

### `escapeuri`
Percent-encodes all special characters in a URI.
```html
{{ "https://example.com?q=hello world"|escapeuri }}
→ "https%3A%2F%2Fexample.com%3Fq%3Dhello%20world"
```

### `base64_encode`
Encodes a string to Base64.
```html
{{ "hello"|base64_encode }}  → "aGVsbG8="
```

### `base64_decode`
Decodes a Base64 string. Returns the original value if decoding fails or produces invalid UTF-8.
```html
{{ "aGVsbG8="|base64_decode }}  → "hello"
```

---

## String Formatting Filters

### `stringformat:"fmt"`
Formats the value using Python-style format strings (`%s`, `%d`, etc.).
```html
{{ 42|stringformat:"d" }}       → "42"
{{ 3.14159|stringformat:".2f" }} → "3.14"
{{ "x"|stringformat:"s" }}     → "x"
```

### `json`
Safely serializes a value to JSON, marked safe for use inside `<script>` blocks.
```html
{{ data|json }}
<!-- Output: {"users":[{"name":"Alice"}]} (not HTML-escaped) -->
```

---

## List / Sequence Filters

### `length`
Returns the length of an array, object, string, or any object with a `.length` property.
```html
{{ items|length }}        → 5 (for arrays)
{{ "hello"|length }}      → 5
{{ object|length }}       → number of keys
{{ undefined|length }}     → 0
```

### `join:separator`
Joins an array with the specified separator.
```html
{{ tags|join:", " }}         → "js, python, rust"
{{ items|join:" + " }}      → "a + b + c"
```

### `slice:"start:end"`
Slices an array or string like Python (`[start:end]`). Supports negative indices.
```html
{{ items|slice:"1:3" }}     → items[1], items[2]
{{ items|slice:":2" }}      → first 2 items
{{ items|slice:"1:" }}      → items from index 1 onwards
{{ "hello"|slice:"1:4" }}   → "ell"
```

### `sort`
Sorts an array in ascending order. Strings use locale-aware comparison.
```html
{{ [3, 1, 2]|sort }}  → [1, 2, 3]
```

### `unique`
Removes duplicate values from an array.
```html
{{ [1, 2, 2, 3]|unique }}  → [1, 2, 3]
```

### `random`
Returns a random element from an array.
```html
{{ ["a", "b", "c"]|random }}  → "b" (random)
```

### `dictsort:"key"`
Sorts an array of objects by the specified attribute (ascending).
```html
{% for item in items|dictsort:"name" %}
  {{ item.name }}
{% endfor %}
```

### `dictsortreversed:"key"`
Sorts an array of objects by the specified attribute (descending).
```html
{% for item in items|dictsortreversed:"price" %}
  {{ item.name }} - ${{ item.price }}
{% endfor %}
```

---

## Default / Fallback Filters

### `default:fallback`
Uses the fallback value if the original value is falsy (`null`, `undefined`, or empty string `""`).
```html
{{ user.name|default:"Anonymous" }}  → "Anonymous" if name is missing
{{ ""|default:"empty" }}              → "empty"
{{ 0|default:"zero" }}                → "zero"
```

### `default_if_none:fallback`
Uses the fallback value only if the original value is `null` or `undefined` (not empty string).
```html
{{ value|default_if_none:"N/A" }}  → "N/A" if value === null or value === undefined
{{ ""|default_if_none:"N/A" }}    → "" (empty string is not none)
```

### `firstof`
Returns the first truthy value from the arguments.
```html
{{ ""|firstof:user.name:guest:default }}  → user.name or "guest" or "default"
```

---

## Date / Time Filters

All date filters accept `Date` objects, ISO strings, or timestamps.

### `date:"format"`
Formats a date using Django-style format codes:
| Code | Meaning | Example |
|------|---------|---------|
| `d` | Day with leading zero | `01–31` |
| `j` | Day without leading zero | `1–31` |
| `m` | Month with leading zero | `01–12` |
| `n` | Month without leading zero | `1–12` |
| `Y` | Full year | `2026` |
| `y` | 2-digit year | `26` |
| `H` | 24-hour with leading zero | `00–23` |
| `i` | Minutes | `00–59` |
| `s` | Seconds | `00–59` |
| `F` | Full month name | `January` |
| `M` | Short day/month name | `Jan` |

```html
{{ post.published|date:"Y-m-d" }}      → "2026-08-31"
{{ post.published|date:"F j, Y" }}    → "August 31, 2026"
{{ post.published|date:"H:i" }}       → "14:30"
```

### `time:"format"`
Same as `date` but only outputs time portion.

### `strftime:"format"`
Uses `date-fns` format patterns (PPpp, yyyy-MM-dd, etc.) for full locale support.
```html
{{ now|strftime:"PPpp" }}        → "Aug 31, 2026 at 2:30 PM"
{{ now|strftime:"yyyy-MM-dd" }}   → "2026-08-31"
```

### `date_format:"format"`
Alias for `strftime` with additional custom patterns.

### `timesince`
Returns a human-readable "time ago" string (e.g., "4 minutes", "2 hours", "3 days").
```html
{{ post.created|timesince }}  → "2 hours"
{{ post.created|timesince:other_date }}  → "3 days" (relative to other_date)
```

### `timeuntil`
Returns a human-readable "time until" string.
```html
{{ event.date|timeuntil }}  → "5 days"
```

### `time_diff:date`
Returns the absolute time difference between two dates as a human-readable string.
```html
{{ event.date|time_diff }}        → "3 days"
{{ event.date|time_diff:now }}    → difference from now
```

### `ago`
Returns a human-readable relative time string like "2 days ago", "1 hour ago", etc.
```html
{{ comment.created|ago }}  → "2 days ago"
{{ comment.created|ago }}  → "just now" (if less than 1 minute ago)
```

### `until`
Returns a human-readable string representing time until the given date.
```html
{{ event.date|until }}  → "3 days"
{{ event.date|until }}  → "now" (if less than 1 minute away)
```

---

## Numeric Filters

### `add:N`
Adds N to the value. Also works for string concatenation and array concatenation.
```html
{{ count|add:5 }}        → count + 5
{{ items|add:other }}    → concatenated array or string
```

### `sub:N`
Subtracts N from the value.
```html
{{ 10|sub:3 }}  → 7
```

### `mult:N`
Multiplies the value by N.
```html
{{ 4|mult:5 }}  → 20
```

### `square`
Returns the square of the value.
```html
{{ 6|square }}  → 36
```

### `sqrt`
Returns the square root of the value. Returns 0 for negative numbers.
```html
{{ 9|sqrt }}    → 3
{{ -1|sqrt }}   → 0
```

### `mod:N`
Returns the modulo (remainder) of the value divided by N. Returns 0 if N is 0.
```html
{{ 10|mod:3 }}  → 1
{{ 10|mod:0 }}  → 0
```

### `divisibleby:N`
Returns `true` if the value is divisible by N.
```html
{{ 10|divisibleby:5 }}    → true
{{ 7|divisibleby:2 }}    → false
```

### `floatformat:N`
Formats a number to N decimal places. Django default is 1 decimal.

| arg | behavior |
|-----|----------|
| (none) | 1 decimal (`3.4`) |
| `0` | 0 decimals (`3`) |
| `1` | 1 decimal (`3.4`) |
| `2` | 2 decimals (`3.40`) |
| `-1` | all decimals, trimmed |

```html
{{ 3.14159|floatformat }}    → "3.1"
{{ 3.14159|floatformat:2 }}  → "3.14"
{{ 3.000|floatformat:0 }}    → "3"
```

### `abs`
Returns the absolute value of a number.
```html
{{ -5|abs }}  → 5
{{ 5|abs }}   → 5
```

### `round:N`
Rounds to N decimal places (default: 0 decimals).
```html
{{ 3.14159|round:2 }}  → 3.14
{{ 3.5|round }}        → 4
{{ 3.4|round }}        → 3
```

### `floor`
Rounds down to the nearest integer.
```html
{{ 3.7|floor }}   → 3
{{ -3.7|floor }}  → -4
```

### `ceil`
Rounds up to the nearest integer.
```html
{{ 3.2|ceil }}   → 4
{{ -3.2|ceil }}  → -3
```

### `min:N` / `min:array`
Returns the minimum of the value and N, or the minimum element in an array.
```html
{{ 5|min:2 }}        → 2
{{ [5, 2, 8]|min }}  → 2
```

### `max:N` / `max:array`
Returns the maximum of the value and N, or the maximum element in an array.
```html
{{ 5|max:2 }}        → 5
{{ [5, 2, 8]|max }}  → 8
```

### `sum`
Returns the sum of all elements in an array.
```html
{{ [1, 2, 3, 4]|sum }}  → 10
```

### `average`
Returns the arithmetic mean of an array. Returns 0 for empty arrays.
```html
{{ [1, 2, 3, 4]|average }}  → 2.5
```

---

## Miscellaneous Filters

### `yesno:"yes,no,maybe"`
Maps truthy / falsy / null values to custom strings.
```html
{{ flag|yesno:"yes,no,maybe" }}   → "yes" if true, "no" if false, "maybe" if null
{{ active|yesno:"Active,Inactive" }} → "Active" or "Inactive"
```

### `pluralize:"s,plural"`
Returns the singular or plural suffix based on the value. Supports custom suffixes.
```html
{{ items|length }} {{ items|pluralize }} item{{ items|pluralize }}
<!-- 1 item | 5 items -->

{{ count|pluralize:"y,ies" }}  → "1 candy" | "2 candies"
```

### `filesizeformat`
Formats a byte count as a human-readable file size.
```html
{{ 1024|filesizeformat }}          → "1.0 KB"
{{ 1048576|filesizeformat }}        → "1.0 MB"
{{ 0|filesizeformat }}              → "0 bytes"
{{ 1536|filesizeformat }}           → "1.5 KB"
```

---

## Data Formatting Filters

### `currency:symbol`
Formats a number as currency with thousands separators and 2 decimal places. Default symbol is `$`.
```html
{{ 1234.5|currency }}       → "$1,234.50"
{{ 1234.5|currency:"€" }}   → "€1,234.50"
```

### `phone_number`
Formats a 10-digit US phone number as `(123) 456-7890`. Handles 11-digit numbers with leading `1` as `+1 (123) 456-7890`.
```html
{{ "1234567890"|phone_number }}       → "(123) 456-7890"
{{ "11234567890"|phone_number }}      → "+1 (123) 456-7890"
```

### `email`
Wraps an email address in a `mailto:` link.
```html
{{ "user@example.com"|email }}  → "mailto:user@example.com"
```

### `url`
Ensures a URL has a protocol prefix. Prepends `https://` if missing.
```html
{{ "example.com"|url }}          → "https://example.com"
{{ "https://example.com"|url }} → "https://example.com"
```

### `mask:char`
Masks all but the last 4 characters of a string. Default mask character is `*`.
```html
{{ "1234567890"|mask }}      → "******7890"
{{ "1234567890"|mask:"#" }}  → "######7890"
```

### `whatsapp_link:message`
Generates a WhatsApp link (`https://wa.me/NUMBER`) with an optional pre-filled message.
```html
{{ "1234567890"|whatsapp_link }}            → "https://wa.me/1234567890"
{{ "1234567890"|whatsapp_link:"Hello" }}    → "https://wa.me/1234567890?text=Hello"
```

### `credit_card`
Formats a credit card number with dashes every 4 digits.
```html
{{ "4111111111111111"|credit_card }}  → "4111-1111-1111-1111"
```

### `ssn`
Formats a 9-digit Social Security Number as `XXX-XX-XXXX`.
```html
{{ "123456789"|ssn }}  → "123-45-6789"
```

### `ip_address`
Formats a 10 or 12 digit string as a dotted IP address.
```html
{{ "192168011001"|ip_address }}  → "192.168.11.001"
```

### `uuid`
Generates a random UUID v4 string.
```html
{{ ""|uuid }}  → "9787a126-cb81-4825-b63b-73345a51a1c1"
```

---

## Humanize Filters (Built-in Library)

These filters are part of the `humanize` library, activated by default or via `{% load humanize %}`.

### `intcomma`
Adds commas to thousands places.
```html
{{ 1234567|intcomma }}  → "1,234,567"
```

### `intword`
Converts large numbers to human-friendly strings.
```html
{{ 1234567|intword }}     → "1.2 million"
{{ 1000|intword }}        → "1.0 thousand"
```

### `apnumber`
Converts numbers to their word equivalent (0–19).
```html
{{ 3|apnumber }}  → "three"
```

### `ordinal`
Returns the ordinal suffix for a number.
```html
{{ 1|ordinal }}   → "1st"
{{ 2|ordinal }}   → "2nd"
{{ 11|ordinal }}  → "11th"
```

### `naturalday`
Returns "today", "yesterday", "tomorrow", or the date string for other dates.
```html
{{ today|naturalday }}      → "today"
{{ yesterday|naturalday }}  → "yesterday"
```

---

## i18n Filters

### `trans:"fallback"`
Translate a string using the i18n registry. Falls back to the original value if no translation is found.

```html
{{ "Hello, World!"|trans }}
{{ greeting|trans:"Hello, %s!" }}
```

---

## Regroup Filter

### `regroup:"key"`
Group an array of objects by a common attribute. Returns an array of `{ grouper, list }` objects.

```html
{% for group in items|regroup:"category" %}
  <h3>{{ group.grouper }}</h3>
  {% for item in group.list %}
    <p>{{ item.name }}</p>
  {% endfor %}
{% endfor %}
```

---

## Custom Filters

Register custom filters with `registerFilter`:

```javascript
const { registerFilter } = require('miki-template');

// Simple filter
registerFilter('reverse', (val) => String(val).split('').reverse().join(''));

// Filter with argument
registerFilter('truncate', (val, length) => {
  const str = String(val);
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
});

// Chaining works automatically:
// {{ name|reverse|truncate:5 }}
```

---

## Filter Argument Types

Filters accept the following argument types:

| Syntax | Type | Example |
|--------|------|---------|
| Unquoted | Variable lookup | `{{ value|filter:count }}` |
| Double-quoted | String literal | `{{ value|filter:"hello" }}` |
| Single-quoted | String literal | `{{ value|filter:'world' }}` |
| Number | Integer literal | `{{ value|truncatewords:10 }}` |

```html
{{ user.name|default:"Guest" }}           <!-- String default -->
{{ items|slice:"1:3" }}                  <!-- Slice notation -->
{{ price|floatformat:2 }}                 <!-- Decimal places -->
```
