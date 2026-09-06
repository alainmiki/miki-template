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
| `truncatewords:N` | Truncate to N words | `{{ body \| truncatewords:30 }}` |
| `truncatechars:N` | Truncate to N chars | `{{ title \| truncatechars:50 }}` |
| `truncatechars_html:N` | Truncate HTML-aware chars | `{{ html \| truncatechars_html:100 }}` |
| `wordcount` | Count words | `{{ body \| wordcount }}` |
| `linebreaks` | Convert newlines to `<p>` and `<br>` | `{{ text \| linebreaks }}` |
| `linebreaksbr` | Convert newlines to `<br>` | `{{ text \| linebreaksbr }}` |
| `striptags` | Remove HTML tags | `{{ html \| striptags }}` |
| `slugify` | URL-friendly slug | `{{ title \| slugify }}` |
| `length_is:N` | Test if length equals N | `{% if items\|length_is:0 %}Empty{% endif %}` |

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
| `sort` | Sort array | `{{ items \| sort }}` |
| `unique` | Deduplicate array | `{{ items \| unique }}` |
| `random` | Random item from array | `{{ items \| random }}` |
| `reverse` | Reverse array or string | `{{ items \| reverse }}` |
| `split:","` | Split string into array | `{{ csv \| split:"," }}` |
| `replace:"old,new"` | Replace substring | `{{ text \| replace:"foo,bar" }}` |

## Default Filters

| Filter | Description |
|--------|-------------|
| `default:"fallback"` | Use fallback for empty string, null, or undefined |
| `default_if_none:"fallback"` | Use fallback only for null/undefined |
| `firstof:v1 v2 v3` | Return first truthy value |

## Date/Time Filters

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

## Numeric Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `add:5` | Add number | `{{ x \| add:5 }}` |
| `sub:3` | Subtract number | `{{ x \| sub:3 }}` |
| `mult:2` | Multiply number | `{{ x \| mult:2 }}` |
| `divisibleby:2` | Test divisibility | `{% if x\|divisibleby:2 %}Even{% endif %}` |
| `mod:3` | Modulo | `{{ x \| mod:3 }}` |
| `floatformat:2` | Format float | `{{ price \| floatformat:2 }}` |
| `square` | Square a number | `{{ x \| square }}` |
| `sqrt` | Square root | `{{ x \| sqrt }}` |
| `abs` | Absolute value | `{{ x \| abs }}` |
| `round:2` | Round to decimals | `{{ x \| round:2 }}` |
| `floor` | Floor | `{{ x \| floor }}` |
| `ceil` | Ceiling | `{{ x \| ceil }}` |
| `min:10` | Minimum of value and arg | `{{ x \| min:10 }}` |
| `max:100` | Maximum of value and arg | `{{ x \| max:100 }}` |
| `sum` | Sum array | `{{ items \| sum }}` |
| `average` | Average array | `{{ items \| average }}` |

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

## Math Filters

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

## Chaining Filters

Filters are evaluated left to right:

```html
{{ title|lower|truncatewords:5|capfirst }}
```

## Next Steps

- [Tags](./tags)
- [API Reference: Filters](../api/filters)
