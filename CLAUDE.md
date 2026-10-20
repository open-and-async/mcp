# CLAUDE.md

The Open & Async MCP server: a stdio [Model Context Protocol](https://modelcontextprotocol.io) server published to npm as `@open-and-async/mcp`. The [README](README.md) covers the tools, install, and licensing.

## Commands

```sh
npm ci
npm test     # node --test; CI runs it on Node 18, 20 and 22
npm start    # run the server over stdio
```

Run `npm test` before every push. The server is plain JavaScript in [`src/`](src/) with no build step, and `engines` promises Node 18, so don't use newer language or runtime features.

The tools also run in the browser: [`src/browser.js`](src/browser.js) (`@open-and-async/mcp/browser`) registers them with WebMCP for [open-and-async.com](https://open-and-async.com). Everything it imports, meaning [`src/book.js`](src/book.js) and [`src/tools/`](src/tools/), must stay free of `node:` modules and file reads; [`test/browser.test.js`](test/browser.test.js) enforces it. Node-only loading belongs in [`src/data.js`](src/data.js). `package.json` has an `exports` map, so a new public entry point needs a line there.

## Releasing

Releases run from [`.github/workflows/release.yml`](.github/workflows/release.yml) when a `vX.Y.Z` tag is pushed, and wait in the `release` environment for the owner's approval before anything runs. Two jobs each need an approval, in order. The first tests, checks that the tag matches `package.json`, publishes to npm via [trusted publishing](https://docs.npmjs.com/trusted-publishers) (no token; adds provenance), and creates the GitHub Release with the `.mcpb` bundle attached. The second publishes `server.json` to the [MCP registry](https://registry.modelcontextprotocol.io) with the domain key in the `MCP_PRIVATE_KEY` environment secret. It runs second because the registry rejects a version npm doesn't have yet, and in its own read-only job because `mcp-publisher` is downloaded at run time. Release notes are generated from merged PRs; check that they credit outside contributors before approving.

[Smithery](https://smithery.ai) takes local servers only as an [MCPB bundle](https://github.com/modelcontextprotocol/mcpb), but its API has refused to create new servers since at least 2026-10-19 ("Updating servers has been removed"), so the server isn't listed there. Its server card needs an `inputSchema` on every tool, which the MCPB manifest schema doesn't allow, so a Smithery bundle needs its `manifest.json` tools filled from the live `tools/list` first.

Releases happen only after the owner explicitly approves that release. Agents may prepare the version-bump pull request, but never run `npm publish` or `mcp-publisher`, push a tag, create a GitHub Release, or approve a `release` deployment. Push branches with `git push --no-follow-tags`.

A version bump keeps these in sync, or the registry entry points at a version npm doesn't have:

- `version` in [`package.json`](package.json) and [`package-lock.json`](package-lock.json) (`npm version <x> --no-git-tag-version` updates both without creating a tag)
- `version` and `packages[0].version` in [`server.json`](server.json)
- `mcpName` in `package.json`, which must equal `name` in `server.json`
- `version` in [`manifest.json`](manifest.json), and its `tools` list whenever a tool is added, renamed, or removed
