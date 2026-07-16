/**
 * Method tools — pure utility, zero book prose.
 *
 * These render the book's frameworks as *actions*: templates and rubrics a team
 * can run, not content to read. They contain no manuscript text, so they carry
 * no extraction risk and ship instantly. They're also the best demo of the
 * book's own "agentic workflows" thesis — the method, in the user's editor.
 */

import { z } from "zod";
import { methodText } from "../data.js";

/**
 * When triage says "async," pick which artifact generator the coach flow should
 * branch to next. Order = precedence: a recurring status ritual → standup; a
 * meeting/agenda to dissolve → convert; anything else (a choice to make, or a
 * generic "write it down") → decision doc as the safe default.
 * @param {string} t - lowercased task text
 * @returns {"run_async_standup"|"convert_meeting_to_async"|"draft_decision_doc"}
 */
function routeArtifact(t) {
  if (
    /\b(standup|stand-up|status update|daily update|weekly update|progress update|check-?in)\b/.test(
      t,
    )
  )
    return "run_async_standup";
  if (
    /\b(meeting|sync|agenda|kick-?off|all.?hands|catch.?up|invite|calendar)\b/.test(
      t,
    )
  )
    return "convert_meeting_to_async";
  return "draft_decision_doc";
}

export function registerMethodTools(server) {
  server.registerTool(
    "draft_decision_doc",
    {
      title: "Draft a decision doc (ADR)",
      description:
        "Turn a decision plus its options into a structured, async-friendly " +
        "decision record (ADR): context, options with tradeoffs, the decision, " +
        "and its reversibility. Write the decision down so others can follow it " +
        "without a meeting.",
      inputSchema: {
        decision: z.string().describe("The decision to be made, in one line."),
        options: z
          .array(z.string())
          .optional()
          .describe("Candidate options. Two or three is plenty."),
        context: z
          .string()
          .optional()
          .describe("Background: what forces this decision now."),
      },
    },
    async ({ decision, options = [], context }) => {
      const opts =
        options.length > 0
          ? options
          : ["Option A", "Option B", "Do nothing (status quo)"];
      const optionBlocks = opts
        .map(
          (o, i) =>
            `### Option ${i + 1}: ${o}\n\n` +
            `- **Pros:** \n- **Cons:** \n- **Cost / effort:** \n- **Risk:** `,
        )
        .join("\n\n");

      const doc = [
        `# Decision: ${decision}`,
        ``,
        `**Status:** Proposed · **Driver (DRI):** @you · **Date:** YYYY-MM-DD`,
        ``,
        `## Context`,
        ``,
        context ? context : `_Why are we deciding this now? What changed?_`,
        ``,
        `## Options considered`,
        ``,
        optionBlocks,
        ``,
        `## Decision`,
        ``,
        `_State the chosen option and the one-sentence reason._`,
        ``,
        `## Reversibility`,
        ``,
        `_Is this a one-way door or a two-way door? If we're wrong, what's the ` +
          `cost to undo it? (Two-way doors deserve a faster, lighter process.)_`,
        ``,
        `## Open questions / dissent`,
        ``,
        `_Capture unresolved concerns here so silence isn't mistaken for ` +
          `consent. Invite disagreement explicitly._`,
      ].join("\n");

      return methodText(doc, { next: "get_guidance" });
    },
  );

  server.registerTool(
    "convert_meeting_to_async",
    {
      title: "Convert a meeting to async",
      description:
        "Given a meeting's purpose or agenda, propose the async equivalent: " +
        "the artifact that replaces it, where it lives, who decides, and the " +
        "deadline. Meetings are a point of escalation, not the default.",
      inputSchema: {
        purpose: z
          .string()
          .describe("Why the meeting exists / what it's meant to accomplish."),
        agenda: z
          .array(z.string())
          .optional()
          .describe("Agenda items, if any."),
      },
    },
    async ({ purpose, agenda = [] }) => {
      const items =
        agenda.length > 0
          ? agenda
          : ["(no agenda supplied — list the topics the meeting would cover)"];
      const rows = items
        .map(
          (item) => `| ${item} | Issue / doc / PR comment? | @owner | When? |`,
        )
        .join("\n");

      const out = [
        `## Async replacement for: ${purpose}`,
        ``,
        `**First question — does this need to be synchronous at all?** Most ` +
          `meetings exist to share information or make a decision; both are ` +
          `better done in writing, where they're searchable, inclusive of every ` +
          `time zone, and create a durable record.`,
        ``,
        `### The artifact that replaces it`,
        ``,
        `- **Format:** an issue (for a decision or task), a doc/PR (for a ` +
          `proposal to review), or a recorded Loom + thread (if something must ` +
          `be shown).`,
        `- **Where it lives:** link it from the relevant repo/project so it has ` +
          `a URL and is discoverable.`,
        `- **Decision owner (DRI):** name one person who decides.`,
        `- **Deadline:** set a "decide by" date so async doesn't mean ` +
          `never.`,
        ``,
        `### Agenda → async`,
        ``,
        `| Topic | Replace with | Owner | Decide by |`,
        `| --- | --- | --- | --- |`,
        rows,
        ``,
        `### Keep it sync only if`,
        ``,
        `- It's a genuine debate with high ambiguity and fast back-and-forth, or`,
        `- It's sensitive/personal (feedback, conflict, bad news), or`,
        `- You've tried async and it's thrashing.`,
        ``,
        `If you do meet, the meeting's job is to **produce the artifact above** ` +
          `— pre-read sent, notes and decision posted back to the URL after.`,
      ].join("\n");

      return methodText(out, { next: "get_guidance" });
    },
  );

  server.registerTool(
    "score_status_update",
    {
      title: "Score a status update",
      description:
        "Score a draft status update against the 'work loudly / no surprises' " +
        "rubric and suggest fixes. Good updates surface blockers early, state " +
        "outcomes over activity, and link to the work.",
      inputSchema: {
        update: z.string().describe("The draft status update to score."),
      },
    },
    async ({ update }) => {
      const u = update.toLowerCase();
      const checks = [
        {
          name: "Outcome over activity",
          pass: /\b(ship|shipped|done|landed|merged|decided|unblocked|delivered|launched|fixed|resolved)\b/.test(
            u,
          ),
          fix: "Lead with what changed for others, not what you were busy with. “Worked on X” → “Shipped X; it unblocks Y.”",
        },
        {
          name: "Names blockers / risks",
          pass: /\b(block|blocked|blocker|risk|stuck|waiting on|delayed|slip|at risk|need help)\b/.test(
            u,
          ),
          fix: "No surprises: name what's at risk *before* it's late. If nothing is blocked, say so explicitly (“no blockers”).",
        },
        {
          name: "Links to the work (URL-first)",
          pass: /(https?:\/\/|#\d+|\bPR\b|\bissue\b|\/pull\/|\/issues\/)/i.test(
            update,
          ),
          fix: "Link the issue/PR/doc. A status update without a URL makes people ask follow-up questions — the opposite of working loudly.",
        },
        {
          name: "Clear next step / ask",
          pass: /\b(next|then|will|plan to|need|asking|by (mon|tue|wed|thu|fri|monday|tuesday|wednesday|thursday|friday|\d))/.test(
            u,
          ),
          fix: "End with the next concrete step and any ask, with a date. Make it trivial for someone to help.",
        },
        {
          name: "Skimmable (not a wall of text)",
          pass: update.length < 600 || /[-*]\s|\n/.test(update),
          fix: "Break it into bullets. A wall of text gets skimmed or skipped; structure it so the headline lands in two seconds.",
        },
      ];

      const passed = checks.filter((c) => c.pass).length;
      const score = Math.round((passed / checks.length) * 100);
      const lines = checks.map(
        (c) =>
          `${c.pass ? "✅" : "⚠️"} **${c.name}**${c.pass ? "" : ` — ${c.fix}`}`,
      );

      const out = [
        `## Status update score: ${score}/100 (${passed}/${checks.length} checks)`,
        ``,
        ...lines,
        ``,
        passed === checks.length
          ? `This update works loudly: outcome-first, no surprises, linked, and skimmable. Ship it.`
          : `Tighten the ⚠️ items above. The bar: someone three time zones away should know what changed and what's at risk without asking you a single follow-up.`,
      ].join("\n");

      return methodText(out);
    },
  );

  server.registerTool(
    "run_async_standup",
    {
      title: "Async standup template",
      description:
        "Return a structured async-standup prompt a team can adopt in any chat " +
        "or issue — replaces the daily sync standup with a written, searchable " +
        "thread that respects every time zone.",
      inputSchema: {
        cadence: z
          .string()
          .optional()
          .describe("e.g. 'daily', 'twice a week'. Defaults to daily."),
      },
    },
    async ({ cadence = "daily" }) => {
      const out = [
        `## Async standup (${cadence})`,
        ``,
        `Post in the team thread by your local mid-morning. Keep it to three ` +
          `lines. Link everything.`,
        ``,
        `**🟢 Shipped / progress:** What moved since last time? Link the issue/PR.`,
        `**🎯 Today / next:** What are you picking up next?`,
        `**🔴 Blockers:** What's in your way, and who can unblock it? (Write ` +
          `“none” if clear — silence reads as invisibility, not “fine”.)`,
        ``,
        `_Why async: a written standup is searchable, inclusive of people who ` +
          `were asleep during your sync, and creates a record of decisions and ` +
          `blockers. The thread *is* the meeting._`,
      ].join("\n");
      return methodText(out, { next: "get_guidance" });
    },
  );

  server.registerTool(
    "triage_sync_vs_async",
    {
      title: "Triage: sync or async?",
      description:
        "Recommend whether a task should be handled synchronously or " +
        "asynchronously, using the decision rule from 'meetings are a point of " +
        "escalation.' Async is the default; sync is the escalation.",
      inputSchema: {
        task: z
          .string()
          .describe("The task, conversation, or decision to triage."),
      },
    },
    async ({ task }) => {
      const t = task.toLowerCase();
      const syncSignals = [
        {
          re: /\b(conflict|tension|disagree|argument|heated|frustrat)/,
          why: "interpersonal tension — sync is kinder and faster",
        },
        {
          re: /\b(fire|outage|incident|urgent|sev|down|broke|emergency)/,
          why: "active incident — real-time coordination wins",
        },
        {
          re: /\b(feedback|review conversation|one.?on.?one|1:1|performance|raise|promotion|let go|fired|layoff)/,
          why: "sensitive/personal — deliver it live, follow up in writing",
        },
        {
          re: /\b(brainstorm|ideate|explore|ambiguous|unclear|figure out|messy|open.?ended)/,
          why: "high ambiguity with fast back-and-forth — sync to converge, then write it up",
        },
      ];
      const hit = syncSignals.find((s) => s.re.test(t));

      // Routing hints for the coach flow: sync stops the chain (suggested_tool
      // null → "have the conversation"); async branches to an artifact tool.
      const mode = hit ? "sync" : "async";
      const suggested_tool = mode === "async" ? routeArtifact(t) : null;

      const verdict = hit ? "Lean SYNC" : "Default ASYNC";
      const reason = hit
        ? hit.why
        : "this is shareable information or a decision with a clear owner — write it down, set a decide-by date, and let people respond on their own time";

      const out = [
        `## ${verdict}: ${task}`,
        ``,
        `**Why:** ${reason}.`,
        ``,
        `**The rule:** async is the default; sync is the escalation. Reach for ` +
          `a meeting only when async is genuinely failing (thrashing, ` +
          `ambiguity, or it's sensitive/personal). Otherwise the meeting is a ` +
          `tax on everyone who isn't in the room.`,
        ``,
        hit
          ? `**Even if you meet:** send a written pre-read, keep it small, and ` +
            `post the decision and notes back to a URL so the people who ` +
            `weren't there aren't left guessing.`
          : `**To do it async well:** pick the artifact (issue/doc/PR), name one ` +
            `decision owner, set a “decide by” date, and explicitly invite ` +
            `dissent so silence isn't mistaken for agreement.`,
      ].join("\n");

      return methodText(out, {
        mode,
        suggested_tool,
        reason: hit
          ? hit.why
          : `async is the default here — start with ${suggested_tool}`,
      });
    },
  );
}
