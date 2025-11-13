import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { makeTestDir } from "./helpers/fs.js";
import { WindsurfProvider } from "../src/providers/windsurf.js";

test("WindsurfProvider generates .windsurf/rules with markdown files", async t => {
  const tmp = await makeTestDir(t, "windsurf");
  const provider = new WindsurfProvider(tmp);

  await provider.init();
  await provider.handle({
    filename: "test.md",
    frontMatter: {
      description: "Test rule",
      alwaysApply: true,
    },
    content: "Test content",
  });
  await provider.finish();

  const outFile = path.join(tmp, ".windsurf/rules/test.md");
  const content = await fs.readFile(outFile, "utf8");

  assert.ok(content.includes("Test content"));
  assert.equal(content.trim(), "Test content");
});

test("WindsurfProvider trims leading whitespace", async t => {
  const tmp = await makeTestDir(t, "windsurf");
  const provider = new WindsurfProvider(tmp);

  await provider.init();
  await provider.handle({
    filename: "test.md",
    frontMatter: {},
    content: "  \n  Test content with leading whitespace",
  });
  await provider.finish();

  const outFile = path.join(tmp, ".windsurf/rules/test.md");
  const content = await fs.readFile(outFile, "utf8");

  assert.equal(content.trim(), "Test content with leading whitespace");
});

test("WindsurfProvider clears output directory on init", async t => {
  const tmp = await makeTestDir(t, "windsurf");
  const provider = new WindsurfProvider(tmp);
  const outDir = path.join(tmp, ".windsurf/rules");

  // Create output directory with a file
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "old.md"), "old content", "utf8");

  // Initialize provider (should clear the directory)
  await provider.init();

  // Check that old file is gone
  const files = await fs.readdir(outDir);
  assert.equal(files.length, 0);
});

test("WindsurfProvider processes multiple files", async t => {
  const tmp = await makeTestDir(t, "windsurf");
  const provider = new WindsurfProvider(tmp);

  await provider.init();
  await provider.handle({
    filename: "rule1.md",
    frontMatter: {},
    content: "First rule",
  });
  await provider.handle({
    filename: "rule2.md",
    frontMatter: {},
    content: "Second rule",
  });
  await provider.finish();

  const outDir = path.join(tmp, ".windsurf/rules");
  const files = await fs.readdir(outDir);
  
  assert.equal(files.length, 2);
  assert.ok(files.includes("rule1.md"));
  assert.ok(files.includes("rule2.md"));

  const content1 = await fs.readFile(path.join(outDir, "rule1.md"), "utf8");
  const content2 = await fs.readFile(path.join(outDir, "rule2.md"), "utf8");
  
  assert.equal(content1.trim(), "First rule");
  assert.equal(content2.trim(), "Second rule");
});
