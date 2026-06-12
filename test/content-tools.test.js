import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { registerContentTools } from "../src/tools/content.js";
import { book, chapters, BUY_URL } from "../src/data.js";
import { captureServer, textOf, wordCount } from "./helpers.js";

let cap;
beforeEach(() => {
  cap = captureServer();
  registerContentTools(cap.server);
});

/** A real word from real data, so queries stay valid as the book evolves. */
const sampleWord = chapters[0].tldr
  .split(/[^a-z0-9]+/i)
  .find((w) => w.length > 4);

test("registers all six content tools", () => {
  assert.deepEqual(
    [...cap.tools.keys()].sort(),
    [
      "book_outline",
      "get_chapter_summary",
      "get_guidance",
      "get_taglines",
      "handle_objection",
      "search_principles",
    ],
  );
});

test("book_outline lists every section and links to buy", async () => {
  const out = textOf(await cap.call("book_outline", {}));
  for (const section of book.outline) {
    assert.ok(out.includes(section.section), `missing section ${section.section}`);
  }
  assert.ok(out.includes(book.version));
  assert.ok(out.includes(BUY_URL));
});

test("get_chapter_summary returns a cited summary for a known slug", async () => {
  const ch = chapters[0];
  const out = textOf(await cap.call("get_chapter_summary", { slug: ch.slug }));
  assert.match(out, new RegExp(`## ${escapeRe(ch.title)}`));
  assert.match(out, /TL;DR:/);
  assert.ok(out.includes(ch.title)); // citation line carries the title
  assert.ok(out.includes(BUY_URL));
});

test("get_chapter_summary lists available slugs on a miss", async () => {
  const out = textOf(
    await cap.call("get_chapter_summary", { slug: "not-a-real-chapter" }),
  );
  assert.match(out, /No chapter with slug/);
  assert.ok(out.includes(chapters[0].slug));
});

test("search_principles returns cited, word-capped snippets", async () => {
  const out = textOf(await cap.call("search_principles", { query: sampleWord }));
  assert.match(out, new RegExp(`Results for "${escapeRe(sampleWord)}"`));
  assert.ok(out.includes(BUY_URL));

  // Extraction guard: no single snippet body may exceed the ~60-word cap.
  const snippetBodies = out
    .split("\n")
    .filter((l) => l.startsWith("**["))
    .map((l) => l.replace(/^\*\*\[[^\]]+\]\*\*\s*/, ""));
  assert.ok(snippetBodies.length > 0, "expected at least one snippet");
  for (const body of snippetBodies) {
    assert.ok(wordCount(body) <= 60, `snippet exceeded cap: ${body}`);
  }
});

test("search_principles honours the result limit", async () => {
  const out = textOf(
    await cap.call("search_principles", { query: sampleWord, limit: 1 }),
  );
  const count = out.split("\n").filter((l) => l.startsWith("**[")).length;
  assert.ok(count <= 1);
});

test("search_principles guides the user on a no-match query", async () => {
  const out = textOf(
    await cap.call("search_principles", { query: "zzzqqxnomatch" }),
  );
  assert.match(out, /No matches/);
  assert.match(out, /book_outline/);
});

test("get_taglines returns all taglines and can filter by chapter", async () => {
  const all = textOf(await cap.call("get_taglines", {}));
  assert.ok(all.includes(book.taglines[0].text));

  const slug = book.taglines[0].chapter;
  const filtered = textOf(await cap.call("get_taglines", { chapter: slug }));
  assert.match(filtered, new RegExp(escapeRe(slug)));

  const empty = textOf(await cap.call("get_taglines", { chapter: "no-such-chapter" }));
  assert.match(empty, /No taglines for chapter/);
});

test("handle_objection and get_guidance degrade gracefully when their layer is unbundled", async () => {
  // frameworks/objections are part of the reviewed derived layer and may be
  // absent from a given build; the tools must point elsewhere, never invent.
  const obj = textOf(
    await cap.call("handle_objection", { objection: "async is too slow" }),
  );
  if (book.objections.length === 0) {
    assert.match(obj, /search_principles/);
    assert.ok(obj.includes(BUY_URL));
  } else {
    assert.match(obj, /Reframe:|No direct match/);
  }

  const guide = textOf(
    await cap.call("get_guidance", { topic: "giving feedback", role: "manager" }),
  );
  if (book.frameworks.length === 0) {
    assert.match(guide, /search_principles/);
  } else {
    assert.ok(guide.length > 0);
  }
});

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
