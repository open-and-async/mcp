/**
 * Runtime-neutral helpers shared by the stdio server (src/index.js) and the
 * browser WebMCP entry point (src/browser.js). Nothing here imports a `node:`
 * module or reads a file: callers hand in the parsed book data, so the same
 * tool code runs in Node and in a page. test/browser.test.js guards that.
 *
 * src/data.js is the Node loader that decompresses data/book.json.br and wraps
 * it with createBook().
 */

/** @typedef {{ slug: string, title: string, tldr: string, anchor: string }} Chapter */

/**
 * Wrap the parsed book data with the lookups and per-session state the content
 * tools need. One call per session: the funnel gate lives here, so a stdio
 * process (one client) and a page load (one agent) each see the pitch once.
 * @param {any} book Parsed data/book.json.br
 */
export function createBook(book) {
  const BUY_URL = book.buyUrl || "https://open-and-async.com";

  /** Every chapter, flattened out of the outline's section grouping. */
  const chapters = book.outline.flatMap((section) =>
    section.chapters.map((ch) => ({ ...ch, section: section.section })),
  );

  /** Look up a chapter by its slug (anchor without the leading #). */
  function chapterBySlug(slug) {
    const needle = String(slug || "")
      .trim()
      .replace(/^#/, "");
    return chapters.find((ch) => ch.slug === needle) || null;
  }

  /**
   * Session-scoped funnel line. The "these are summaries — buy the book" pitch
   * should surface about once per session, not on every response (developer-
   * centric). This is the belt-and-suspenders partner to the server
   * `instructions`: it still lands once even on clients that strip
   * instructions out (and WebMCP has no instructions channel at all). Returns
   * "" after the first call. resetSession() is for tests.
   * @returns {string}
   */
  let funnelShown = false;
  function sessionFunnel() {
    if (funnelShown) return "";
    funnelShown = true;
    return (
      `These are summaries, not the book's full text — the full argument, stories, ` +
      `and voice are in the book: ${BUY_URL}`
    );
  }

  /** Reset the session funnel gate. Test-only; production never calls it. */
  function resetSession() {
    funnelShown = false;
  }

  return {
    book,
    BUY_URL,
    chapters,
    chapterBySlug,
    sessionFunnel,
    resetSession,
    /** Title-cased edition string for "which edition is this?" answers. */
    edition: `Open and Async — data v${book.version}`,
  };
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

/**
 * Tool annotations shared by every tool: each one only reads the bundled data
 * or formats the caller's input. Nothing writes, deletes, or touches the
 * network, so clients can run them without a confirmation prompt.
 */
export const READ_ONLY_LOCAL = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
