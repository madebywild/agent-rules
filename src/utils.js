import fs from "node:fs/promises";
import path from "node:path";

/**
 * Clear all contents of a directory
 * @param {string} dir - Directory path to clear
 * @returns {Promise<void>}
 */
export async function clearDir(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(entries.map(e => fs.rm(path.join(dir, e.name), { recursive: true, force: true })));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dir - Directory path to ensure exists
 * @returns {Promise<void>}
 */
export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}
