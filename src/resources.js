/**
 * Resources — read-only reference data, surfaced as MCP resources so clients
 * can attach them to context directly.
 *
 * Both expose already-public summary data only (no body prose).
 */

import { book, BUY_URL } from "./data.js";

export function registerResources(server) {
  server.registerResource(
    "about",
    "book://about",
    {
      title: "Open and Async — about & license",
      description:
        "What this server is, what it does and doesn't contain, and where to " +
        "get the book. Pull it on demand; nothing is pushed into responses.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: [
            `# About Open and Async (data v${book.version})`,
            ``,
            `This server surfaces the *method* and *summaries* from the book ` +
              `"Open and Async" by Ben Balter.`,
            ``,
            `- Reference/content answers are **summaries and paraphrases** — not ` +
              `the book's full text. The complete argument, stories, and voice ` +
              `are in the book.`,
            `- Method-tool output is **generated from your input** — a template ` +
              `to adapt, not the author's words or an endorsement.`,
            `- Get the book: ${BUY_URL}`,
            ``,
            `_Code: MIT. Data: proprietary, © Open & Async LLC — see ` +
              `DATA-LICENSE.md._`,
          ].join("\n"),
        },
      ],
    }),
  );

  server.registerResource(
    "outline",
    "book://outline",
    {
      title: "Open and Async — outline",
      description:
        "Sections, chapters, and one-line TL;DRs. The book's table of contents.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            { version: book.version, outline: book.outline },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerResource(
    "taglines",
    "book://taglines",
    {
      title: "Open and Async — taglines",
      description:
        "Shareable 'bumper-sticker' lines, each with its /q/<slug> quote-card URL.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            { version: book.version, taglines: book.taglines },
            null,
            2,
          ),
        },
      ],
    }),
  );
}
