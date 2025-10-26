// src/providers/replit.js
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Provider for Replit AI rules format - combines all rules into single file
 * @implements {import("../types.js").RuleProvider}
 */
export class ReplitProvider {
  /**
   * @param {string | undefined} baseOutputDir - Optional base directory to contain provider outputs
   */
  constructor(baseOutputDir) {
    this.#outFile = path.resolve(baseOutputDir ?? ".", "replit.md");
  }
  /**
   * @readonly
   * @type {string}
   */
  id = "replit";

  /**
   * @private
   * @type {string}
   */
  #outFile;

  /**
   * @private
   * @type {string}
   */
  #buffer = ""; // collect as we go

  /**
   * Prepare output file, remove any existing file
   * @returns {Promise<void>}
   */
  async init() {
    await fs.rm(this.#outFile, { force: true });
  }

  /**
   * Convert one rule file to Replit format and add to buffer
   * @param {import("../types.js").RuleFileInput} file - Input file data (only uses frontMatter and content)
   * @returns {Promise<void>}
   */
  async handle({ frontMatter, content }) {
    const yaml = { ...frontMatter, ...(frontMatter.replit ?? {}) };
    const header = `## ${yaml.title ?? yaml.description ?? "Untitled"}`;
    this.#buffer += `\n\n${header}\n\n${content.trim()}\n`;
  }

  /**
   * Final step - write combined buffer to output file
   * @returns {Promise<void>}
   */
  async finish() {
    await fs.writeFile(this.#outFile, this.#buffer.trimStart() + "\n", "utf8");
  }
}
