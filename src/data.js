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
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "…";
}

/**
 * Build the attribution + funnel line every content response must include.
 * @param {Chapter & { section?: string }} chapter
 * @returns {string}
 */
export function cite(chapter) {
  if (!chapter) return `— Open and Async. Get the book: ${BUY_URL}`;
  return `— "${chapter.title}", Open and Async. Get the book: ${BUY_URL}`;
}

/** Wrap a tool result as MCP text content. */
export function text(body) {
  return { content: [{ type: "text", text: body }] };
}

/** Title-cased edition string for "which edition is this?" answers. */
export const edition = `Open and Async — data v${book.version}`;
