/**
 * Content tools — derived/summary only, capped, always cited, always funnel.
 *
 * These surface the book's already-public layer (outline, TL;DRs, taglines,
 * key-takeaways) and its reviewed derived layer (frameworks, objections). Every
 * response is capped at ~60 words from any one chapter, cites the chapter, and
 * links to buy. No tool returns body text; nothing reconstructs a chapter.
 */

import { z } from "zod";
import {
  book,
  chapters,
  chapterBySlug,
  capWords,
  cite,
  text,
  sessionFunnel,
} from "../data.js";

/** Lowercase haystack for keyword scoring. */
function tokens(s) {
  return String(s || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

/**
 * Append the once-per-session funnel line to a response body, if it's still
 * due. Developer-centric: after the first call it returns the body untouched,
 * so responses carry provenance (chapter citations) but not a repeated pitch.
 * @param {string} body
 * @returns {ReturnType<typeof text>}
 */
function withFunnel(body) {
  const f = sessionFunnel();
  return text(f ? `${body}\n\n${f}` : body);
}

export function registerContentTools(server) {
  server.registerTool(
    "book_outline",
    {
      title: "Book outline",
      description:
        "The map of Open and Async: every section and chapter with a one-line " +
        "TL;DR. Use it to find the right chapter for a topic.",
      inputSchema: {},
    },
    async () => {
      const lines = book.outline.map((section) => {
        const chs = section.chapters
          .map((ch) => `  - **${ch.title}** (${ch.slug}) — ${ch.tldr}`)
          .join("\n");
        return `### ${section.section}\n${chs}`;
      });
      return withFunnel(
        [`# Open and Async — outline (v${book.version})`, ``, ...lines].join(
          "\n",
        ),
      );
    },
  );

  server.registerTool(
    "get_chapter_summary",
    {
      title: "Get a chapter summary",
      description:
        "Return a chapter's TL;DR plus its taglines and a link to read the full " +
        "chapter. Summary only — no body text.",
      inputSchema: {
        slug: z
          .string()
          .describe(
            "Chapter slug, e.g. 'impact-over-input' (from book_outline).",
          ),
      },
    },
    async ({ slug }) => {
      const ch = chapterBySlug(slug);
      if (!ch) {
        const names = chapters.map((c) => c.slug).join(", ");
        return text(
          `No chapter with slug "${slug}". Available slugs:\n${names}`,
        );
      }
      const tags = book.taglines.filter((t) => t.chapter === ch.slug);
      const tagLines = tags.length
        ? tags.map((t) => `- ${t.text} (${t.card})`).join("\n")
        : "_(no taglines for this chapter)_";

      return withFunnel(
        [
          `## ${ch.title}`,
          `_Section: ${ch.section}_`,
          ``,
          `**TL;DR:** ${ch.tldr}`,
          ``,
          `**Taglines:**`,
          tagLines,
          ``,
          cite(ch),
        ].join("\n"),
      );
    },
  );

  server.registerTool(
    "search_principles",
    {
      title: "Search the book's principles",
      description:
        "Keyword search across the book's summary corpus (TL;DRs, key-takeaways, " +
        "taglines, and reviewed frameworks). Returns short, cited snippets — a " +
        "snippet view, not full text.",
      inputSchema: {
        query: z.string().describe("What you're looking for."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Max results (default 5, capped at 10)."),
      },
    },
    async ({ query, limit = 5 }) => {
      const q = new Set(tokens(query));
      const score = (s) => {
        const t = tokens(s);
        let n = 0;
        for (const w of t) if (q.has(w)) n++;
        return n;
      };

      const corpus = [];
      for (const ch of chapters) {
        corpus.push({ kind: "TL;DR", body: ch.tldr, ch });
      }
      for (const set of book.takeaways) {
        for (const p of set.points) corpus.push({ kind: "Takeaway", body: p });
      }
      for (const t of book.taglines) {
        corpus.push({
          kind: "Tagline",
          body: t.text,
          ch: chapterBySlug(t.chapter),
        });
      }
      for (const f of book.frameworks || []) {
        corpus.push({
          kind: "Framework",
          body: f.guidance,
          ch: chapterBySlug(f.anchor || f.chapter),
        });
      }

      const ranked = corpus
        .map((item) => ({ item, s: score(item.body) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, Math.min(limit, 10));

      if (ranked.length === 0) {
        return withFunnel(
          `No matches for "${capWords(query, 8)}". Try book_outline to browse topics, then ` +
            `get_chapter_summary for a specific chapter.`,
        );
      }

      const out = ranked.map(({ item }) => {
        const where = item.ch ? `\n${cite(item.ch)}` : "";
        return `**[${item.kind}]** ${capWords(item.body)}${where}`;
      });

      return withFunnel(
        [
          `# Results for "${capWords(query, 8)}" (${ranked.length})`,
          ``,
          out.join("\n\n"),
        ].join("\n"),
      );
    },
  );

  server.registerTool(
    "handle_objection",
    {
      title: "Handle an objection",
      description:
        "Map a common objection to open/async work ('async is slow', 'remote " +
        "kills culture') to the book's reframe, with a chapter citation.",
      inputSchema: {
        objection: z
          .string()
          .describe("The skepticism or pushback to address."),
      },
    },
    async ({ objection }) => {
      const objections = book.objections || [];
      if (objections.length === 0) {
        // Derived objection layer not yet reviewed/published — fall back to a
        // pointer rather than inventing book content.
        return withFunnel(
          [
            `The objection-handling layer is part of the book's reviewed derived ` +
              `content and isn't bundled in this build yet.`,
            ``,
            `In the meantime, try \`search_principles\` with the core of the ` +
              `objection (e.g. "${capWords(objection, 8)}") to find the relevant ` +
              `chapter, then \`get_chapter_summary\`.`,
          ].join("\n"),
        );
      }

      const q = new Set(tokens(objection));
      const best = objections
        .map((o) => {
          const t = tokens(`${o.trigger} ${o.reframe}`);
          let n = 0;
          for (const w of t) if (q.has(w)) n++;
          return { o, n };
        })
        .sort((a, b) => b.n - a.n)[0];

      if (!best || best.n === 0) {
        return withFunnel(
          `No direct match. Try \`search_principles\` for "${capWords(objection, 8)}".`,
        );
      }

      const ch = chapterBySlug(best.o.anchor || best.o.chapter);
      return withFunnel(
        [
          `**Objection:** "${best.o.trigger}"`,
          ``,
          `**Reframe:** ${capWords(best.o.reframe)}`,
          ``,
          cite(ch),
        ].join("\n"),
      );
    },
  );

  server.registerTool(
    "get_guidance",
    {
      title: "Get role-aware guidance",
      description:
        "Role-aware guidance (manager or IC) for a topic, paraphrased from the " +
        "book's role callouts, with a chapter citation.",
      inputSchema: {
        topic: z.string().describe("The topic you want guidance on."),
        role: z
          .enum(["manager", "ic", "any"])
          .optional()
          .describe("Audience: 'manager', 'ic', or 'any' (default)."),
      },
    },
    async ({ topic, role = "any" }) => {
      const frameworks = book.frameworks || [];
      if (frameworks.length === 0) {
        return withFunnel(
          [
            `Role-aware guidance comes from the book's reviewed derived layer, ` +
              `which isn't bundled in this build yet.`,
            ``,
            `Try \`search_principles\` for "${capWords(topic, 8)}" to find the ` +
              `relevant chapter, then \`get_chapter_summary\`.`,
          ].join("\n"),
        );
      }

      const q = new Set(tokens(topic));
      const ranked = frameworks
        .filter(
          (f) =>
            role === "any" || !f.role || f.role === "any" || f.role === role,
        )
        .map((f) => {
          const t = tokens(`${f.topic} ${f.guidance}`);
          let n = 0;
          for (const w of t) if (q.has(w)) n++;
          return { f, n };
        })
        .filter((r) => r.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 3);

      if (ranked.length === 0) {
        return withFunnel(
          `No guidance matched "${topic}" for role "${role}". Try \`search_principles\`.`,
        );
      }

      const out = ranked.map(({ f }) => {
        const ch = chapterBySlug(f.anchor || f.chapter);
        const label = f.role && f.role !== "any" ? ` _(${f.role})_` : "";
        return `**${f.topic}**${label}\n${capWords(f.guidance)}\n${cite(ch)}`;
      });

      return withFunnel(out.join("\n\n"));
    },
  );

  server.registerTool(
    "get_taglines",
    {
      title: "Get taglines",
      description:
        "Return the book's shareable taglines and their quote-card URLs. " +
        "Optionally filter to one chapter.",
      inputSchema: {
        chapter: z
          .string()
          .optional()
          .describe("Chapter slug to filter by (omit for all)."),
      },
    },
    async ({ chapter }) => {
      let tags = book.taglines;
      if (chapter) {
        const slug = chapter.replace(/^#/, "");
        tags = tags.filter((t) => t.chapter === slug);
        if (tags.length === 0) {
          return text(`No taglines for chapter "${chapter}".`);
        }
      }
      const lines = tags.map(
        (t) => `- **${t.text}**\n  ${t.chapter_title} · ${t.card}`,
      );
      return withFunnel(
        [`# Taglines${chapter ? ` — ${chapter}` : ""}`, ``, ...lines].join(
          "\n",
        ),
      );
    },
  );
}
