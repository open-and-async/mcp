# Open and Async the MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for the book
**[Open and Async](https://open-and-async.com)** by Ben Balter — the
collaborative software-development playbook for remote and distributed teams.

It puts the book's async-first *method* in your editor: scaffolds for decision
docs, a meeting-to-async converter, a status-update rubric, an async standup,
and a sync-vs-async triage — plus the book's outline, chapter summaries, and
shareable taglines.

> **It ships the method, never the manuscript.** The only data file is
> `data/book.json`, built from the book's already-public summaries (TL;DRs,
> key-takeaways, taglines) and a reviewed, paraphrased framework layer. No
> verbatim book prose is bundled — there's nothing to extract from
> `node_modules`. The stories, the voice, and the full argument live in the
> book.

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

## What it exposes

### Method tools (pure utility — no book text)

| Tool | What it does |
| --- | --- |
| `draft_decision_doc` | Decision + options → a structured ADR/decision-doc scaffold (context, options, tradeoffs, decision, reversibility). |
| `convert_meeting_to_async` | Meeting purpose/agenda → the async equivalent (artifact, owner, deadline). |
| `score_status_update` | Scores a draft update against the "work loudly / no surprises" rubric and suggests fixes. |
| `run_async_standup` | A structured async-standup template a team can adopt. |
| `triage_sync_vs_async` | Recommends sync vs async for a task, with the decision rule. |

### Content tools (summary/derived — capped, cited, link to buy)

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

- `async-standup`, `write-adr`, `meeting-to-issue`, `weekly-update` —
  parameterized templates you invoke directly from your client.

## Guardrails

- No single response returns more than ~60 words derived from any one chapter,
  and no tool reconstructs a chapter.
- Every content response cites its chapter and links to buy.
- The package bundles `data/book.json` only — no `src/*.md` from the book.

## Updating the data

`data/book.json` is generated in the book repo by `just mcp-data`
(`script/build-mcp-data.js`) and committed here. `version` tracks the book's
edition, so the server can answer "which edition is this based on?" and re-sync
on new editions.

## Licensing

This package is split-licensed:

- **Code** (everything under `src/`) — [MIT](LICENSE).
- **Data** (`data/book.json`) — proprietary; © Open & Async LLC. You may use it
  only as part of running this software. No redistribution as a standalone
  dataset, no derivative datasets, no model training. See
  [DATA-LICENSE.md](DATA-LICENSE.md).

`data/book.json` carries its own `_copyright` and `_license` fields so the
terms travel with the file. It ships the book’s already-public summaries and a
reviewed framework layer — never its prose. The full work is the book:
[open-and-async.com](https://open-and-async.com).
