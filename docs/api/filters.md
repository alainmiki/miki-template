# Filters API

## registerFilter

Register a custom filter.

```javascript
const { registerFilter } = require('miki-template');

registerFilter('reverse', (val) => {
  return String(val).split('').reverse().join('');
});
```

## getFilter

Retrieve a registered filter by name.

```javascript
const { getFilter } = require('miki-template');

const reverseFilter = getFilter('reverse');
```

## Built-in Filters

### Text Filters
- `upper`, `lower`, `title`, `capfirst`
- `truncatewords:N`, `truncatechars:N`, `truncatechars_html:N`
- `wordcount`, `striptags`, `slugify`
- `linebreaks`, `linebreaksbr`
- `length_is:N`

### HTML Filters
- `safe`, `escape`

### List Filters
- `length`, `join:sep`, `slice:"start:end"`
- `dictsort:"key"`, `dictsortreversed:"key"`
- `sort`, `unique`, `random`, `reverse`
- `split:sep`, `replace:"old,new"`

### Default Filters
- `default:"fallback"`, `default_if_none:"fallback"`
- `firstof:v1 v2 v3`

### Date/Time Filters
- `date:"Y-m-d"`, `time:"H:i"`
- `date_format:"yyyy-MM-dd"`, `strftime:"PPpp"`
- `timesince`, `timeuntil`, `ago`, `until`
- `time_diff:other_date`

### Numeric Filters
- `add:N`, `sub:N`, `mult:N`
- `divisibleby:N`, `mod:N`
- `floatformat:N`, `square`, `sqrt`
- `abs`, `round:N`, `floor`, `ceil`
- `min:N`, `max:N`, `sum`, `average`

### Currency and Data Formatting
- `currency:"$"`, `phone_number`, `email`
- `url`, `mask:"*"`, `whatsapp_link:"msg"`
- `credit_card`, `ssn`, `ip_address`, `uuid`
- `filesizeformat`, `yesno:"yes,no,maybe"`
- `pluralize:"s"`, `urlencode`, `escapeuri`
- `stringformat:"%s"`, `cut:"text"`, `addslashes`
- `removetags:"p,div"`, `trans`, `regroup:"attr"`
- `json`, `urlize`

### Encoding Filters
- `base64_encode`, `base64_decode`

## Next Steps

- [Filters Guide](../guide/filters)
- [API Reference](../)
