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
   * @readonly
   * @type {string}
   */
  id = "cursor";

  /**
   * @private
   * @type {string}
   */
  #outDir = path.resolve(".cursor/rules");

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
    const outFile = path.join(
      this.#outDir,
      filename.replace(/\.md$/, ".mdc"),
    );

    // provider-specific overrides live under `cursor:` in the YAML
    const yaml = { ...frontMatter, ...(frontMatter.cursor ?? {}) };

    await fs.writeFile(
      outFile,
      matter.stringify(content + "\n", {
        description: yaml.description ?? path.parse(filename).name,
        globs: yaml.globs ?? [],
        alwaysApply: yaml.alwaysApply ?? false,
        ...yaml, // preserve any other fields
      }),
      "utf8",
    );
  }

  /**
   * Optional final step (no additional processing needed for Cursor)
   * @returns {Promise<void>}
   */
  async finish() {
    /* nothing extra to do */
  }
}