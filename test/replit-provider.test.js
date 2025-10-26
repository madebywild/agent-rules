import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { makeTestDir, writeTestFile } from "./helpers/fs.js";
import { ReplitProvider } from "../src/providers/replit.js";

test("ReplitProvider generates replit.md with aggregated content", async t => {
  const tmp = await makeTestDir(t, "replit");
  const provider = new ReplitProvider(tmp);

  assert.equal(provider.id, "replit");

  // Initialize
  await provider.init();

  // Handle multiple rule files
  await provider.handle({
    filename: "rule1.md",
    frontMatter: { description: "First Rule" },
    content: "Content of first rule",
  });

  await provider.handle({
    filename: "rule2.md",
    frontMatter: { title: "Second Rule Title" },
    content: "Content of second rule",
  });

  // Handle file with replit-specific overrides
  await provider.handle({
    filename: "rule3.md",
    frontMatter: {
      description: "Third Rule",
      replit: { title: "Replit Specific Title" },
    },
    content: "Content of third rule",
  });

  // Finalize
  await provider.finish();

  // Verify replit.md was created
  const outFile = path.join(tmp, "replit.md");
  const content = await fs.readFile(outFile, "utf8");

  // Verify structure and content
  assert.ok(content.includes("## First Rule"));
  assert.ok(content.includes("Content of first rule"));
  assert.ok(content.includes("## Second Rule Title"));
  assert.ok(content.includes("Content of second rule"));
  assert.ok(content.includes("## Replit Specific Title")); // Should use replit override
  assert.ok(content.includes("Content of third rule"));

  // Verify ends with newline
  assert.ok(content.endsWith("\n"));
});

test("ReplitProvider uses description when title is missing", async t => {
  const tmp = await makeTestDir(t, "replit-desc");
  const provider = new ReplitProvider(tmp);

  await provider.init();

  await provider.handle({
    filename: "rule.md",
    frontMatter: { description: "Only description provided" },
    content: "Rule content",
  });

  await provider.finish();

  const outFile = path.join(tmp, "replit.md");
  const content = await fs.readFile(outFile, "utf8");

  assert.ok(content.includes("## Only description provided"));
});

test("ReplitProvider defaults to Untitled when no title or description", async t => {
  const tmp = await makeTestDir(t, "replit-untitled");
  const provider = new ReplitProvider(tmp);

  await provider.init();

  await provider.handle({
    filename: "rule.md",
    frontMatter: {},
    content: "Rule content",
  });

  await provider.finish();

  const outFile = path.join(tmp, "replit.md");
  const content = await fs.readFile(outFile, "utf8");

  assert.ok(content.includes("## Untitled"));
});

test("ReplitProvider cleans up existing file on init", async t => {
  const tmp = await makeTestDir(t, "replit-cleanup");
  const outFile = path.join(tmp, "replit.md");

  // Create existing file
  await fs.writeFile(outFile, "Old content", "utf8");

  const provider = new ReplitProvider(tmp);
  await provider.init();
  await provider.finish();

  // Should be empty (just a newline after trimming)
  const content = await fs.readFile(outFile, "utf8");
  assert.equal(content, "\n");
});
