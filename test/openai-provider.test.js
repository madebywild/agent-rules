import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { makeTestDir, writeTestFile } from "./helpers/fs.js";
import { OpenAIProvider } from "../src/providers/openai.js";

test("OpenAIProvider generates AGENTS.md with aggregated content", async t => {
  const tmp = await makeTestDir(t, "openai");
  const provider = new OpenAIProvider(tmp);

  assert.equal(provider.id, "openai");

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

  // Handle file with openai-specific overrides
  await provider.handle({
    filename: "rule3.md",
    frontMatter: {
      description: "Third Rule",
      openai: { title: "OpenAI Specific Title" },
    },
    content: "Content of third rule",
  });

  // Finalize
  await provider.finish();

  // Verify AGENTS.md was created
  const outFile = path.join(tmp, "AGENTS.md");
  const content = await fs.readFile(outFile, "utf8");

  // Verify structure and content
  assert.ok(content.includes("## First Rule"));
  assert.ok(content.includes("Content of first rule"));
  assert.ok(content.includes("## Second Rule Title"));
  assert.ok(content.includes("Content of second rule"));
  assert.ok(content.includes("## OpenAI Specific Title")); // Should use openai override
  assert.ok(content.includes("Content of third rule"));

  // Verify ends with newline
  assert.ok(content.endsWith("\n"));
});

test("OpenAIProvider uses description when title is missing", async t => {
  const tmp = await makeTestDir(t, "openai-desc");
  const provider = new OpenAIProvider(tmp);

  await provider.init();

  await provider.handle({
    filename: "rule.md",
    frontMatter: { description: "Only description provided" },
    content: "Rule content",
  });

  await provider.finish();

  const outFile = path.join(tmp, "AGENTS.md");
  const content = await fs.readFile(outFile, "utf8");

  assert.ok(content.includes("## Only description provided"));
});

test("OpenAIProvider defaults to Untitled when no title or description", async t => {
  const tmp = await makeTestDir(t, "openai-untitled");
  const provider = new OpenAIProvider(tmp);

  await provider.init();

  await provider.handle({
    filename: "rule.md",
    frontMatter: {},
    content: "Rule content",
  });

  await provider.finish();

  const outFile = path.join(tmp, "AGENTS.md");
  const content = await fs.readFile(outFile, "utf8");

  assert.ok(content.includes("## Untitled"));
});

test("OpenAIProvider cleans up existing file on init", async t => {
  const tmp = await makeTestDir(t, "openai-cleanup");
  const outFile = path.join(tmp, "AGENTS.md");

  // Create existing file
  await fs.writeFile(outFile, "Old content", "utf8");

  const provider = new OpenAIProvider(tmp);
  await provider.init();
  await provider.finish();

  // Should be empty (just a newline after trimming)
  const content = await fs.readFile(outFile, "utf8");
  assert.equal(content, "\n");
});
