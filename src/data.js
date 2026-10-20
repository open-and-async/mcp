/**
 * Loads the derived data artifact (data/book.json.br) and exposes shared
 * helpers for the content tools and resources. The helpers themselves live in
 * src/book.js, which has no Node dependencies so src/browser.js can share them.
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

import { createBook } from "./book.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "book.json.br");

/**
 * The Node session's book: lookups plus the once-per-session funnel gate. The
 * stdio server is one process per client session, so one module-level
 * instance ≈ once per session. Pass this to registerContentTools().
 */
export const data = createBook(
  JSON.parse(
    zlib.brotliDecompressSync(fs.readFileSync(DATA_PATH)).toString("utf8"),
  ),
);

export const {
  book,
  BUY_URL,
  chapters,
  chapterBySlug,
  sessionFunnel,
  resetSession,
  edition,
} = data;

export {
  capWords,
  cite,
  text,
  METHOD_DISCLAIMER,
  hintBlock,
  methodText,
  READ_ONLY_LOCAL,
} from "./book.js";
