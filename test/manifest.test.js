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
