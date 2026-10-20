// Types for the WebMCP entry point (src/browser.js), so TypeScript consumers
// like open-and-async.com get checked calls instead of an implicit `any`.

/** A tool descriptor in the shape WebMCP's `registerTool()` takes. */
export interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  /** JSON Schema for the tool's input object. */
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, boolean>;
  execute(args: unknown): Promise<string>;
}

/** The part of `document.modelContext` this module uses. */
export interface ModelContextLike {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): unknown;
}

/** Build WebMCP tool descriptors for every method and content tool. */
export function webMcpTools(book: unknown): WebMcpTool[];

/**
 * Register every tool with the page's model context (defaults to
 * `document.modelContext ?? navigator.modelContext`).
 * @returns Names of the tools that registered.
 */
export function registerWebMcpTools(options: {
  /** Parsed data/book.json.br */
  book: unknown;
  modelContext?: ModelContextLike | null;
  /** Unregisters the tools when aborted, on browsers that support it. */
  signal?: AbortSignal;
}): string[];
