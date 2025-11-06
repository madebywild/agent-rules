import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { makeTestDir, writeTestFile } from "./helpers/fs.js";
import { CursorProvider } from "../src/providers/cursor.js";

test("CursorProvider inherits retrieval-strategy: always when alwaysApply is true", async t => {
  const tmp = await makeTestDir(t, "cursor");
  const provider = new CursorProvider(tmp);

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

  const outFile = path.join(tmp, ".cursor/rules/test.mdc");
  const content = await fs.readFile(outFile, "utf8");
  const { data } = matter(content);

  assert.equal(data.alwaysApply, true);
  assert.equal(data["retrieval-strategy"], "always");
});

test("CursorProvider does not set retrieval-strategy when alwaysApply is false", async t => {
  const tmp = await makeTestDir(t, "cursor");
  const provider = new CursorProvider(tmp);

  await provider.init();
  await provider.handle({
    filename: "test.md",
    frontMatter: {
      description: "Test rule",
      alwaysApply: false,
    },
    content: "Test content",
  });
  await provider.finish();

  const outFile = path.join(tmp, ".cursor/rules/test.mdc");
  const content = await fs.readFile(outFile, "utf8");
  const { data } = matter(content);

  assert.equal(data.alwaysApply, false);
  assert.equal(data["retrieval-strategy"], undefined);
});

test("CursorProvider respects explicit retrieval-strategy even when alwaysApply is false", async t => {
  const tmp = await makeTestDir(t, "cursor");
  const provider = new CursorProvider(tmp);

  await provider.init();
  await provider.handle({
    filename: "test.md",
    frontMatter: {
      description: "Test rule",
      alwaysApply: false,
      cursor: {
        "retrieval-strategy": "always",
      },
    },
    content: "Test content",
  });
  await provider.finish();

  const outFile = path.join(tmp, ".cursor/rules/test.mdc");
  const content = await fs.readFile(outFile, "utf8");
  const { data } = matter(content);

  assert.equal(data.alwaysApply, false);
  assert.equal(data["retrieval-strategy"], "always");
});

test("CursorProvider respects explicit retrieval-strategy over alwaysApply inheritance", async t => {
  const tmp = await makeTestDir(t, "cursor");
  const provider = new CursorProvider(tmp);

  await provider.init();
  await provider.handle({
    filename: "test.md",
    frontMatter: {
      description: "Test rule",
      alwaysApply: true,
      cursor: {
        "retrieval-strategy": "never",
      },
    },
    content: "Test content",
  });
  await provider.finish();

  const outFile = path.join(tmp, ".cursor/rules/test.mdc");
  const content = await fs.readFile(outFile, "utf8");
  const { data } = matter(content);

  assert.equal(data.alwaysApply, true);
  assert.equal(data["retrieval-strategy"], "never");
});
