/**
 * Resources — read-only reference data, surfaced as MCP resources so clients
 * can attach them to context directly.
 *
 * Both expose already-public summary data only (no body prose).
 */

import { book } from "./data.js";

export function registerResources(server) {
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
