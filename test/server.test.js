import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.join(__dirname, "..", "src", "index.js");

/**
 * Boot the real server over stdio with the SDK's own client. This is the only
 * test that exercises index.js wiring and the actual MCP protocol end to end.
 */
async function withClient(fn) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [ENTRY],
  });
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

test("server boots and advertises every method + content tool", async () => {
  await withClient(async (client) => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const expected of [
      "draft_decision_doc",
      "convert_meeting_to_async",
      "score_status_update",
      "run_async_standup",
      "triage_sync_vs_async",
      "book_outline",
      "get_chapter_summary",
      "search_principles",
      "handle_objection",
      "get_guidance",
      "get_taglines",
    ]) {
      assert.ok(names.includes(expected), `missing tool: ${expected}`);
    }
  });
});

test("a tool call round-trips real text content through the protocol", async () => {
  await withClient(async (client) => {
    const res = await client.callTool({
      name: "run_async_standup",
      arguments: { cadence: "weekly" },
    });
    const body = res.content.map((c) => c.text).join("\n");
    assert.match(body, /Async standup \(weekly\)/);
  });
});
