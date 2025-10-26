import test from "node:test";
import assert from "node:assert/strict";
import { buildRules } from "../src/index.js";
import fs from "node:fs/promises";
import path from "node:path";
import { makeTestDir, writeTestFile } from "./helpers/fs.js";

class StubProvider {
  constructor() {
    this.id = "stub";
    this.calls = { init: 0, handle: [], finish: 0 };
  }
  async init() {
    this.calls.init++;
  }
  async handle(payload) {
    this.calls.handle.push(payload.filename);
  }
  async finish() {
    this.calls.finish++;
  }
}

test("buildRules in dry-run does not call provider methods", async t => {
  const tmp = await makeTestDir(t, "build");
  await writeTestFile(tmp, "a.md", "---\ntitle: A\n---\nContent A");
  await writeTestFile(tmp, "b.md", "---\ntitle: B\n---\nContent B");

  const provider = new StubProvider();
  await buildRules({
    providers: [provider],
    inputDir: tmp,
    filePattern: "*.md",
    dryRun: true,
    verbose: false,
    quiet: true,
  });

  assert.equal(provider.calls.init, 0);
  assert.equal(provider.calls.finish, 0);
  assert.equal(provider.calls.handle.length, 0);
});

test("buildRules processes files and calls provider methods", async t => {
  const tmp = await makeTestDir(t, "build");
  await writeTestFile(tmp, "a.md", "---\ntitle: A\n---\nContent A");
  await writeTestFile(tmp, "nested/c.md", "---\ntitle: C\n---\nContent C");

  const provider = new StubProvider();
  await buildRules({
    providers: [provider],
    inputDir: tmp,
    filePattern: "**/*.md",
    dryRun: false,
    verbose: false,
    quiet: true,
  });

  assert.equal(provider.calls.init, 1);
  assert.equal(provider.calls.finish, 1);
  // Each found file should be handled once
  provider.calls.handle.sort();
  assert.deepEqual(provider.calls.handle.sort(), ["a.md", "nested/c.md"]);
});

test("built-in providers respect base output directory", async t => {
  const tmp = await makeTestDir(t, "outputs");
  await writeTestFile(tmp, "rule.md", "---\ndescription: Test\n---\nBody");

  // Import real providers via loader with output override
  const { loadProviders } = await import("../src/provider-loader.js");
  const providers = await loadProviders({ builtin: true, output: tmp });

  await buildRules({
    providers,
    inputDir: tmp,
    filePattern: "**/*.md",
    dryRun: false,
    verbose: false,
    quiet: true,
  });

  // Assert expected files exist under tmp (not project root)
  await fs.access(path.join(tmp, ".cursor/rules/rule.mdc"));
  await fs.access(path.join(tmp, ".clinerules/rule.md"));
  await fs.access(path.join(tmp, "CLAUDE.md"));
  await fs.access(path.join(tmp, ".github/copilot-instructions.md"));
  await fs.access(path.join(tmp, "AGENTS.md"));
  await fs.access(path.join(tmp, "replit.md"));
});
