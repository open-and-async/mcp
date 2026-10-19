import { test } from "node:test";
import assert from "node:assert/strict";

import {
  book,
  chapters,
  chapterBySlug,
  capWords,
  cite,
  text,
  edition,
  BUY_URL,
  sessionFunnel,
  resetSession,
} from "../src/data.js";

test("book loads with a version and the expected top-level layers", () => {
  assert.equal(typeof book.version, "string");
  for (const key of ["outline", "takeaways", "taglines"]) {
    assert.ok(Array.isArray(book[key]), `book.${key} should be an array`);
  }
});

// The book repo builds book.json.br from a gitignored paraphrase file. Built
// without it, the data ships with no frameworks or objections and the content
// tools quietly lose their answers, so a data refresh like that must fail here.
test("bundled data includes the derived frameworks and objections", () => {
  assert.ok(book.frameworks?.length > 0, "book.frameworks is empty");
  assert.ok(book.objections?.length > 0, "book.objections is empty");
  for (const role of ["any", "manager", "ic"]) {
    assert.ok(
      book.frameworks.some((f) => f.role === role),
      `no frameworks for role "${role}"`,
    );
  }
});

test("chapters are flattened from the outline with section attached", () => {
  const fromOutline = book.outline.reduce((n, s) => n + s.chapters.length, 0);
  assert.equal(chapters.length, fromOutline);
  for (const ch of chapters) {
    assert.equal(typeof ch.slug, "string");
    assert.ok(ch.slug.length > 0);
    assert.equal(typeof ch.title, "string");
    assert.equal(typeof ch.tldr, "string");
    assert.equal(typeof ch.section, "string");
  }
});

test("chapter slugs are unique", () => {
  const slugs = chapters.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("chapterBySlug finds a real chapter and tolerates a leading #", () => {
  const first = chapters[0];
  assert.equal(chapterBySlug(first.slug)?.slug, first.slug);
  assert.equal(chapterBySlug(`#${first.slug}`)?.slug, first.slug);
  assert.equal(chapterBySlug(`  ${first.slug}  `)?.slug, first.slug);
});

test("chapterBySlug returns null for unknown / empty input", () => {
  assert.equal(chapterBySlug("does-not-exist"), null);
  assert.equal(chapterBySlug(""), null);
  assert.equal(chapterBySlug(undefined), null);
});

test("capWords leaves short text untouched", () => {
  assert.equal(capWords("a b c", 60), "a b c");
});

test("capWords truncates to the limit and appends an ellipsis", () => {
  const input = Array.from({ length: 100 }, (_, i) => `w${i}`).join(" ");
  const out = capWords(input, 60);
  assert.ok(out.endsWith("…"));
  // 60 words plus the ellipsis appended to the 60th token.
  assert.equal(out.split(/\s+/).length, 60);
});

test("capWords collapses surrounding whitespace and handles empties", () => {
  assert.equal(capWords("  hello   world  "), "hello world");
  assert.equal(capWords(""), "");
  assert.equal(capWords(undefined), "");
});

test("cite is attribution only — chapter title and the book, no funnel URL", () => {
  const line = cite(chapters[0]);
  assert.match(line, /Open and Async/);
  assert.ok(line.includes(chapters[0].title));
  assert.ok(!line.includes(BUY_URL), "cite must not repeat the buy link");
});

test("cite falls back to a bare attribution when given no chapter", () => {
  const line = cite(null);
  assert.match(line, /Open and Async/);
  assert.ok(!line.includes(BUY_URL));
});

test("sessionFunnel returns the buy link once, then empty until reset", () => {
  resetSession();
  assert.ok(sessionFunnel().includes(BUY_URL), "first call carries the funnel");
  assert.equal(sessionFunnel(), "", "second call is empty");
  resetSession();
  assert.ok(sessionFunnel().includes(BUY_URL), "reset re-arms it");
});

test("text wraps a string as MCP text content", () => {
  const r = text("hello");
  assert.deepEqual(r, { content: [{ type: "text", text: "hello" }] });
});

test("edition references the data version", () => {
  assert.ok(edition.includes(book.version));
});

test("BUY_URL is a usable https URL", () => {
  assert.match(BUY_URL, /^https:\/\//);
});
