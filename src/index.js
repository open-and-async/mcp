#!/usr/bin/env node

/**
 * Open and Async MCP server.
 *
 * Exposes the book's async-first *method* — decision-doc/ADR scaffolds, a
 * meeting-to-async converter, a status-update rubric, an async standup, and a
 * sync-vs-async triage — plus its already-public *summary* layer (outline,
 * chapter TL;DRs, taglines, key-takeaways) and reviewed *derived* layer
 * (frameworks, objections).
 *
 * It ships the method, never the manuscript: the only data file is
 * data/book.json (built by `just mcp-data` in the book repo from already-public
 * and reviewed-paraphrased content). No verbatim book prose is bundled.
 *
 * Transport: stdio. Run with `npx @open-and-async/mcp`.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { book } from "./data.js";
import { registerMethodTools } from "./tools/methods.js";
import { registerContentTools } from "./tools/content.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

const server = new McpServer({
  name: "open-async",
  version: book.version,
});

registerMethodTools(server);
registerContentTools(server);
registerResources(server);
registerPrompts(server);

const transport = new StdioServerTransport();
await server.connect(transport);

// stderr is safe for logging on a stdio transport (stdout carries the protocol).
console.error(
  `open-async MCP server running (data v${book.version}) — method + summary tools ready.`,
);
