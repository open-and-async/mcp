# Contributing

Thanks for helping. Issues and pull requests are welcome, especially bug reports, rough edges in the method tools, and clients the README should cover.

## Setup

```sh
npm ci
npm test     # node --test; CI runs Node 18, 20, 22, and 24
npm start    # run the server over stdio
```

The server is plain JavaScript in [`src/`](src/) with no build step. `engines` promises Node 18, so don't use newer language or runtime features.

## What belongs here

- **Method tools** (decision docs, meeting-to-async, status updates, standups, triage) work from the user's own input. Improvements to their templates and rubrics are welcome.
- **Content tools** answer from `data/book.json.br`, which is built in the book's repo from already-public summaries. Don't add book text here. See [DATA-LICENSE.md](DATA-LICENSE.md).
- If you add, rename, or remove a tool, update the `tools` list in [`manifest.json`](manifest.json) too. A test fails if they drift.

## Releases

Releases are cut by the maintainer only. Pushing a `vX.Y.Z` tag runs [`release.yml`](.github/workflows/release.yml), which waits for maintainer approval before publishing to npm, the MCP registry, and GitHub Releases. Pull requests shouldn't bump versions; that happens in a separate release PR.

## License

Code is under [CODE-LICENSE.md](CODE-LICENSE.md); bundled data is under [DATA-LICENSE.md](DATA-LICENSE.md). By contributing, you agree your contribution is licensed the same way.
