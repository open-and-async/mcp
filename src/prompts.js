/**
 * Prompts — the "prompt pack," surfaced as native MCP prompts so users can
 * invoke them directly from their client (e.g. slash commands). Each is a
 * parameterized template that puts the book's method to work. No book prose.
 */

import { z } from "zod";

/** Wrap a single user-role text message, the shape registerPrompt expects. */
function userMessage(text) {
  return { messages: [{ role: "user", content: { type: "text", text } }] };
}

export function registerPrompts(server) {
  server.registerPrompt(
    "async-standup",
    {
      title: "Async standup",
      description:
        "Draft an async standup post from your day's work — outcome-first, " +
        "blockers surfaced, everything linked.",
      argsSchema: {
        work: z
          .string()
          .optional()
          .describe("What you did / are doing, in rough notes."),
      },
    },
    ({ work }) =>
      userMessage(
        `Write my async standup as exactly three short lines — "🟢 Shipped/progress", ` +
          `"🎯 Today/next", "🔴 Blockers" — outcome-first and with links where I name work. ` +
          `If I have no blockers, say "none" explicitly. Here are my rough notes:\n\n` +
          `${work || "(paste your notes here)"}`,
      ),
  );

  server.registerPrompt(
    "write-adr",
    {
      title: "Write an ADR",
      description:
        "Draft an architecture/architectural decision record from a decision " +
        "and its options.",
      argsSchema: {
        decision: z.string().describe("The decision to record."),
        options: z
          .string()
          .optional()
          .describe("Options under consideration, comma-separated."),
      },
    },
    ({ decision, options }) =>
      userMessage(
        `Draft a decision record (ADR) for: "${decision}". ` +
          `${options ? `Options under consideration: ${options}. ` : ""}` +
          `Use these sections: Context, Options considered (each with pros, cons, ` +
          `cost, risk), Decision (chosen option + one-sentence reason), ` +
          `Reversibility (one-way vs two-way door), and Open questions / dissent. ` +
          `Keep it tight and async-friendly so someone can follow it without a meeting.`,
      ),
  );

  server.registerPrompt(
    "meeting-to-issue",
    {
      title: "Meeting → issue",
      description:
        "Convert a meeting agenda into the async artifact that should replace it.",
      argsSchema: {
        agenda: z.string().describe("The meeting agenda or purpose."),
      },
    },
    ({ agenda }) =>
      userMessage(
        `Here's a meeting agenda:\n\n${agenda}\n\n` +
          `Convert it into the async equivalent. For each topic, tell me: the ` +
          `artifact that replaces it (issue, doc, or PR comment), who the decision ` +
          `owner is, and a "decide by" date. Flag anything that genuinely needs to ` +
          `stay synchronous (sensitive, high-ambiguity, or active incident) and why. ` +
          `Default to async; treat a meeting as the escalation, not the norm.`,
      ),
  );

  server.registerPrompt(
    "weekly-update",
    {
      title: "Weekly update",
      description:
        "Draft a weekly update that doesn't suck — outcomes over activity, " +
        "risks surfaced early, skimmable.",
      argsSchema: {
        notes: z
          .string()
          .optional()
          .describe("Your raw notes from the week."),
      },
    },
    ({ notes }) =>
      userMessage(
        `Turn my week into a status update that leads with outcomes, not activity. ` +
          `Structure it as: Headline (one line), Shipped (bullets, each linking the ` +
          `work), Risks/blockers (surface anything at risk *before* it's late — say ` +
          `"no surprises"), and Next. Keep it skimmable. My raw notes:\n\n` +
          `${notes || "(paste your notes here)"}`,
      ),
  );
}
