/**
 * Test helpers — a minimal fake MCP server that captures tool registrations so
 * the real handler logic (rubrics, ranking, word-capping) can be exercised in
 * isolation, without a transport.
 *
 * This file lives under test/ and so is loaded by `node --test`, but it
 * registers no tests of its own — it only exports helpers.
 */

/**
 * Build a fake server whose registerTool / registerResource / registerPrompt
 * record what was registered. Pass its `.server` to a register* function, then
 * use `.tool(name)` to invoke a captured tool handler.
 */
export function captureServer() {
  const tools = new Map();
  const resources = [];
  const prompts = [];

  const server = {
    registerTool(name, config, handler) {
      tools.set(name, { name, config, handler });
    },
    registerResource(name, uri, config, handler) {
      resources.push({ name, uri, config, handler });
    },
    registerPrompt(name, config, handler) {
      prompts.push({ name, config, handler });
    },
  };

  return {
    server,
    tools,
    resources,
    prompts,
    /** Invoke a captured tool's handler and return its raw MCP result. */
    async call(name, args = {}) {
      const t = tools.get(name);
      if (!t) throw new Error(`tool not registered: ${name}`);
      return t.handler(args);
    },
  };
}

/** Pull the plain text body out of an MCP text result. */
export function textOf(result) {
  return result.content.map((c) => c.text).join("\n");
}

/** Count whitespace-delimited words in a string. */
export function wordCount(s) {
  return String(s || "")
    .split(/\s+/)
    .filter(Boolean).length;
}
