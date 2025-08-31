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

/**
 * Parse a comma-separated string of provider IDs
 * @param {string} providerList - Comma-separated list of provider IDs
 * @returns {string[]} Array of trimmed provider IDs
 */
function parseProviderList(providerList) {
  if (!providerList || typeof providerList !== "string") {
    return [];
  }
  return providerList.split(",").map(id => id.trim()).filter(id => id.length > 0);
}

/**
 * Filter providers based on rule metadata for include/exclude directives
 * @param {import("./types.js").RuleProvider[]} providers - Array of all providers
 * @param {Record<string, any>} frontMatter - Rule front matter with potential filtering directives
 * @returns {import("./types.js").RuleProvider[]} Filtered array of providers
 */
export function filterProvidersForRule(providers, frontMatter) {
  const includeOnly = parseProviderList(frontMatter._includeOnlyForProviders);
  const exclude = parseProviderList(frontMatter._excludeForProviders);

  // If includeOnly is specified, only use those providers
  if (includeOnly.length > 0) {
    return providers.filter(provider => includeOnly.includes(provider.id));
  }

  // Otherwise, use all providers except those in the exclude list
  if (exclude.length > 0) {
    return providers.filter(provider => !exclude.includes(provider.id));
  }

  // If neither is specified, use all providers
  return providers;
}

/**
 * Clean rule front matter by removing processing directives that should not be in output
 * @param {Record<string, any>} frontMatter - Original front matter
 * @returns {Record<string, any>} Cleaned front matter without processing directives
 */
export function cleanFrontMatter(frontMatter) {
  const cleaned = { ...frontMatter };
  delete cleaned._includeOnlyForProviders;
  delete cleaned._excludeForProviders;
  return cleaned;
}
