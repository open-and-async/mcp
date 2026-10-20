/**
 * WebMCP entry point: registers the same tools as the stdio server with the
 * page's model context (`document.modelContext`, or `navigator.modelContext`
 * in earlier Chrome builds), so an agent in a WebMCP browser can call them on
 * open-and-async.com without installing anything.
 *
 * Import it as `@open-and-async/mcp/browser`. It never fetches anything: the
 * page loads the book data however it likes (the site serves a gzipped copy of
 * data/book.json.br, since browsers can't decompress Brotli streams yet) and
 * passes the parsed object in.
 *
 *   const mc = document.modelContext ?? navigator.modelContext;
 *   if (mc) registerWebMcpTools({ book, modelContext: mc });
 *
 * Tools only. WebMCP has no channel for the server instructions, resources, or
 * prompts, so the once-per-session funnel line in tool output is the only
 * attribution that reaches the agent.
 *
 * This module and everything it imports must stay free of `node:` modules;
 * test/browser.test.js walks the import graph to enforce it.
 */

import { z } from "zod";

import { createBook } from "./book.js";
import { registerMethodTools } from "./tools/methods.js";
import { registerContentTools } from "./tools/content.js";

// zod's fast object parser probes `new Function` on first parse, and on a page
// with a strict CSP (no 'unsafe-eval', like open-and-async.com) that probe logs
// a CSP violation even though zod catches it. Jitless mode skips the probe;
// the slower path is irrelevant for one parse per tool call.
z.config({ jitless: true });

/**
 * Build WebMCP tool descriptors for every method and content tool. Each
 * `execute` validates its input with the tool's own zod schema first, the way
 * McpServer does for stdio, so defaults and min/max limits still apply.
 * @param {any} book Parsed data/book.json.br
 */
export function webMcpTools(book) {
  const collected = [];
  const collector = {
    registerTool(name, config, handler) {
      collected.push({ name, config, handler });
    },
  };
  registerMethodTools(collector);
  registerContentTools(collector, createBook(book));

  return collected.map(({ name, config, handler }) => {
    const schema = z.object(config.inputSchema || {});
    const { $schema, ...inputSchema } = z.toJSONSchema(schema, { io: "input" });
    return {
      name,
      title: config.title,
      description: config.description,
      inputSchema,
      annotations: config.annotations,
      async execute(args) {
        const parsed = schema.safeParse(args ?? {});
        if (!parsed.success) {
          throw new Error(
            `Invalid input for ${name}: ${z.prettifyError(parsed.error)}`,
          );
        }
        const result = await handler(parsed.data);
        const body = result.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");
        if (result.isError) throw new Error(body || `${name} failed`);
        return body;
      },
    };
  });
}

/**
 * Register every tool with the page's model context. A tool the browser
 * rejects (say, a name another script already took) is skipped with a warning
 * rather than stopping the rest.
 * @param {{ book: any, modelContext?: any, signal?: AbortSignal }} options
 *   `signal` unregisters the tools when aborted, on browsers that support it.
 * @returns {string[]} Names of the tools that registered.
 */
export function registerWebMcpTools({
  book,
  modelContext = globalThis.document?.modelContext ??
    globalThis.navigator?.modelContext,
  signal,
}) {
  if (!modelContext) return [];
  const registered = [];
  for (const tool of webMcpTools(book)) {
    try {
      modelContext.registerTool(tool, signal ? { signal } : undefined);
      registered.push(tool.name);
    } catch (err) {
      console.warn(
        `[open-async] couldn't register WebMCP tool ${tool.name}:`,
        err,
      );
    }
  }
  return registered;
}
