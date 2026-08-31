// ESM wrapper for miki-template
// Re-exports the CommonJS module for use with `import` syntax.
// Usage:
//   import miki from 'miki-template';
//   // or:
//   import { render, compile, __express, SafeString, markSafe } from 'miki-template';

import cjsModule from './index.js';

const {
  compile,
  render,
  asyncRender,
  __express,
  __expressAsync,
  stripExpressContext,
  clearCache,
  registerTag,
  registerFilter,
  registerHelper,
  registerContextProcessor,
  registerTranslation,
  unregisterTranslation,
  setLanguage,
  getLanguage,
  setFallbackLanguage,
  getFallbackLanguage,
  getAvailableLanguages,
  registerLibrary,
  unregisterLibrary,
  getLibrary,
  getLibraryNames,
  hasLibrary,
  registerLibraryFromPath,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml
} = cjsModule;

export {
  compile,
  render,
  asyncRender,
  __express,
  __expressAsync,
  stripExpressContext,
  clearCache,
  registerTag,
  registerFilter,
  registerHelper,
  registerContextProcessor,
  registerTranslation,
  unregisterTranslation,
  setLanguage,
  getLanguage,
  setFallbackLanguage,
  getFallbackLanguage,
  getAvailableLanguages,
  registerLibrary,
  unregisterLibrary,
  getLibrary,
  getLibraryNames,
  hasLibrary,
  registerLibraryFromPath,
  SafeString,
  markSafe,
  isSafe,
  escapeHtml
};

export default cjsModule;
