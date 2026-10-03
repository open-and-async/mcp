# CLAUDE.md

The Open & Async MCP server: a stdio [Model Context Protocol](https://modelcontextprotocol.io) server published to npm as `@open-and-async/mcp`. The [README](README.md) covers the tools, install, and licensing.

## Commands

```sh
npm ci
npm test     # node --test; CI runs it on Node 18, 20 and 22
npm start    # run the server over stdio
```

Run `npm test` before every push. The server is plain JavaScript in [`src/`](src/) with no build step, and `engines` promises Node 18, so don't use newer language or runtime features.

## Releasing

Nothing publishes automatically. A release is done by hand: `npm publish`, then `mcp-publisher publish` for the [MCP registry](https://registry.modelcontextprotocol.io), with a git tag such as `v1.0.2`. [Smithery](smithery.yaml) installs from npm.

Releases happen only after the owner explicitly approves that release. Agents may prepare the version-bump pull request, but never run `npm publish` or `mcp-publisher`, push a tag, or create a GitHub Release. Push branches with `git push --no-follow-tags`.

A version bump keeps these in sync, or the registry entry points at a version npm doesn't have:

- `version` in [`package.json`](package.json)
- `version` and `packages[0].version` in [`server.json`](server.json)
- `mcpName` in `package.json`, which must equal `name` in `server.json`
