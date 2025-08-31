import test from "node:test";
import assert from "node:assert/strict";
import { buildRules } from "../src/index.js";
import { filterProvidersForRule, cleanFrontMatter } from "../src/utils.js";
import { makeTestDir, writeTestFile } from "./helpers/fs.js";

// Mock provider classes for testing
class MockProvider {
  constructor(id) {
    this.id = id;
    this.calls = { init: 0, handle: [], finish: 0 };
  }
  
  async init() {
    this.calls.init++;
  }
  
  async handle(payload) {
    this.calls.handle.push({
      filename: payload.filename,
      frontMatter: payload.frontMatter,
    });
  }
  
  async finish() {
    this.calls.finish++;
  }
}

test("filterProvidersForRule with _includeOnlyForProviders", () => {
  const providers = [
    new MockProvider("cursor"),
    new MockProvider("cline"),
    new MockProvider("claude"),
  ];

  const frontMatter = {
    description: "Test rule",
    _includeOnlyForProviders: "cursor,cline",
  };

  const filtered = filterProvidersForRule(providers, frontMatter);
  assert.equal(filtered.length, 2);
  assert.ok(filtered.find(p => p.id === "cursor"));
  assert.ok(filtered.find(p => p.id === "cline"));
  assert.ok(!filtered.find(p => p.id === "claude"));
});

test("filterProvidersForRule with _excludeForProviders", () => {
  const providers = [
    new MockProvider("cursor"),
    new MockProvider("cline"),
    new MockProvider("claude"),
  ];

  const frontMatter = {
    description: "Test rule",
    _excludeForProviders: "claude",
  };

  const filtered = filterProvidersForRule(providers, frontMatter);
  assert.equal(filtered.length, 2);
  assert.ok(filtered.find(p => p.id === "cursor"));
  assert.ok(filtered.find(p => p.id === "cline"));
  assert.ok(!filtered.find(p => p.id === "claude"));
});

test("filterProvidersForRule with both fields - includeOnly takes precedence", () => {
  const providers = [
    new MockProvider("cursor"),
    new MockProvider("cline"),
    new MockProvider("claude"),
  ];

  const frontMatter = {
    description: "Test rule",
    _includeOnlyForProviders: "cursor",
    _excludeForProviders: "cline,claude",
  };

  const filtered = filterProvidersForRule(providers, frontMatter);
  assert.equal(filtered.length, 1);
  assert.ok(filtered.find(p => p.id === "cursor"));
});

test("filterProvidersForRule with no filtering fields returns all providers", () => {
  const providers = [
    new MockProvider("cursor"),
    new MockProvider("cline"),
    new MockProvider("claude"),
  ];

  const frontMatter = {
    description: "Test rule",
  };

  const filtered = filterProvidersForRule(providers, frontMatter);
  assert.equal(filtered.length, 3);
});

test("filterProvidersForRule handles whitespace in provider lists", () => {
  const providers = [
    new MockProvider("cursor"),
    new MockProvider("cline"),
    new MockProvider("claude"),
  ];

  const frontMatter = {
    description: "Test rule",
    _includeOnlyForProviders: " cursor , cline ",
  };

  const filtered = filterProvidersForRule(providers, frontMatter);
  assert.equal(filtered.length, 2);
  assert.ok(filtered.find(p => p.id === "cursor"));
  assert.ok(filtered.find(p => p.id === "cline"));
});

test("filterProvidersForRule handles invalid provider IDs gracefully", () => {
  const providers = [
    new MockProvider("cursor"),
    new MockProvider("cline"),
  ];

  const frontMatter = {
    description: "Test rule",
    _includeOnlyForProviders: "cursor,unknown-provider",
  };

  const filtered = filterProvidersForRule(providers, frontMatter);
  assert.equal(filtered.length, 1);
  assert.ok(filtered.find(p => p.id === "cursor"));
});

test("cleanFrontMatter removes filtering directives", () => {
  const original = {
    description: "Test rule",
    alwaysApply: true,
    _includeOnlyForProviders: "cursor,cline",
    _excludeForProviders: "claude",
    cursor: {
      "retrieval-strategy": "always",
    },
  };

  const cleaned = cleanFrontMatter(original);

  assert.equal(cleaned.description, "Test rule");
  assert.equal(cleaned.alwaysApply, true);
  assert.deepEqual(cleaned.cursor, { "retrieval-strategy": "always" });
  assert.equal(cleaned._includeOnlyForProviders, undefined);
  assert.equal(cleaned._excludeForProviders, undefined);
});

test("buildRules respects _includeOnlyForProviders in rule files", async t => {
  const tmp = await makeTestDir(t, "provider-filtering");
  
  // Create test files
  await writeTestFile(
    tmp,
    "cursor-only.md",
    "---\ndescription: Cursor only rule\n_includeOnlyForProviders: cursor\n---\nCursor only content"
  );
  
  await writeTestFile(
    tmp,
    "no-claude.md",
    "---\ndescription: No Claude rule\n_excludeForProviders: claude\n---\nNo Claude content"
  );
  
  await writeTestFile(
    tmp,
    "all-providers.md",
    "---\ndescription: All providers rule\n---\nAll providers content"
  );

  const providers = [
    new MockProvider("cursor"),
    new MockProvider("cline"),
    new MockProvider("claude"),
  ];

  await buildRules({
    providers,
    inputDir: tmp,
    filePattern: "**/*.md",
    dryRun: false,
    verbose: false,
    quiet: true,
  });

  // Check cursor-only.md was only processed by cursor
  const cursorOnlyHandlers = providers.map(p => 
    p.calls.handle.filter(call => call.filename === "cursor-only.md").length
  );
  assert.deepEqual(cursorOnlyHandlers, [1, 0, 0]); // [cursor, cline, claude]

  // Check no-claude.md was processed by cursor and cline but not claude
  const noClaudeHandlers = providers.map(p => 
    p.calls.handle.filter(call => call.filename === "no-claude.md").length
  );
  assert.deepEqual(noClaudeHandlers, [1, 1, 0]); // [cursor, cline, claude]

  // Check all-providers.md was processed by all providers
  const allProvidersHandlers = providers.map(p => 
    p.calls.handle.filter(call => call.filename === "all-providers.md").length
  );
  assert.deepEqual(allProvidersHandlers, [1, 1, 1]); // [cursor, cline, claude]

  // Verify filtering directives are not passed to providers
  const cursorCalls = providers[0].calls.handle;
  const cursorOnlyCall = cursorCalls.find(call => call.filename === "cursor-only.md");
  assert.equal(cursorOnlyCall.frontMatter._includeOnlyForProviders, undefined);
  assert.equal(cursorOnlyCall.frontMatter._excludeForProviders, undefined);
  assert.equal(cursorOnlyCall.frontMatter.description, "Cursor only rule");
});