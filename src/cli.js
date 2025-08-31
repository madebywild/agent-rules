// src/cli.js
import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {Object} CLIOptions
 * @property {string[]} provider - Custom provider file paths
 * @property {string[]} providers - Built-in providers to use
 * @property {boolean} builtin - Load built-in providers (opposite of --no-builtin)
 * @property {string} input - Source directory
 * @property {string} output - Base output directory
 * @property {boolean} dryRun - Show what would be done without executing
 * @property {boolean} listProviders - List available built-in providers
 * @property {string} validate - Validate a custom provider file
 * @property {boolean} verbose - Verbose output
 * @property {boolean} quiet - Minimal output
 * @property {string} config - Load configuration from JSON file
 * @property {string} filter - Process only files matching pattern
 * @property {number} parallel - Control parallelism
 */

/**
 * Parse command line arguments and return parsed options
 * @returns {CLIOptions}
 */
export function parseArgs() {
  const program = new Command();

  program
    .name("rules-translator")
    .description("Translates global markdown rules into agent-specific formats")
    .version("1.0.0");

  // Provider options
  program
    .option(
      "--provider <path>",
      "Add a custom provider from file path (repeatable)",
      (value, previous) => {
        return previous ? previous.concat([value]) : [value];
      },
      []
    )
    .option(
      "--providers <list>",
      "Run only specific built-in providers (comma-separated)",
      (value) => {
        return value
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
      }
    )
    .option("--no-builtin", "Don't load built-in providers, only custom ones");

  // Input/Output options
  program
    .option(
      "--input <path>",
      "Source directory containing rule files",
      "agent-rules"
    )
    .option("--output <path>", "Base output directory override")
    .option("--dry-run", "Show what would be done without executing");

  // Utility options
  program
    .option("--list-providers", "List available built-in providers")
    .option("--validate <path>", "Validate a custom provider file")
    .option("--verbose", "Verbose output")
    .option("--quiet", "Minimal output");

  // Advanced options
  program
    .option("--config <path>", "Load configuration from JSON file")
    .option("--filter <glob>", "Process only files matching pattern", "*.md")
    .option("--parallel <number>", "Control parallelism", parseInt, 4);

  // Init/setup option
  program.option(
    "--init",
    "Run interactive setup to initialize rules-translator in this workspace"
  );

  program.parse();

  return program.opts();
}

/**
 * Show help information
 */
export function showHelp() {
  console.log(`
Usage: rules-translator [options]

Translates global markdown rules into agent-specific formats.

Options:
  -V, --version              output the version number
  --provider <path>          Add a custom provider from file path (repeatable)
  --providers <list>         Run only specific built-in providers (comma-separated)
  --no-builtin              Don't load built-in providers, only custom ones
  --input <path>            Source directory containing rule files (default: "agent-rules")
  --output <path>           Base output directory override
  --dry-run                 Show what would be done without executing
  --list-providers          List available built-in providers
  --validate <path>         Validate a custom provider file
  --verbose                 Verbose output
  --quiet                   Minimal output
  --config <path>           Load configuration from JSON file
  --filter <glob>           Process only files matching pattern (default: "*.md")
  --parallel <number>       Control parallelism (default: 4)
  --init                    Run interactive setup to initialize workspace
  -h, --help                display help for command

Examples:
  # Use built-in providers only
  rules-translator

  # Use custom provider only
  rules-translator --provider ./my-provider.js --no-builtin

  # Mix built-in and custom providers
  rules-translator --provider ./my-provider.js --providers cursor,cline

  # Advanced usage with custom input and filtering
  rules-translator --input ./custom-rules --filter "**/*.md" --dry-run --verbose

  # Validate a custom provider before using it
  rules-translator --validate ./my-provider.js

  # Initialize in current project
  rules-translator --init

Custom Provider Requirements:
  - Must export a class that implements the RuleProvider interface
  - Should be ES module compatible
  - Must have proper JSDoc types
  - See JSDOC_GUIDE.md for detailed examples
`);
}

/**
 * List all available built-in providers
 * @param {import("./types.js").RuleProvider[]} builtinProviders - Array of built-in providers
 */
export function listProviders(builtinProviders) {
  console.log("\nBuilt-in Providers:");
  for (const provider of builtinProviders) {
    console.log(`  ${provider.id.padEnd(10)} - ${provider.constructor.name}`);
  }
  console.log(`\nTotal: ${builtinProviders.length} providers available\n`);
}

/**
 * Load configuration from a JSON file
 * @param {string} configPath - Path to configuration file
 * @returns {Promise<CLIOptions>} Parsed configuration
 */
export async function loadConfig(configPath) {
  try {
    const configContent = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configContent);
    return config;
  } catch (error) {
    throw new Error(
      `Failed to load configuration from ${configPath}: ${error.message}`
    );
  }
}
