# Filters API



## registerFilter



Register a custom filter callable from templates as `{{ value|filter_name:arg }}`.



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



### Filter Signature



Filters receive `(value, argument, context)` and must return a string (or `SafeString`):



```javascript

registerFilter('greet', (val, greeting, context) => {

  return `${greeting}, ${val}!`;

});

```



### Async Filters



Filters that return a Promise are awaited automatically when using `asyncRender()`:



=== "CommonJS"



    ```javascript

    const { registerFilter, asyncRender } = require('miki-template');



    registerFilter('fetch_data', async (url) => {

      const res = await fetch(url);

      return res.text();

    });



    const html = await asyncRender('{{ endpoint|fetch_data }}', {

      endpoint: 'https://api.example.com/data'

    });

    ```



=== "ES Modules"



    ```javascript

    import { registerFilter, asyncRender } from 'miki-template';



    registerFilter('fetch_data', async (url) => {

      const res = await fetch(url);

      return res.text();

    });



    const html = await asyncRender('{{ endpoint|fetch_data }}', {

      endpoint: 'https://api.example.com/data'

    });

    ```



## getFilter



Retrieve a registered filter by name.



=== "CommonJS"



    ```javascript

    const { getFilter } = require('miki-template);



    const reverseFilter = getFilter('reverse');

    console.log(reverseFilter('hello')); // 'olleh'

    ```



=== "ES Modules"



    ```javascript

    import { getFilter } from 'miki-template';



    const reverseFilter = getFilter('reverse');

    ```



## Built-in Filters



### Text Filters



| Filter | Description |

|--------|-------------|

| `upper` | Uppercase |

| `lower` | Lowercase |

| `title` | Title case |

| `capfirst` | Capitalize first character |

| `truncatewords:N` | Truncate to N words |

| `truncatechars:N` | Truncate to N characters (ellipsis) |

| `truncatechars_html:N` | Truncate to N chars, preserving HTML |

| `wordcount` | Count words |

| `striptags` | Remove HTML tags |

| `slugify` | Convert to URL-friendly slug |

| `linebreaks` | Convert newlines to `<br>` and `<p>` |

| `linebreaksbr` | Convert newlines to `<br>` |

| `length_is:N` | Return length if equals N, else empty |



### HTML Filters



| Filter | Description |

|--------|-------------|

| `safe` | Mark as safe (no escaping) |

| `escape` | Force HTML escaping |



### List Filters



| Filter | Description |

|--------|-------------|

| `length` | Number of items |

| `join:sep` | Join items with separator |

| `slice:"start:end"` | Slice a list/string |

| `dictsort:"key"` | Sort by key (ascending) |

| `dictsortreversed:"key"` | Sort by key (descending) |

| `sort` | Sort items |

| `unique` | Remove duplicates |

| `random` | Random item |

| `reverse` | Reverse order |

| `split:sep` | Split string into list |

| `replace:"old,new"` | Replace occurrences |



### Default Filters



| Filter | Description |

|--------|-------------|

| `default:"fallback"` | Show fallback if value is falsy |

| `default_if_none:"fallback"` | Show fallback if value is `null`/`undefined` |

| `firstof:v1 v2 v3` | First non-empty value |



### Date/Time Filters



| Filter | Description |

|--------|-------------|

| `date:"Y-m-d"` | Django-style date format |

| `time:"H:i"` | Django-style time format |

| `date_format:"yyyy-MM-dd"` | Intl-style date format |

| `strftime:"PPPP"` | Intl-style time format |

| `timesince` | Time since date ("2 hours ago") |

| `timeuntil` | Time until date |

| `ago` | Short time-ago ("2m", "3h") |

| `until` | Short time-until |

| `time_diff:other_date` | Difference between two dates |



### Numeric Filters



| Filter | Description |

|--------|-------------|

| `add:N` | Add N |

| `sub:N` | Subtract N |

| `mult:N` | Multiply by N |

| `divisibleby:N` | Check divisibility |

| `mod:N` | Modulo |

| `floatformat:N` | Format float with N decimals |

| `square` | Square a number |

| `sqrt` | Square root |

| `abs` | Absolute value |

| `round:N` | Round to N decimals |

| `floor` | Floor |

| `ceil` | Ceiling |

| `min:N` | Minimum of value and N |

| `max:N` | Maximum of value and N |

| `sum` | Sum of list |

| `average` | Average of list |



### Currency and Data Formatting



| Filter | Description |

|--------|-------------|

| `currency:"$"` | Format as currency |

| `phone_number` | Format phone number |

| `email` | Format as email link |

| `url` | Format as URL link |

| `mask:"*"` | Mask sensitive data |

| `whatsapp_link:"msg"` | Generate WhatsApp link |

| `credit_card` | Format credit card number |

| `ssn` | Format SSN |

| `ip_address` | Format IP address |

| `uuid` | Format UUID |

| `filesizeformat` | Human-readable file size |

| `yesno:"yes,no,maybe"` | Yes/no based on boolean |

| `pluralize:"s"` | Add plural suffix if needed |

| `urlencode` | URL-encode |

| `escapeuri` | Escape URI component |

| `stringformat:"%s"` | String format |

| `cut:"text"` | Remove occurrences |

| `addslashes` | Add slashes |

| `removetags:"p,div"` | Remove specified tags |

| `trans:"key"` | Translate key |

| `regroup:"attr"` | Regroup list by attribute |

| `json` | Serialize to JSON |

| `urlize` | Auto-link URLs in text |



### Encoding Filters



| Filter | Description |

|--------|-------------|

| `base64_encode` | Base64 encode |

| `base64_decode` | Base64 decode |



## Next Steps



- [Filters Guide](../guide/filters.md)

- [Custom Filters](../guide/custom-filters.md)

- [API Reference](../)

