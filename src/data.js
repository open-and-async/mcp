/**
 * Loads the derived data artifact (data/book.json.br) and exposes shared
 * helpers for the content tools and resources.
 *
 * The data file is built in the book repo by `just mcp-data`
 * (script/build-mcp-data.js) and committed here as data/book.json.br. It
 * contains ONLY already-public summaries (outline, TL;DRs, key-takeaways,
 * taglines) and reviewed, paraphrased derived layers (frameworks, objections)
 * — never verbatim book prose. See the book repo's docs/mcp-server-spec.md.
 *
 * The file is Brotli-compressed and decompressed here at load. That is NOT
 * encryption or access control — there is no key, and this decompresses it in
 * three lines. It ships compressed so the data is a deliberately-encoded blob
 * instead of grep-able plaintext in node_modules, keeping it out of casual
 * tarball indexing and training crawls, and so that anyone reproducing the
 * content had to go out of their way to decompress it (see DATA-LICENSE.md).
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "book.json.br");

/** @typedef {{ slug: string, title: string, tldr: string, anchor: string }} Chapter */

export const book = JSON.parse(
  zlib.brotliDecompressSync(fs.readFileSync(DATA_PATH)).toString("utf8"),
);

export const BUY_URL = book.buyUrl || "https://open-and-async.com";

/** Every chapter, flattened out of the outline's section grouping. */
export const chapters = book.outline.flatMap((section) =>
  section.chapters.map((ch) => ({ ...ch, section: section.section })),
);

/** Look up a chapter by its slug (anchor without the leading #). */
export function chapterBySlug(slug) {
  const needle = String(slug || "")
    .trim()
    .replace(/^#/, "");
  return chapters.find((ch) => ch.slug === needle) || null;
}

/**
 * Guardrail: cap any text derived from the book at ~60 words so no single
 * response reconstructs a chapter. Adds an ellipsis when truncated.
 * @param {string} text
 * @param {number} maxWords
 * @returns {string}
 */
export function capWords(text, maxWords = 60) {
  const words = String(text || "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "…";
}

/**
 * Attribution line for a content snippet — provenance only (which chapter),
 * no funnel link. The "buy the book" funnel is session-scoped (see
 * sessionFunnel), so it doesn't repeat on every response; the chapter
 * attribution stays on every snippet because it's useful, not marketing.
 * @param {Chapter & { section?: string }} chapter
 * @returns {string}
 */
export function cite(chapter) {
  if (!chapter) return `— Open and Async`;
  return `— "${chapter.title}", Open and Async`;
}

/** Wrap a tool result as MCP text content. */
export function text(body) {
  return { content: [{ type: "text", text: body }] };
}

/**
 * Session-scoped funnel line. The "these are summaries — buy the book" pitch
 * should surface about once per session, not on every response (developer-
 * centric). The stdio server is one process per client session, so a
 * module-level flag ≈ once per session. This is the belt-and-suspenders partner
 * to the server `instructions`: it still lands once even on clients that strip
 * instructions out. Returns "" after the first call. resetSession() is for tests.
 * @returns {string}
 */
let funnelShown = false;
export function sessionFunnel() {
  if (funnelShown) return "";
  funnelShown = true;
  return (
    `These are summaries, not the book's full text — the full argument, stories, ` +
    `and voice are in the book: ${BUY_URL}`
  );
}

/** Reset the session funnel gate. Test-only; production never calls it. */
export function resetSession() {
  funnelShown = false;
}

/**
 * Terse provenance tag for generative method-tool output. Their output embeds
 * the caller's own input in an official-looking template, so a screenshot could
 * be misread as the author speaking. This one line rides on every such response
 * (no link — the funnel is session-scoped) to keep the provenance unambiguous.
 */
export const METHOD_DISCLAIMER =
  "Generated template — adapt to your context; not the author's words or an endorsement.";

/**
 * Serialize machine-readable routing hints as a fenced JSON block. This is how
 * a tool advertises "what to call next" to an orchestrating model. It rides in
 * the text content (not structuredContent) on purpose: every MCP client renders
 * text, so the coach flow works on a vanilla client with no special features.
 * @param {object} hints
 * @returns {string}
 */
export function hintBlock(hints) {
  return "```json\n" + JSON.stringify(hints) + "\n```";
}

/**
 * Wrap a method-tool body with optional routing hints and the shared provenance
 * disclaimer footer. Passing hints appends a parseable ```json block before the
 * footer; existing consumers that read the prose are unaffected (additive).
 * @param {string} body
 * @param {object} [hints]
 */
export function methodText(body, hints) {
  const parts = [body];
  if (hints) parts.push(hintBlock(hints));
  parts.push(`---\n_${METHOD_DISCLAIMER}_`);
  return text(parts.join("\n\n"));
}

/** Title-cased edition string for "which edition is this?" answers. */
export const edition = `Open and Async — data v${book.version}`;
