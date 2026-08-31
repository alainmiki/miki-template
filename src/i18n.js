/**
 * i18n (Internationalization) support for miki-template.
 *
 * Provides:
 *  - Translations registry: registerTranslation(lang, messages)
 *  - `trans` filter:  {{ key|trans:"fallback" }}
 *  - `{% trans "key" %}` tag
 *  - `{% blocktrans %}...{% endblocktrans %}` tag (supports {% with %}, {% plural %})
 *  - `{% language "xx" %}` tag (switches current language for block)
 *  - Active language getter/setter
 *  - Plural rule support
 */

const translations = new Map();  // Map<lang, Map<key, string | {one:string, other:string}>>
let activeLanguage = 'en';
let fallbackLanguage = 'en';

/**
 * Register a set of translations for a language.
 *
 *   registerTranslation('fr', {
 *     "Hello, world!": "Bonjour, le monde !",
 *     "%d item": { one: "%d élément", other: "%d éléments" }
 *   });
 */
function registerTranslation(lang, messages) {
  if (!translations.has(lang)) {
    translations.set(lang, new Map());
  }
  const map = translations.get(lang);
  for (const [k, v] of Object.entries(messages)) {
    map.set(k, v);
  }
}

/** Unregister a language or a specific key. */
function unregisterTranslation(lang, key) {
  if (!lang) {
    translations.clear();
    return;
  }
  if (key) {
    const m = translations.get(lang);
    if (m) m.delete(key);
  } else {
    translations.delete(lang);
  }
}

/** Set the active language for all subsequent renders. */
function setLanguage(lang) {
  activeLanguage = lang;
}

/** Get the currently active language. */
function getLanguage() {
  return activeLanguage;
}

/** Set the fallback language used when a key is missing. */
function setFallbackLanguage(lang) {
  fallbackLanguage = lang;
}

/** Get the fallback language. */
function getFallbackLanguage() {
  return fallbackLanguage;
}

/** List all registered languages. */
function getAvailableLanguages() {
  return Array.from(translations.keys());
}

/**
 * Look up a translation key.
 * Returns the active language's translation, falling back to fallback, or the key itself.
 */
function lookup(key, params = {}, count) {
  const lookupIn = (lang) => {
    const m = translations.get(lang);
    if (!m) return undefined;
    return m.get(key);
  };

  let result = lookupIn(activeLanguage);
  if (result === undefined) {
    result = lookupIn(fallbackLanguage);
  }
  if (result === undefined) {
    return key; // No translation, return the key
  }

  // Handle plural forms
  if (typeof result === 'object' && result !== null) {
    if (typeof count === 'number') {
      if (count === 1 && result.one !== undefined) {
        result = result.one;
      } else if (count !== 1 && result.other !== undefined) {
        result = result.other;
      } else if (result.other !== undefined) {
        result = result.other;
      } else {
        result = key;
      }
    } else if (result.other !== undefined) {
      result = result.other;
    } else if (result.one !== undefined) {
      result = result.one;
    } else {
      result = key;
    }
  }

  // Interpolate %name% and %s style placeholders
  if (typeof result === 'string' && params && Object.keys(params).length > 0) {
    result = interpolate(result, params, count);
  }
  return result;
}

/**
 * Interpolate placeholders. Supports:
 *  - %s, %d, %f, %.Nf (Python-style positional via args)
 *  - %name% (named placeholders)
 *  - {name} (Django-style named placeholders)
 */
function interpolate(template, params, count) {
  let out = template;

  // {name} style — Django
  out = out.replace(/\{(\w+)\}/g, (m, name) => {
    if (name === 'count' && typeof count === 'number') return String(count);
    if (Object.prototype.hasOwnProperty.call(params, name)) {
      return String(params[name]);
    }
    return m;
  });

  // %name% style
  out = out.replace(/%(\w+)%/g, (m, name) => {
    if (name === 'count' && typeof count === 'number') return String(count);
    if (Object.prototype.hasOwnProperty.call(params, name)) {
      return String(params[name]);
    }
    return m;
  });

  // Positional: if there's a single non-object value in params use it for %s
  if (Object.keys(params).length > 0) {
    const firstScalar = Object.values(params).find(v => typeof v === 'string' || typeof v === 'number');
    if (firstScalar !== undefined) {
      out = out.replace(/%s/g, String(firstScalar));
      out = out.replace(/%d/g, String(parseInt(firstScalar, 10) || 0));
    }
  }
  return out;
}

module.exports = {
  registerTranslation,
  unregisterTranslation,
  setLanguage,
  getLanguage,
  setFallbackLanguage,
  getFallbackLanguage,
  getAvailableLanguages,
  lookup,
  interpolate,
  translations
};
