// src/providers/windsurf.js
import path from "node:path";
import fs from "node:fs/promises";
import { clearDir, ensureDir } from "../utils.js";

/**
 * Provider for Windsurf AI rules format
 * @implements {import("../types.js").RuleProvider}
 */
export class WindsurfProvider {
  /**
   * @param {string | undefined} baseOutputDir - Optional base directory to contain provider outputs
   */
  constructor(baseOutputDir) {
    this.#outDir = path.resolve(baseOutputDir ?? ".", ".windsurf/rules");
  }
  /**
   * @readonly
   * @type {string}
   */
  id = "windsurf";

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
   * Convert one rule file to Windsurf format
   * @param {import("../types.js").RuleFileInput} file - Input file data (only uses filename and content)
   * @returns {Promise<void>}
   */
  async handle({ filename, content }) {
    const outFile = path.join(this.#outDir, filename);
    await fs.writeFile(outFile, content.trimStart() + "\n", "utf8");
  }

  /**
   * Optional final step (no additional processing needed for Windsurf)
   * @returns {Promise<void>}
   */
  async finish() {}
}
