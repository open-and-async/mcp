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
        notes: z.string().optional().describe("Your raw notes from the week."),
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

  server.registerPrompt(
    "coach",
    {
      title: "Coach mode",
      description:
        "Run the full Open & Async method on a situation: triage sync vs async, " +
        "generate the right artifact, enrich with role guidance, and cap with a " +
        "shareable tagline — one composed, consulting-style deliverable.",
      argsSchema: {
        situation: z.string().describe("The situation to coach, in free text."),
        role: z
          .enum(["manager", "ic"])
          .optional()
          .describe("Optional: tailor role callouts to 'manager' or 'ic'."),
      },
    },
    ({ situation, role }) =>
      userMessage(
        [
          `Run **Coach Mode** — apply the Open & Async method to the situation below, end to end. ` +
            `Use the server's tools; follow the steps in order and don't skip the routing step.`,
          ``,
          `SITUATION: ${situation}`,
          `ROLE: ${role || "unspecified"}`,
          ``,
          `1. Call \`triage_sync_vs_async\` with \`task\` = the situation. In its output, read the ` +
            `fenced \`\`\`json block: { mode, suggested_tool, reason }.`,
          ``,
          `2. If \`mode\` == "sync": **STOP — do not generate an artifact.** Async isn't always the ` +
            `answer. Return a short verdict recommending a real-time conversation now, give the ` +
            `reason, and note the one async follow-up (write the outcome down afterward so the ` +
            `people who weren't there aren't guessing).`,
          ``,
          `3. If \`mode\` == "async": call the tool named in \`suggested_tool\`, deriving its ` +
            `arguments from the situation (the decision + options for \`draft_decision_doc\`, the ` +
            `purpose/agenda for \`convert_meeting_to_async\`, or the cadence for ` +
            `\`run_async_standup\`).`,
          ``,
          `4. Then, in parallel, call \`get_guidance\`${role ? ` (role: "${role}")` : ""} and ` +
            `\`get_taglines\` to enrich. get_guidance matches broadly on theme, so treat its ` +
            `callouts as general role enrichment, not situation-precise. Pick one tagline whose ` +
            `point best fits, and keep its \`/q/\` card URL.`,
          ``,
          `5. Compose **one** deliverable in exactly this structure:`,
          ``,
          `   ## Verdict`,
          `   <async or sync, plus the one-line why from triage>`,
          ``,
          `   ## <artifact heading>`,
          `   <the artifact tool's output verbatim — the doc, table, or template>`,
          ``,
          `   ## For ${role ? (role === "manager" ? "managers" : "individual contributors") : "your team"}`,
          `   <1–3 role callouts drawn from get_guidance>`,
          ``,
          `   > <tagline text>`,
          `   > <its /q/ card URL>`,
          ``,
          `Keep it tight and consulting-grade. Preserve the citations and links the tools return.`,
        ].join("\n"),
      ),
  );
}
