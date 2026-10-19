import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// server.json restates package.json's version for the MCP registry, and the
// registry checks mcpName against the npm package when publishing. They're
// bumped by hand, and server.json has already been left a release behind
// once, so fail the build when they disagree.
const read = (file) =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
const pkg = read("package.json");
const server = read("server.json");
const bundle = read("manifest.json");

test("server.json version matches package.json", () => {
  assert.equal(server.version, pkg.version);
});

test("server.json npm package version matches package.json", () => {
  const npm = server.packages.find((p) => p.identifier === pkg.name);
  assert.ok(npm, `server.json should list the ${pkg.name} npm package`);
  assert.equal(npm.version, pkg.version);
});

test("server.json name matches package.json mcpName", () => {
  assert.equal(server.name, pkg.mcpName);
});

// manifest.json is the MCPB bundle manifest (Smithery, Claude Desktop one-click
// install). It restates the version and the tool list, so guard both.
test("manifest.json version matches package.json", () => {
  assert.equal(bundle.version, pkg.version);
});

test("manifest.json lists exactly the tools the server registers", async () => {
  const { captureServer } = await import("./helpers.js");
  const { registerMethodTools } = await import("../src/tools/methods.js");
  const { registerContentTools } = await import("../src/tools/content.js");
  const cap = captureServer();
  registerMethodTools(cap.server);
  registerContentTools(cap.server);
  assert.deepEqual(
    bundle.tools.map((t) => t.name).sort(),
    [...cap.tools.keys()].sort(),
  );
});
