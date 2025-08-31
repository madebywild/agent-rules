/**
 * @typedef {Object} RuleFileInput
 * @property {string} filename - e.g. "git.md"
 * @property {Record<string, any>} frontMatter - raw YAML front-matter
 * @property {string} content - body without front-matter
 */

/**
 * Interface for rule providers that convert markdown rules into agent-specific formats
 * @typedef {Object} RuleProvider
 * @property {string} id - short id used on the CLI
 * @property {() => Promise<void>} init - prepare output dir, clear old artefacts, …
 * @property {(file: RuleFileInput) => Promise<void>} handle - convert one rule file
 * @property {() => Promise<void>} finish - optional final step (concatenate, zip, …)
 */

export {};
