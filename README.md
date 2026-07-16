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
- **Get coached end to end.** Run the `coach` prompt with a situation and it triages
  sync vs. async, generates the right artifact, adds role guidance, and caps with a
  shareable line — one composed answer, or a nudge to just have the conversation when
  that's the better call.

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
- `book://about` — what this server is, what it does and doesn't contain, and where to get the book

### Prompts

Invoke these directly from your client (e.g. as slash commands):

- `coach` — **the full method on one situation.** Triages sync vs. async, generates
  the right artifact, enriches with role guidance, and caps with a shareable tagline —
  one composed deliverable. Stops and recommends a real-time conversation when the
  situation genuinely needs one.
- `async-standup`, `write-adr`, `meeting-to-issue`, `weekly-update` — parameterized
  templates for a single task.

## Good to know

**It's a real tool, not a paywall.** The method tools work on their own — no book
required. The reference tools answer from the book's already-public summaries and a
paraphrased framework layer, always capped and always cited so you can trace any
snippet to its chapter. The "get the book" link surfaces about once per session, not
on every line — it's a tool, not an ad. No verbatim book prose is bundled (the only
data file is `data/book.json.br`), so what you install is genuinely useful, not a
teaser.

**Staying current.** `data/book.json.br` ships with a `version` that tracks the book's
edition, so the server can tell you which edition it's based on and re-sync when a new
one lands.

**Generated output is a template, not the author speaking.** The method tools format
_your_ input into decision docs, standups, and triage calls. That output is generated
guidance to adapt — it is not a personal statement, quote, or endorsement by Ben Balter
or Open & Async LLC, and shouldn't be presented as one. Reference-tool snippets are
summaries the tool cites back to the book, not verbatim prose.

## Licensing

This package is split-licensed — see [LICENSE](LICENSE) for the overview:

- **Code** (everything under `src/`) — [MIT](CODE-LICENSE.md).
- **Data** (`data/book.json.br`) — proprietary; © Open & Async LLC. You may use it only
  as part of running this software. No redistribution as a standalone dataset, no
  derivative datasets, no model training. See [DATA-LICENSE.md](DATA-LICENSE.md).

The full work — the stories, the voice, the complete argument — lives in the book:
**[open-and-async.com](https://open-and-async.com)**.
