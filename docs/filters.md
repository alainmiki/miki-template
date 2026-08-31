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

### `striptags`
Removes all HTML/XML tags from the string.
```html
{{ "<p>Hello <b>World</b></p>"|striptags }}  → "Hello World"
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

### `cut:value`
Removes all occurrences of the specified value from the string.
```html
{{ "Hello World"|cut:" " }}    → "HelloWorld"
{{ "a|b|c"|cut:"|" }}         → "abc"
```

### `addslashes`
Adds backslashes before single quotes, double quotes, and backslashes (for use in JavaScript strings).
```html
{{ 'He said "Hello"|addslashes }}  → 'He said \"Hello\"'
```

### `removetags:tag1,tag2,...`
Removes the named HTML tags (and their contents).
```html
{{ "<p>Hello</p><b>World</b>"|removetags:"p,b" }}  → "HelloWorld"
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

### `escapejs`
Escapes characters for safe use inside JavaScript string literals.
```html
{{ 'Test "quotes" and \backs'|escapejs }}
```

---

## URL / Encoding Filters

### `urlencode`
URL-encodes the string. By default, uses query-string encoding (spaces → `+`).
```html
{{ "Hello World"|urlencode }}          → "Hello+World"
{{ "a/b c"|urlencode }}               → "a%2Fb+c"
```

With `path` modifier, preserves slashes:
```html
{{ "images/logo.png"|urlencode }}      → "images%2Flogo.png" (standard encoding)
```

### `escapeurl` (alias: `urlize`)
Percent-encodes all special characters in a URL.
```html
{{ "https://example.com?q=hello world"|escapeurl }}
→ "https%3A%2F%2Fexample.com%3Fq%3Dhello%20world"
```

---

## String Formatting Filters

### `stringformat:"fmt"`
Formats the value using Python-style format strings (`%s`, `%d`, etc.).
```html
{{ 42|stringformat:"d" }}       → "42"
{{ 3.14159|stringformat:"2f" }} → "3.14"
{{ "x"|stringformat:"s" }}     → "x"
```

### `center:N`
Centers the string in a field of width N (padding with spaces).
```html
{{ "Hi"|center:10 }}  → "    Hi    "
```

### `ljust:N` / `rjust:N`
Left/right-justifies the string in a field of width N.
```html
{{ "Hi"|ljust:10 }}  → "Hi        "
{{ "Hi"|rjust:10 }}  → "        Hi"
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

### `length_is:N`
Returns `true` if the value's length equals N, otherwise `false`.
```html
{{ "hello"|length_is:5 }}   → true
{{ items|length_is:3 }}     → true/false
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

### `first`
Returns the first element of a sequence.
```html
{{ items|first }}  → first item
```

### `last`
Returns the last element of a sequence.
```html
{{ items|last }}   → last item
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
Returns the first truthy value from the arguments (filter form).
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
| `M` | Short month name | `Jan` |

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

---

## Numeric Filters

### `add:N`
Adds N to the value. Also works for string concatenation.
```html
{{ count|add:5 }}        → count + 5
{{ items|add:other }}    → number or concatenated
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

## String Formatting Filters

### `stringformat:"fmt"`
Format a value using Python-style format strings (`%s`, `%d`, `%.2f`, `%x`, etc.).

```html
{{ 42|stringformat:"d" }}       → "42"
{{ 3.14159|stringformat:".2f" }} → "3.14"
{{ "hello"|stringformat:"s" }}  → "hello"
```

---

## URL / Encoding Filters

### `urlencode`
URL-encode a string. Supports `query`, `path`, and `utf-8` modes.

```html
{{ "Hello World"|urlencode }}          → "Hello+World"
{{ "a/b c"|urlencode }}               → "a%2Fb+c"
```

### `escapeuri`
Percent-encode a URI.

```html
{{ "http://example.com/path"|escapeuri }}
```

---

## Text Filters

### `cut:value`
Remove all occurrences of a substring.

```html
{{ "hello hello"|cut:" " }} → "hellohello"
```

### `addslashes`
Add backslashes before quotes and backslashes.

```html
{{ 'He said "Hi"|addslashes }} → He said \"Hi\"
```

### `removetags:tag1,tag2,...`
Remove named HTML tags and their contents.

```html
{{ "<p>Hello</p><b>World</b>"|removetags:"p,b" }} → "HelloWorld"
```

### `length_is:N`
Return `true` if the value's length equals N.

```html
{{ "hello"|length_is:5 }} → true
```

---

## Date / Time Filters

### `strftime:"format"`
Format a Date using `date-fns` format strings. More powerful than the built-in `date` filter.

```html
{{ now|strftime:"PPpp" }}        → "Aug 31, 2026 at 10:24 PM"
{{ now|strftime:"yyyy-MM-dd" }}  → "2026-08-31"
{{ now|strftime:"HH:mm:ss" }}    → "22:24:56"
```
