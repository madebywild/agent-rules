// src/providers/claude.js
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Provider for Claude AI rules format - combines all rules into single file
 * @implements {import("../types.js").RuleProvider}
 */
export class ClaudeProvider {
  /**
   * @readonly
   * @type {string}
   */
  id = "claude";

  /**
   * @private
   * @type {string}
   */
  #outFile = path.resolve("CLAUDE.md");

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
   * Convert one rule file to Claude format and add to buffer
   * @param {import("../types.js").RuleFileInput} file - Input file data (only uses frontMatter and content)
   * @returns {Promise<void>}
   */
  async handle({ frontMatter, content }) {
    const yaml = { ...frontMatter, ...(frontMatter.claude ?? {}) };
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
