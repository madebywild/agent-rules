#!/usr/bin/env node
// src/index.js
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import fastGlob from "fast-glob";
import { fileURLToPath } from "node:url";
import { parseArgs, showHelp, listProviders, loadConfig } from "./cli.js";
import { runInit } from "./init.js";
import {
  loadProviders,
  getBuiltinProviders,
  validateProviderFile,
} from "./provider-loader.js";

/**
 * Build rules by processing all markdown files and converting them using providers
 * @param {Object} options - Build options
 * @param {import("./types.js").RuleProvider[]} options.providers - Array of providers to use
 * @param {string} options.inputDir - Source directory containing rule files
 * @param {string} options.filePattern - Glob pattern for files to process
 * @param {boolean} options.dryRun - Whether to perform a dry run
 * @param {boolean} options.verbose - Whether to use verbose logging
 * @param {boolean} options.quiet - Whether to use minimal logging
 * @returns {Promise<void>}
 */
export async function buildRules({
  providers,
  inputDir,
  filePattern,
  dryRun,
  verbose,
  quiet,
}) {
  const SRC_DIR = path.resolve(inputDir);

  if (!quiet) {
    console.log(`🔍 Scanning for files in: ${SRC_DIR}`);
    console.log(`📁 Pattern: ${filePattern}`);
    console.log(`🔧 Providers: ${providers.map((p) => p.id).join(", ")}`);
  }

  // Check if source directory exists
  try {
    await fs.access(SRC_DIR, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Source directory not found: ${SRC_DIR}`);
  }

  const files = fastGlob.sync(filePattern, { cwd: SRC_DIR });

  if (files.length === 0) {
    if (!quiet) {
      console.log(`⚠️  No files found matching pattern: ${filePattern}`);
    }
    return;
  }

  if (verbose) {
    console.log(`📄 Found ${files.length} files: ${files.join(", ")}`);
  } else if (!quiet) {
    console.log(`📄 Found ${files.length} files to process`);
  }

  if (dryRun) {
    console.log("\n🔍 DRY RUN - No files will be modified\n");

    for (const provider of providers) {
      console.log(`Provider: ${provider.id} (${provider.constructor.name})`);
      for (const filename of files) {
        console.log(`  Would process: ${filename}`);
      }
    }
    return;
  }

  // one-time setup per provider
  if (verbose) {
    console.log("🚀 Initializing providers...");
  }
  await Promise.all(
    providers.map(async (p) => {
      if (verbose) {
        console.log(`  Initializing ${p.id}...`);
      }
      await p.init();
    })
  );

  // one pass over every source file
  if (!quiet) {
    console.log("📝 Processing files...");
  }

  for (const filename of files) {
    if (verbose) {
      console.log(`  Processing: ${filename}`);
    }

    const raw = await fs.readFile(path.join(SRC_DIR, filename), "utf8");
    const { data: frontMatter, content } = matter(raw);

    await Promise.all(
      providers.map(async (p) => {
        if (verbose) {
          console.log(`    ${p.id}: ${filename}`);
        }
        await p.handle({ filename, frontMatter, content });
      })
    );
  }

  // finalise
  if (verbose) {
    console.log("🏁 Finalizing providers...");
  }
  await Promise.all(
    providers.map(async (p) => {
      if (verbose) {
        console.log(`  Finalizing ${p.id}...`);
      }
      await p.finish();
    })
  );

  if (!quiet) {
    console.log("✅ Build completed successfully!");
  }
}

/**
 * Main CLI function
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const options = parseArgs();

    // Handle special commands first
    if (options.listProviders) {
      const builtinProviders = await getBuiltinProviders();
      listProviders(builtinProviders);
      return;
    }

    if (options.validate) {
      await validateProviderFile(options.validate);
      return;
    }

    // Handle init/setup mode
    if (options.init) {
      await runInit();
      return;
    }

    // Merge with config file if specified
    let finalOptions = options;
    if (options.config) {
      const configOptions = await loadConfig(options.config);
      finalOptions = { ...configOptions, ...options }; // CLI options override config
    }

    // Load providers based on options
    const providers = await loadProviders(finalOptions);

    // Build rules with the loaded providers
    await buildRules({
      providers,
      inputDir: finalOptions.input,
      filePattern: finalOptions.filter,
      dryRun: finalOptions.dryRun,
      verbose: finalOptions.verbose,
      quiet: finalOptions.quiet,
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  }
}

// Run directly when executed (either directly or as a CLI tool)
const isMainModule =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].includes("rules-translator"));

if (isMainModule) {
  main();
}
