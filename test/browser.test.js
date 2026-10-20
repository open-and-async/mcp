import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { registerWebMcpTools, webMcpTools } from "../src/browser.js";
import { book, data } from "../src/data.js";
import { registerMethodTools } from "../src/tools/methods.js";
import { registerContentTools } from "../src/tools/content.js";
import { captureServer } from "./helpers.js";

/** A stand-in for document.modelContext that records registrations. */
function fakeModelContext() {
  const tools = new Map();
  return {
    tools,
    registerTool(tool) {
      if (tools.has(tool.name)) throw new Error(`duplicate tool ${tool.name}`);
      tools.set(tool.name, tool);
    },
  };
}

test("the browser entry point's import graph has no node: modules", () => {
  const seen = new Set();
  const visit = (url) => {
    if (seen.has(url.href)) return;
    seen.add(url.href);
    const src = readFileSync(url, "utf8");
    for (const [, spec] of src.matchAll(
      /^\s*(?:import|export)\b[^;]*?from\s+"([^"]+)"/gm,
    )) {
      assert.ok(!spec.startsWith("node:"), `${url.pathname} imports ${spec}`);
      if (spec.startsWith(".")) visit(new URL(spec, url));
    }
  };
  visit(new URL("../src/browser.js", import.meta.url));
  assert.ok(seen.size > 3, "should have walked into the tool modules");
});

test("WebMCP exposes exactly the tools the stdio server registers", () => {
  const cap = captureServer();
  registerMethodTools(cap.server);
  registerContentTools(cap.server, data);
  const browserNames = webMcpTools(book).map((t) => t.name);
  assert.deepEqual(browserNames.sort(), [...cap.tools.keys()].sort());
});

test("every tool carries a description and a JSON Schema object input", () => {
  for (const tool of webMcpTools(book)) {
    assert.ok(tool.description.length > 0, `${tool.name} needs a description`);
    assert.equal(tool.inputSchema.type, "object", tool.name);
    assert.equal(tool.inputSchema.$schema, undefined, tool.name);
    assert.equal(tool.annotations.readOnlyHint, true, tool.name);
  }
});

test("registerWebMcpTools registers every tool and returns their names", () => {
  const mc = fakeModelContext();
  const names = registerWebMcpTools({ book, modelContext: mc });
  assert.equal(names.length, webMcpTools(book).length);
  assert.deepEqual([...mc.tools.keys()], names);
});

test("registerWebMcpTools is a no-op without a model context", () => {
  assert.deepEqual(registerWebMcpTools({ book, modelContext: null }), []);
});

test("a tool the browser rejects is skipped, not fatal", (t) => {
  t.mock.method(console, "warn", () => {});
  const mc = fakeModelContext();
  mc.tools.set("book_outline", {});
  const names = registerWebMcpTools({ book, modelContext: mc });
  assert.ok(!names.includes("book_outline"));
  assert.ok(names.includes("draft_decision_doc"));
});

test("execute returns the tool's text", async () => {
  const mc = fakeModelContext();
  registerWebMcpTools({ book, modelContext: mc });
  const out = await mc.tools
    .get("draft_decision_doc")
    .execute({ decision: "Pick a CI provider" });
  assert.equal(typeof out, "string");
  assert.match(out, /^# Decision: Pick a CI provider/);
});

test("execute validates input against the tool's schema", async () => {
  const mc = fakeModelContext();
  registerWebMcpTools({ book, modelContext: mc });
  const search = mc.tools.get("search_principles");
  await assert.rejects(
    search.execute({ query: "meetings", limit: 50 }),
    /Invalid input for search_principles/,
  );
  await assert.rejects(search.execute({}), /Invalid input/);
  assert.equal(typeof (await search.execute({ query: "meetings" })), "string");
});

test("each registration gets its own once-per-session funnel", async () => {
  const funnel = /These are summaries, not the book's full text/;
  for (let i = 0; i < 2; i++) {
    const mc = fakeModelContext();
    registerWebMcpTools({ book, modelContext: mc });
    const outline = mc.tools.get("book_outline");
    assert.match(await outline.execute({}), funnel);
    assert.doesNotMatch(await outline.execute({}), funnel);
  }
});
