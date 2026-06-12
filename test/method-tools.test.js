import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { registerMethodTools } from "../src/tools/methods.js";
import { captureServer, textOf } from "./helpers.js";

let cap;
beforeEach(() => {
  cap = captureServer();
  registerMethodTools(cap.server);
});

test("registers all five method tools", () => {
  assert.deepEqual(
    [...cap.tools.keys()].sort(),
    [
      "convert_meeting_to_async",
      "draft_decision_doc",
      "run_async_standup",
      "score_status_update",
      "triage_sync_vs_async",
    ],
  );
});

test("draft_decision_doc uses supplied options and context", async () => {
  const out = textOf(
    await cap.call("draft_decision_doc", {
      decision: "Adopt trunk-based development",
      options: ["Trunk-based", "GitFlow"],
      context: "Release cadence is too slow.",
    }),
  );
  assert.match(out, /# Decision: Adopt trunk-based development/);
  assert.match(out, /Option 1: Trunk-based/);
  assert.match(out, /Option 2: GitFlow/);
  assert.match(out, /Release cadence is too slow\./);
  assert.match(out, /## Reversibility/);
});

test("draft_decision_doc supplies default options when none given", async () => {
  const out = textOf(
    await cap.call("draft_decision_doc", { decision: "Pick a database" }),
  );
  assert.match(out, /Do nothing \(status quo\)/);
});

test("convert_meeting_to_async renders one table row per agenda item", async () => {
  const out = textOf(
    await cap.call("convert_meeting_to_async", {
      purpose: "Weekly sync",
      agenda: ["Roadmap", "Hiring"],
    }),
  );
  assert.match(out, /Async replacement for: Weekly sync/);
  const rows = out
    .split("\n")
    .filter((l) => l.startsWith("| ") && !l.includes("---") && !l.includes("Topic"));
  assert.equal(rows.length, 2);
  assert.match(out, /Roadmap/);
  assert.match(out, /Hiring/);
});

test("score_status_update gives a perfect score to a loud, linked update", async () => {
  const update =
    "Shipped the billing migration (https://github.com/acme/repo/pull/42); " +
    "it unblocks the dunning work. No blocker right now. Next: I'll wire up retries by Friday.";
  const out = textOf(await cap.call("score_status_update", { update }));
  assert.match(out, /100\/100/);
  assert.match(out, /5\/5 checks/);
  assert.ok(!out.includes("⚠️"));
});

test("score_status_update flags a vague, activity-only update", async () => {
  const out = textOf(
    await cap.call("score_status_update", {
      update: "Worked on stuff today and went to some meetings about the thing.",
    }),
  );
  assert.match(out, /⚠️/);
  // Score is a percentage strictly below 100.
  const m = out.match(/score: (\d+)\/100/);
  assert.ok(m, "should report a score");
  assert.ok(Number(m[1]) < 100);
});

test("triage_sync_vs_async defaults to async for routine work", async () => {
  const out = textOf(
    await cap.call("triage_sync_vs_async", {
      task: "Decide which logging library to standardize on",
    }),
  );
  assert.match(out, /Default ASYNC/);
});

test("triage_sync_vs_async leans sync for incidents and interpersonal tension", async () => {
  for (const task of [
    "Production is down, the API is throwing 500s",
    "Two engineers are in open conflict about the rewrite",
  ]) {
    const out = textOf(await cap.call("triage_sync_vs_async", { task }));
    assert.match(out, /Lean SYNC/, `expected SYNC for: ${task}`);
  }
});

test("run_async_standup reflects the requested cadence", async () => {
  const out = textOf(
    await cap.call("run_async_standup", { cadence: "twice a week" }),
  );
  assert.match(out, /Async standup \(twice a week\)/);
  assert.match(out, /Blockers/);
});

test("run_async_standup defaults to daily", async () => {
  const out = textOf(await cap.call("run_async_standup", {}));
  assert.match(out, /Async standup \(daily\)/);
});
