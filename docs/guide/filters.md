# Filters



Filters transform variable output using the pipe (`|`) syntax. You can chain multiple filters left-to-right, and many accept arguments after a colon (`:`).



## Table of Contents



- [Basic Usage](#basic-usage)

- [Filter Chaining](#filter-chaining)

- [Filter Arguments](#filter-arguments)

- [Text Filters](#text-filters)

- [HTML / Security Filters](#html-security-filters)

- [List / Array Filters](#list-array-filters)

- [Default Value Filters](#default-value-filters)

- [Date and Time Filters](#date-and-time-filters)

- [Numeric / Math Filters](#numeric-math-filters)

- [Data Formatting Filters](#data-formatting-filters)

- [Encoding Filters](#encoding-filters)

- [Time-Ago Filters](#time-ago-filters)

- [Built-in Library Filters](#built-in-library-filters)

- [Writing Custom Filters](#writing-custom-filters)



---



## Basic Usage



```html

{{ name|upper }}

{{ price|floatformat:2 }}

{{ body|truncatewords:30|escape }}

```



Each `|` applies a filter to the value on its left. Filters are evaluated left-to-right: the output of one filter becomes the input of the next.



## Filter Chaining



Filters apply left-to-right. The output of each filter becomes the input of the next:



```html

{{ name|lower|capfirst }}

<!-- "Miki" → "miki" → "Miki" -->



{{ bio|striptags|truncatewords:20 }}

<!-- Strip HTML tags, then truncate to 20 words -->



{{ text|escape|truncatechars:50|upper }}

```



You can chain any number of filters:



```html

{{ price|mult:1.2|add:2|floatformat:2|currency:"$" }}

<!-- price = 10 → 12.0 → 14.0 → "14.00" → "$14.00" -->

```



## Filter Arguments



Filters accept the following argument types:



| Syntax | Type | Example |

|--------|------|---------|

| Unquoted | Variable lookup | `value|filter:count` |

| Double-quoted | String literal | `value|filter:"hello"` |

| Single-quoted | String literal | `value|filter:'world'` |

| Number | Integer/float literal | `value|truncatewords:10` |

| Boolean | `true`/`false` | `value|yesno:"yes,no"` |



**Real-world example — conditional greeting with fallback:**



```html

<h1>{{ user.name|default:"Guest"|capfirst }}</h1>

<span class="badge {% if user.is_premium|yesno:"yes,no" %}premium{% else %}free{% endif %}">

  {{ user.plan|default:"Free" }}

</span>

```



---



## Text Filters



| Filter | Description | Example |

|--------|-------------|---------|

| `upper` | Uppercase | `{{ "hello"|upper }}` |

| `lower` | Lowercase | `{{ "HELLO"|lower }}` |

| `title` | Title case | `{{ "miki coder"|title }}` |

| `capfirst` | Capitalize first letter | `{{ "hello"|capfirst }}` |

| `truncatewords:N` | Truncate to N words, appends ` ...` | `{{ body|truncatewords:30 }}` |

| `truncatechars:N` | Truncate to N chars, appends `...` | `{{ title|truncatechars:50 }}` |

| `truncatechars_html:N` | HTML-aware truncation to N chars, preserves tags | `{{ html|truncatechars_html:100 }}` |

| `wordcount` | Count words | `{{ body|wordcount }}` |

| `linebreaks` | Convert double newlines to `<p>` and single to `<br>` | `{{ text|linebreaks }}` |

| `linebreaksbr` | Convert all newlines to `<br>` | `{{ text|linebreaksbr }}` |

| `striptags` | Remove HTML tags | `{{ html|striptags }}` |
| `repeat` | Repeat a string N times | `{{ "ha"|repeat:3 }}` |
| `range` | Generate a range of integers | `{{ 5|range }}` |


| `slugify` | URL-friendly slug | `{{ title|slugify }}` |

| `length_is:N` | Test if length equals N | `{{ items|length_is:0 }}` |



### truncatechars_html



Like `truncatechars` but respects HTML tags — tags are preserved in full and only visible text counts toward the limit:



```html

{{ "<p>Hello world</p>"|truncatechars_html:10 }}

<!-- → "<p>Hello worl...</p>" -->

```



**Real-world blog excerpt:**



```html

<article>

  {{ post.body|truncatechars_html:200 }}

</article>

```



### linebreaks



Converts newlines into paragraphs (`<p>`) and standalone line breaks into `<br>`:



```html

{{ "Line one\n\nLine two\nLine three"|linebreaks }}

<!-- Output: <p>Line one</p><p>Line two<br>Line three</p> -->

```



### slugify



Converts text to a URL-safe slug (lowercase, hyphens, no special characters):



```html

<a href="/posts/{{ post.title|slugify }}">{{ post.title }}</a>

<!-- title: "Hello World: A New Beginning!" → href="/posts/hello-world-a-new-beginning" -->

```



### wordcount



Use with `pluralize` for dynamic labels:



```html

<p>{{ post.body|wordcount }} {{ post.body|wordcount|pluralize:"word,words" }} read</p>

```



---



## HTML / Security Filters



| Filter | Description |

|--------|-------------|

| `safe` | Mark string as safe (no escaping) |

| `escape` | Force HTML escaping, even on SafeString |



**Real-world CMS rendering:**



```html

<!-- Body is trusted HTML from the CMS -->

<div class="content">{{ post.body_html|safe }}</div>



<!-- User comments are always escaped -->

<div class="comment">{{ comment.text|escape }}</div>

```



---



## List / Array Filters



| Filter | Description | Example |

|--------|-------------|---------|

| `length` | Length of list/string | `{{ items|length }}` |

| `join:","` | Join with separator | `{{ tags|join:", " }}` |

| `slice:"start:end"` | Slice list | `{{ items|slice:"0:5" }}` |

| `dictsort:"key"` | Sort dict by key | `{{ dict|dictsort:"name" }}` |

| `dictsortreversed:"key"` | Reverse sort dict | `{{ dict|dictsortreversed:"name" }}` |

| `sort` | Sort array | `{{ items|sort }}` |

| `unique` | Deduplicate array | `{{ tags|unique }}` |

| `random` | Random item from array | `{{ items|random }}` |

| `reverse` | Reverse array or string | `{{ items|reverse }}` |

| `split:","` | Split string into array | `{{ csv|split:"," }}` |

| `replace:"old,new"` | Replace substring | `{{ text|replace:"foo,bar" }}` |



### slice



Slices an array or string like Python (`[start:end]`). Supports negative indices:



```html

<!-- First 3 items -->

{{ items|slice:"0:3" }}



<!-- From index 2 onwards -->

{{ items|slice:"2:" }}



<!-- Last 2 items -->

{{ items|slice:"-2:" }}

```



### join



**Real-world tag cloud:**



```html

<div class="tag-cloud">

  {% for tag in post.tags|join:", " %}

    <span class="tag">{{ tag }}</span>

  {% endfor %}

</div>

<!-- But better as: -->

<span class="tag-cloud">{{ post.tags|join:", " }}</span>

```



### sort + unique



**Real-world: deduplicated, sorted navigation:**



```html

<ul>

  {% for category in categories|sort %}

    <li>{{ category|capfirst }}</li>

  {% endfor %}

</ul>

```



### split



**Real-world: parsing comma-separated metadata:**



```html

<!-- post.keywords = "nature,landscape,autumn" -->

<div class="meta">

  {% for kw in post.keywords|split:"," %}

    <a href="/tag/{{ kw|slugify }}">{{ kw|capfirst }}</a>

  {% endfor %}

</div>

```



---



## Default Value Filters



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



**Real-world user profile:**



```html

<!-- Show "No bio yet" only when bio is truly empty -->

<p class="bio">{{ user.bio|default:"No bio yet." }}</p>



<!-- Distinguish between "never set" and "explicitly empty" -->

{% if user.display_name %}

  <h2>{{ user.display_name|default_if_none:"Anonymous" }}</h2>

{% endif %}

```



---



## Date and Time Filters



| Filter | Description | Example |

|--------|-------------|---------|

| `date:"Y-m-d"` | Format date (Django-style tokens) | `{{ d|date:"Y-m-d" }}` |

| `time:"H:i"` | Format time | `{{ d|time:"H:i" }}` |

| `date_format:"yyyy-MM-dd"` | Format date (date-fns tokens) | `{{ d|date_format:"yyyy-MM-dd" }}` |

| `strftime:"PPpp"` | Format date (date-fns tokens) | `{{ now|strftime:"PPpp" }}` |

| `timesince` | Time since date | `{{ created|timesince }}` |

| `timeuntil` | Time until date | `{{ start|timeuntil }}` |

| `ago` | Time since date, human-readable | `{{ created|ago }}` |

| `until` | Time until date, human-readable | `{{ start|until }}` |

| `time_diff:other_date` | Difference between two dates | `{{ start|time_diff:end }}` |



### Date format tokens (`date` and `time` filters)



The `date` filter uses Django-style format tokens with longest-first matching:



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

| `M` | Long month name |



### date_format and strftime (date-fns tokens)



For ISO and date-fns patterns:



```html

{{ post.published_at|date_format:"yyyy-MM-dd" }}  → "2026-08-31"

{{ post.published_at|strftime:"PPpp" }}           → "Aug 31, 2026 at 10:30 PM"

{{ event.date|strftime:"EEEE, MMMM do yyyy, h:mm a" }} → "Sunday, August 31st 2026, 10:30 PM"

```



### timesince / timeuntil



Returns a human-readable time difference:



```html

{{ post.created|timesince }}  → "2 hours"

{{ post.created|timesince:other_date }}  → "3 days" (relative to other_date)

{{ event.date|timeuntil }}  → "5 days"

```



### ago / until



More human-readable relative time strings:



```html

<!-- "2 days ago", "just now", "3 months ago" -->

<span class="timestamp">{{ comment.created|ago }}</span>



<!-- "2 days", "3 weeks", "1 month" -->

<time datetime="{{ event.date|date:'c' }}">{{ event.date|until }}</time>

```



**Real-world blog post metadata:**



```html

<article class="post">

  <header>

    <h1>{{ post.title }}</h1>

    <time class="posted-at">

      Published {{ post.published_at|date:"F j, Y" }} ({{ post.published_at|ago }})

    </time>

  </header>

  <div class="content">

    {{ post.body|linebreaks }}

  </div>

</article>

```



---



## Numeric / Math Filters



| Filter | Description | Example |

|--------|-------------|---------|

| `add:N` | Add number | `{{ count\|add:1 }}` |

| `sub:N` | Subtract number | `{{ total\|sub:tax }}` |

| `mult:N` | Multiply number | `{{ price\|mult:1.2 }}` |

| `divisibleby:N` | Test divisibility | `{{ i\|divisibleby:2 }}` |

| `mod:N` | Modulo | `{{ i\|mod:3 }}` |

| `floatformat:N` | Format float | `{{ price\|floatformat:2 }}` |

| `square` | Square a number | `{{ n\|square }}` |

| `sqrt` | Square root | `{{ n\|sqrt }}` |

| `abs` | Absolute value | `{{ delta\|abs }}` |

| `round:N` | Round to N decimals | `{{ price\|round:2 }}` |

| `floor` | Floor | `{{ ratio\|floor }}` |

| `ceil` | Ceiling | `{{ ratio\|ceil }}` |

| `min:N` | Minimum of value and arg | `{{ temp\|min:0 }}` |

| `max:N` | Maximum of value and arg | `{{ temp\|max:100 }}` |

| `sum` | Sum array | `{{ numbers\|sum }}` |

| `average` | Average array | `{{ scores\|average }}` |



### floatformat behavior



| arg | behavior |

|-----|----------|

| (none) | 1 decimal (`3.4`) |

| `0` | 0 decimals (`3`) |

| `1` | 1 decimal (`3.4`) |

| `2` | 2 decimals (`3.40`) |

| `-1` | all decimals, trimmed |



### Real-world pricing example



```html

<td class="price">

  ${{ item.price|mult:item.qty|floatformat:2 }}

</td>

<!-- If not on sale, apply discount -->

{% if not item.on_sale %}

  <td>{{ item.base_price|mult:0.9|floatformat:2 }}</td>

{% endif %}

```



---



## Data Formatting Filters



| Filter | Description | Example |

|--------|-------------|---------|

| `currency:"$"` | Format as currency | `{{ price|currency:"$" }}` |

| `phone_number` | Format as phone number | `{{ raw|phone_number }}` |

| `email` | Format as mailto link | `{{ address|email }}` |

| `url` | Format as URL | `{{ domain|url }}` |

| `mask:"*"` | Mask string, show last 4 chars | `{{ card|mask }}` |

| `whatsapp_link:"msg"` | Generate WhatsApp link | `{{ phone|whatsapp_link }}` |

| `credit_card` | Format as credit card | `{{ raw|credit_card }}` |

| `ssn` | Format as SSN | `{{ raw|ssn }}` |

| `ip_address` | Format as IP address | `{{ raw|ip_address }}` |

| `uuid` | Generate UUID (no input needed) | `{{ x|uuid }}` |

| `filesizeformat` | Human-readable file size | `{{ bytes|filesizeformat }}` |

| `yesno:"yes,no,maybe"` | Convert bool to string | `{{ active|yesno:"Active,Inactive" }}` |

| `pluralize:"s"` | Pluralize based on count | `{{ count|pluralize }}` |

| `urlencode` | URL encode | `{{ text|urlencode }}` |

| `escapeuri` | URI encode | `{{ text|escapeuri }}` |

| `stringformat:"%s"` | sprintf-style formatting | `{{ name|stringformat:"%s" }}` |

| `cut:"text"` | Remove substring | `{{ text|cut:"foo" }}` |

| `addslashes` | Escape quotes | `{{ text|addslashes }}` |

| `removetags:"p,div"` | Remove specific tags | `{{ html|removetags:"p,div" }}` |

| `trans` | Translate via i18n | `{{ "hello"|trans }}` |

| `regroup:"attr"` | Group list by attribute | `{{ items|regroup:"category" }}` |

| `json` | JSON-encode value | `{{ obj|json }}` |

| `urlize` | Convert URLs to links | `{{ text|urlize }}` |



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



Formats a 9-digit Social Security Number:



```html

{{ "123456789"|ssn }}  → "123-45-6789"

```



### mask



Masks all but the last 4 characters. Default mask character is `*`:



```html

<!-- Mask a phone number or credit card in display -->

<span class="masked">{{ user.phone|mask }}</span>



<!-- Custom mask character -->

{{ "1234567890"|mask:"#" }}  → "######7890"

```



### url (with safe filter)



```html

<a href="{{ post.share_url|url|safe }}">{{ post.share_url|url }}</a>

```



### email



```html

<a href="{{ user.email|email }}">{{ user.email }}</a>

<!-- → <a href="mailto:user@example.com">user@example.com</a> -->

```



### whatsapp_link



Generates a WhatsApp link with an optional pre-filled message:



```html

<a href="{{ phone|whatsapp_link:"Hello! I'd like to know more." }}" target="_blank">

  Chat on WhatsApp

</a>

```



### json (safe for `<script>` blocks)



Safely serializes data to JSON for client-side consumption:



```html

<script>

  const initialState = {{ page_state|json|safe }};

</script>

```



> Note: `json` output is marked safe automatically. Use `|safe` in the template only to signal intent — the engine handles it correctly either way.



### stringformat



```html

{{ 3.14159|stringformat:".2f" }}  → "3.14"

{{ count|stringformat:"04d" }}     → "0042"

{{ name|stringformat:"%s" }}        → "Alice"

```



### cut



Removes all occurrences of a substring:



```html

<!-- Sanitize a URL by removing unwanted query params -->

{{ request_uri|cut:"?debug=1" }}

```



### pluralize



**Real-world item count:**



```html

<p>{{ cart.items|length }} item{{ cart.items|length|pluralize }} in your cart</p>

<!-- "1 item in your cart" / "3 items in your cart" -->



<!-- Custom suffixes -->

<p>{{ count|pluralize:"y,ies" }} comment{{ count|pluralize:"y,ies" }}</p>

```



### yesno



**Real-world status badge:**



```html

<span class="status {{ user.is_active|yesno:"active,inactive" }}">

  {{ user.is_active|yesno:"Active,Inactive" }}

</span>

```



---



## Encoding Filters



| Filter | Description | Example |

|--------|-------------|---------|

| `base64_encode` | Base64 encode | `{{ text|base64_encode }}` |

| `base64_decode` | Base64 decode | `{{ text|base64_decode }}` |



### Real-world: embedding a CSRF token in a header



```html

<meta name="csrf-token" content="{{ csrf_token|base64_encode }}">

```



---



## Time-Ago Filters



| Filter | Description | Example |

|--------|-------------|---------|

| `time_diff:other` | Human-readable time difference | `{{ start|time_diff:end }}` |

| `ago` | Time since date | `{{ created|ago }}` |

| `until` | Time until date | `{{ start|until }}` |



### ago — human-readable "time since"



```html

<!-- "just now", "5 minutes ago", "2 hours ago", "3 days ago", "1 year ago" -->

<span class="time-ago">{{ post.created_at|ago }}</span>

```



### until — human-readable "time remaining"



```html

<!-- "2 days", "3 weeks", "1 month" -->

<span class="countdown">{{ auction.ends_at|until }}</span>

```



---



## Built-in Library Filters



### humanize



Available after `{% load humanize %}`:



| Filter | Description | Example |

|--------|-------------|---------|

| `intcomma` | Add comma separators | `{{ views|intcomma }}` → `1,234` |

| `intword` | Convert to human word | `{{ 1000000|intword }}` → `1.0 million` |

| `apnumber` | Convert 0-19 to words | `{{ 3|apnumber }}` → `three` |

| `ordinal` | Add ordinal suffix | `{{ 1|ordinal }}` → `1st` |

| `naturalday` | Convert date to relative day | `{{ date|naturalday }}` → `today` |



Usage:



```html

{% load humanize %}

{{ post.view_count|intcomma }}

{{ comment_count|ordinal }}

```



### cache



The `cache` library provides a `{% cache %}` tag, not a filter. See [Tags: Library Loading](tags.md#library-loading) for details.



### lorem



The `lorem` library provides a `{% lorem %}` tag and a `lorem` filter. These are auto-activated (no `{% load %}` needed).



```html

<!-- Generate placeholder text -->

{{ 5|lorem }}

```



---



## Writing Custom Filters



You can register your own filters. See the [Custom Filters guide](custom-filters.md) for details.



=== "CommonJS"



    ```javascript

    const { registerFilter } = require('miki-template');



    registerFilter('reverse', (val) => {

      return String(val).split('').reverse().join('');

    });

    ```



=== "ES Modules"



    ```javascript

    import { registerFilter } from 'miki-template';



    registerFilter('reverse', (val) => {

      return String(val).split('').reverse().join('');

    });

    ```



---

# Filter Documentation

## `repeat`

**Signature:** `repeat(value, count)`

- **Purpose:** Returns a new string consisting of `value` repeated `count` times.
- **Parameters:**
  - `value` – Any value that can be converted to a string (null/undefined become empty string).
  - `count` – Number of repetitions, parsed as integer; non‑positive yields empty string.
- **Implementation:** Uses native `String.prototype.repeat` for optimal V8 performance.
- **Example:** `{{ "ab"|repeat:3 }}  => "ababab"`

## `range`

**Signature:** `range(end, start?)`

- **Purpose:** Generates an array of integers from `start` (inclusive) to `end` (exclusive) with step 1.
- **Parameters:**
  - `end` – Upper bound (exclusive), parsed as integer.
  - `start` – Optional lower bound, defaults to `0`.
- **Implementation:** Simple for‑loop building a JavaScript array.
- **Example:** `{% for i in 5|range %}{{ i }}{% endfor %}` outputs `0 1 2 3 4`.

## Additional Django Filters

The following filters complete parity with the vscode-django-support extension:

### String formatting

| Filter | Signature | Example | Output |
|--------|-----------|---------|--------|
| `center` | `center(width)` | `"hello"|center:"15"` | `"     hello     "` |
| `ljust` | `ljust(width)` | `"hi"|ljust:"10"` | `"hi        "` |
| `rjust` | `rjust(width)` | `"hi"|rjust:"10"` | `"        hi"` |
| `wordwrap` | `wordwrap(width)` | `"hello world"|wordwrap:"5"` | wrapped lines |
| `linenumbers` | `linenumbers` | `"a\nb"|linenumbers` | `"1. a\n2. b"` |
| `make_list` | `make_list` | `"hello"|make_list` | `["h","e","l","l","o"]` |
| `slugify` | already supported | — | — |

### HTML / escaping

| Filter | Signature | Example | Output |
|--------|-----------|---------|--------|
| `escapejs` | `escapejs` | `"<b>"|escapejs` | `\x3Cb\x3E` |
| `force_escape` | `force_escape` | `"<b>"|force_escape` | `&lt;b&gt;` |
| `fix_ampersands` | `fix_ampersands` | `"A & B"|fix_ampersands` | `A &amp; B` |
| `safeseq` | `safeseq` | `list|safeseq` | marks all items safe |

### Sequence / object

| Filter | Signature | Example | Output |
|--------|-----------|---------|--------|
| `first` | `first` | `"abc"|first` | `"a"` |
| `last` | `last` | `"abc"|last` | `"c"` |
| `length_is` | already supported | — | — |
| `random` | already supported | — | — |
| `slice` | already supported | — | — |

### Numbers / dates

| Filter | Signature | Example | Output |
|--------|-----------|---------|--------|
| `apnumber` | `apnumber` | `"5"|apnumber` | `"five"` |
| `intcomma` | `intcomma` | `"1000"|intcomma` | `"1,000"` |
| `intword` | `intword` | `"1500000"|intword` | `"1.5 million"` |
| `ordinal` | `ordinal` | `"1"|ordinal` | `"1st"` |
| `naturalday` | `naturalday` | `"2026-01-01"|naturalday` | `"today"` / `"yesterday"` / date |
| `get_digit` | `get_digit(index)` | `"12345"|get_digit:"2"` | `"3"` |
| `timeutil` | `timeutil(date?)` | alias for `timeuntil` | — |

### Lists / grouping

| Filter | Signature | Example | Output |
|--------|-----------|---------|--------|
| `unordered_list` | `unordered_list` | `items|unordered_list` | `<ul>...</ul>` |
| `truncatewords_html` | `truncatewords_html(count)` | HTML string | truncated HTML |

### URLs / encoding

| Filter | Signature | Example | Output |
|--------|-----------|---------|--------|
| `urlizetrunc` | `urlizetrunc(len)` | URL string | `<a href="...">...</a>` |
| `iriencode` | `iriencode` | `"hello world"|iriencode` | `"hello%20world"` |

### Misc

| Filter | Signature | Example | Output |
|--------|-----------|---------|--------|
| `pprint` | `pprint` | `obj|pprint` | pretty-printed JSON |
| `phone2numeric` | `phone2numeric` | `"1-800-CALL"|phone2numeric` | `"1-800-2255"` |
| `STATIC_PREFIX` | `STATIC_PREFIX` | `"css/app.css"|STATIC_PREFIX` | `"/static/css/app.css"` |

These filters are covered by unit tests in `tests/filters.test.js` and are documented here for developers and template authors.




## Next Steps



- [Custom Filters](./custom-filters.md)

- [Tags](./tags.md)

- [API Reference: Filters](../api/filters.md)

