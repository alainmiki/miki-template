/**
 * TypeScript definitions for miki-template
 * Generated manually to match the actual runtime API.
 */

declare namespace miki {
  /**
   * A compiled template instance returned by `compile()`.
   */
  interface CompiledTemplate {
    /** Synchronously render the template. */
    render(context?: TemplateContext): string;
    /** Asynchronously render the template (awaits Promise helpers). */
    asyncRender(context?: TemplateContext): Promise<string>;
    /** Render a single named block. */
    renderBlock(blockName: string, context?: TemplateContext): string;
    /** Render a defined `{% partialdef %}` by name. */
    renderPartial(partialName: string, context?: TemplateContext): string;
  }

  /** Context object passed to render functions. */
  interface TemplateContext {
    [key: string]: any;
  }

  /** Options for `compile()` and `render()`. */
  interface CompileOptions {
    /** Directories to search for `extends`/`include` templates. */
    views?: string | string[];
    /** Prefix for the `{% static %}` tag. */
    staticUrl?: string;
    /** Custom URL resolver for `{% url %}` tag. */
    urlHelper?: (routeName: string, ...args: any[]) => string;
  }

  /** A custom filter function. */
  type FilterFunction = (value: any, arg?: any) => any;

  /** A custom tag parser function. */
  type TagParserFunction = (tagContent: string, parser: any) => ASTNode;

  /** A custom helper function (block tag). */
  type HelperFunction = (content: string, context: any) => string | Promise<string>;

  /** A context processor. */
  type ContextProcessor = (context: TemplateContext) => TemplateContext | void;

  /** An AST node with a `render(context)` method. */
  interface ASTNode {
    render(context: any): string | Promise<string>;
  }

  /**
   * SafeString — a string marker that bypasses HTML auto-escaping.
   */
  class SafeString {
    constructor(value: string);
    toString(): string;
  }
}

declare module "miki-template" {
  export = miki;
  export as namespace miki;

  /** Compile a template string into a reusable renderable object. */
  export function compile(templateStr: string, options?: miki.CompileOptions): miki.CompiledTemplate;

  /** One-off template render. */
  export function render(templateStr: string, context?: miki.TemplateContext, options?: miki.CompileOptions): string;

  /** Async one-off render (supports async helpers). */
  export function asyncRender(templateStr: string, context?: miki.TemplateContext, options?: miki.CompileOptions): Promise<string>;

  /** Express view engine adapter. */
  export function __express(filePath: string, options: miki.TemplateContext, callback: (err: Error | null, html?: string) => void): void;

  /** Async Express view engine adapter (Express 5+). */
  export function __expressAsync(filePath: string, options: miki.TemplateContext): Promise<string>;

  /** Clear the in-memory compiled template cache. */
  export function clearCache(): void;

  /** Register a custom tag parser. */
  export function registerTag(name: string, parserFn: miki.TagParserFunction): void;

  /** Register a custom filter. */
  export function registerFilter(name: string, filterFn: miki.FilterFunction): void;

  /** Register a custom block helper. */
  export function registerHelper(name: string, fn: miki.HelperFunction): void;

  /** Register a context processor. */
  export function registerContextProcessor(fn: miki.ContextProcessor): void;

  /** Mark a value as HTML-safe (bypasses auto-escaping). */
  export function markSafe(value: any): miki.SafeString;

  /** Check if a value is a SafeString. */
  export function isSafe(value: any): boolean;

  /** Escape HTML special characters. */
  export function escapeHtml(str: string): string;

  /** SafeString class for marking values as safe. */
  export const SafeString: typeof miki.SafeString;
}
