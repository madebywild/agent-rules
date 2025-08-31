import test from "node:test";
import assert from "node:assert/strict";

// Ensure fresh import each time when mutating argv
async function importCLI() {
  return await import("../src/cli.js");
}

function withArgs(args, fn) {
  const old = process.argv;
  process.argv = ["node", "agent-rules", ...args];
  try {
    return fn();
  } finally {
    process.argv = old;
  }
}

test("parseArgs returns defaults with no args", async () => {
  const { parseArgs } = await importCLI();
  const opts = withArgs([], () => parseArgs());
  assert.equal(opts.input, "agent-rules");
  assert.equal(opts.filter, "*.md");
  assert.equal(opts.builtin, true);
  assert.equal(opts.dryRun, undefined);
});

test("parseArgs parses provider list and flags", async () => {
  const { parseArgs } = await importCLI();
  const opts = withArgs(
    [
      "--providers",
      "cursor, cline,claude",
      "--no-builtin",
      "--dry-run",
      "--input",
      "rules",
      "--output",
      "./out",
      "--filter",
      "**/*.md",
    ],
    () => parseArgs(),
  );

  assert.deepEqual(opts.providers, ["cursor", "cline", "claude"]);
  assert.equal(opts.builtin, false);
  assert.equal(opts.dryRun, true);
  assert.equal(opts.input, "rules");
  assert.equal(opts.output, "./out");
  assert.equal(opts.filter, "**/*.md");
});

test("showHelp prints usage text", async () => {
  const { showHelp } = await importCLI();
  let output = "";
  const oldLog = console.log;
  console.log = (s = "") => {
    output += String(s);
  };
  try {
    showHelp();
  } finally {
    console.log = oldLog;
  }
  assert.match(output, /Usage: agent-rules/);
  assert.match(output, /--list-providers/);
});
