# Open and Async — MCP Server

Bring async-first working practices into your editor and AI assistant. This
[Model Context Protocol](https://modelcontextprotocol.io) server gives your AI the
tools to draft a decision doc, turn a meeting into an async artifact, pressure-test a
status update, or settle a sync-vs-async debate — without leaving the tools you
already work in.

It's the method from **[Open and Async](https://open-and-async.com)** — the
collaborative software-development playbook for remote and distributed teams — as
working tools, not reading.

## What you can do with it

- **Stop writing decision docs from a blank page.** Hand your AI the decision and the
  options; get back a structured ADR scaffold — context, tradeoffs, the call, and how
  reversible it is.
- **Turn "let's hop on a call" into an artifact.** Give it a meeting's purpose and
  agenda; get the async equivalent with an owner and a deadline.
- **Ship status updates that don't blindside anyone.** Score a draft against the
  "work loudly / no surprises" rubric and get concrete fixes before you post it.
- **Settle sync vs. async in seconds.** Describe the task; get a recommendation and
  the rule behind it.
- **Run a standup without a meeting.** Drop in a structured async-standup template
  your team can adopt today.
- **Win the "async is too slow" argument.** Map common objections to a ready reframe,
  pull role-aware guidance, or search the book's principles — each answer cited and
  linked.

## Install

**Claude Code:**

```sh
claude mcp add open-async -- npx -y @open-and-async/mcp
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "open-async": {
      "command": "npx",
      "args": ["-y", "@open-and-async/mcp"]
    }
  }
}
```

Any MCP client that speaks stdio works the same way: run `npx @open-and-async/mcp`.

## The toolbox

### Method tools — pure utility, use them on any project

| Tool | What it does |
| --- | --- |
| `draft_decision_doc` | Decision + options → a structured ADR/decision-doc scaffold (context, options, tradeoffs, decision, reversibility). |
| `convert_meeting_to_async` | Meeting purpose/agenda → the async equivalent (artifact, owner, deadline). |
| `score_status_update` | Scores a draft update against the "work loudly / no surprises" rubric and suggests fixes. |
| `run_async_standup` | A structured async-standup template a team can adopt. |
| `triage_sync_vs_async` | Recommends sync vs async for a task, with the decision rule. |

### Reference tools — the book's thinking, on demand

| Tool | What it does |
| --- | --- |
| `book_outline` | Sections + chapters + one-line TL;DRs. The map. |
| `get_chapter_summary` | A chapter's TL;DR + taglines + read-the-chapter link. |
| `search_principles` | Keyword search over the summary corpus; short cited snippets. |
| `handle_objection` | Maps skepticism ("async is slow") to the book's reframe. |
| `get_guidance` | Role-aware (`manager`/`ic`) guidance for a topic. |
| `get_taglines` | Taglines + their `/q/<slug>` quote-card URLs. |

### Resources

- `book://outline` — sections, chapters, TL;DRs (JSON)
- `book://taglines` — taglines + quote-card URLs (JSON)

### Prompts

Parameterized templates you invoke directly from your client:
`async-standup`, `write-adr`, `meeting-to-issue`, `weekly-update`.

## Good to know

**It's a real tool, not a paywall.** The method tools work on their own — no book
required. The reference tools answer from the book's already-public summaries and a
paraphrased framework layer, always capped, always cited, always linked back so you
can go deeper. No verbatim book prose is bundled (the only data file is
`data/book.json`), so what you install is genuinely useful, not a teaser.

**Staying current.** `data/book.json` ships with a `version` that tracks the book's
edition, so the server can tell you which edition it's based on and re-sync when a new
one lands.

## Licensing

This package is split-licensed:

- **Code** (everything under `src/`) — [MIT](LICENSE).
- **Data** (`data/book.json`) — proprietary; © Open & Async LLC. You may use it only
  as part of running this software. No redistribution as a standalone dataset, no
  derivative datasets, no model training. See [DATA-LICENSE.md](DATA-LICENSE.md).

The full work — the stories, the voice, the complete argument — lives in the book:
**[open-and-async.com](https://open-and-async.com)**.
