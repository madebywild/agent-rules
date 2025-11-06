// src/providers/cursor.js
import path from "node:path";
import fs from "node:fs/promises";
import matter from "gray-matter";
import { clearDir, ensureDir } from "../utils.js";

/**
 * Provider for Cursor AI rules format
 * @implements {import("../types.js").RuleProvider}
 */
export class CursorProvider {
  /**
   * @param {string | undefined} baseOutputDir - Optional base directory to contain provider outputs
   */
  constructor(baseOutputDir) {
    this.#outDir = path.resolve(baseOutputDir ?? ".", ".cursor/rules");
  }
  /**
   * @readonly
   * @type {string}
   */
  id = "cursor";

  /**
   * @private
   * @type {string}
   */
  #outDir;

  /**
   * Prepare output directory, clear old artifacts
   * @returns {Promise<void>}
   */
  async init() {
    await clearDir(this.#outDir);
    await ensureDir(this.#outDir);
  }

  /**
   * Convert one rule file to Cursor format
   * @param {import("../types.js").RuleFileInput} file - Input file data
   * @returns {Promise<void>}
   */
  async handle({ filename, frontMatter, content }) {
    const outFile = path.join(this.#outDir, filename.replace(/\.md$/, ".mdc"));

    // provider-specific overrides live under `cursor:` in the YAML
    const yaml = { ...frontMatter, ...(frontMatter.cursor ?? {}) };

    // If alwaysApply is true and retrieval-strategy is not explicitly set,
    // inherit retrieval-strategy: always
    const retrievalStrategy = yaml["retrieval-strategy"] ?? (yaml.alwaysApply ? "always" : undefined);

    // Build the output frontmatter, ensuring retrieval-strategy is set last
    const outputFrontMatter = {
      description: yaml.description ?? path.parse(filename).name,
      globs: yaml.globs ?? [],
      alwaysApply: yaml.alwaysApply ?? false,
      ...yaml, // preserve any other fields
    };

    // Apply retrieval-strategy after spreading yaml to ensure it takes precedence
    if (retrievalStrategy !== undefined) {
      outputFrontMatter["retrieval-strategy"] = retrievalStrategy;
    }

    await fs.writeFile(outFile, matter.stringify(content + "\n", outputFrontMatter), "utf8");
  }

  /**
   * Optional final step (no additional processing needed for Cursor)
   * @returns {Promise<void>}
   */
  async finish() {
    /* nothing extra to do */
  }
}
