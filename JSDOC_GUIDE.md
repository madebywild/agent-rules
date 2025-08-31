# JSDoc Developer Guide for Rules Translator

This guide explains how to maintain and extend the JSDoc-based JavaScript codebase for the Rules Translator.

## Overview

The Rules Translator has been converted from TypeScript to JavaScript while preserving type safety through comprehensive JSDoc annotations. This approach provides the same IDE autocompletion and error-checking experience as TypeScript without requiring compilation.

## JSDoc Type System

### Type Definitions

Type definitions are declared using `@typedef` tags in `src/types.js`:

```javascript
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
```

### Function Documentation

All functions must be documented with JSDoc annotations:

```javascript
/**
 * Build rules by processing all markdown files in agent-rules directory
 * and converting them using all registered providers
 * @returns {Promise<void>}
 */
export async function buildRules() {
  // Implementation...
}

/**
 * Clear all contents of a directory
 * @param {string} dir - Directory path to clear
 * @returns {Promise<void>}
 */
export async function clearDir(dir) {
  // Implementation...
}
```

### Class Documentation

Classes are documented with JSDoc annotations including `@implements` for interface compliance:

```javascript
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
   * Convert one rule file to Cursor format
   * @param {import("../types.js").RuleFileInput} file - Input file data
   * @returns {Promise<void>}
   */
  async handle({ filename, frontMatter, content }) {
    // Implementation...
  }
}
```

## IDE Setup

### VSCode

VSCode automatically recognizes JSDoc annotations and provides:
- Type checking and error highlighting
- IntelliSense autocompletion
- Parameter hints
- Type information on hover

To enable strict type checking, create a `jsconfig.json` file:

```json
{
  "compilerOptions": {
    "checkJs": true,
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node"
  },
  "include": ["src/**/*"]
}
```

## Adding New Providers

To add a new AI agent provider:

1. Create a new provider file in `src/providers/`:

```javascript
// src/providers/new-agent.js
/**
 * Provider for NewAgent AI rules format
 * @implements {import("../types.js").RuleProvider}
 */
export class NewAgentProvider {
  /**
   * @readonly
   * @type {string}
   */
  id = "new-agent";

  /**
   * @private
   * @type {string}
   */
  #outDir = path.resolve(".new-agent-rules");

  /**
   * Prepare output directory, clear old artifacts
   * @returns {Promise<void>}
   */
  async init() {
    // Setup logic
  }

  /**
   * Convert one rule file to NewAgent format
   * @param {import("../types.js").RuleFileInput} file - Input file data
   * @returns {Promise<void>}
   */
  async handle({ filename, frontMatter, content }) {
    // Conversion logic
  }

  /**
   * Optional final step
   * @returns {Promise<void>}
   */
  async finish() {
    // Cleanup/finalization logic
  }
}
```

2. Import and register in `src/index.js`:

```javascript
import { NewAgentProvider } from "./providers/new-agent.js";

/**
 * @type {import("./types.js").RuleProvider[]}
 */
const providers = [
  new CursorProvider(),
  new ClineProvider(),
  new ClaudeProvider(),
  new NewAgentProvider(), // Add here
];
```

## Type Safety Best Practices

1. **Always document parameters and return types:**
   ```javascript
   /**
    * @param {string} input - Input string
    * @param {boolean} [optional] - Optional parameter
    * @returns {Promise<string>} Processed output
    */
   ```

2. **Use `@private` for internal class members:**
   ```javascript
   /**
    * @private
    * @type {string}
    */
   #internalProperty = "value";
   ```

3. **Import types from other modules:**
   ```javascript
   /**
    * @param {import("./types.js").RuleProvider} provider
    */
   ```

4. **Document complex objects inline:**
   ```javascript
   /**
    * @param {{name: string, age: number}} user - User object
    */
   ```

5. **Use union types when appropriate:**
   ```javascript
   /**
    * @param {string | number} value - String or number value
    */
   ```

## Maintenance Notes

- **No compilation required**: JavaScript files run directly with Node.js
- **Type checking**: Use VSCode or TypeScript in `--checkJs` mode for validation
- **Testing**: All existing functionality is preserved from the TypeScript version
- **NPM package**: Ready for installation as CLI tool via `npm install`

## Common Patterns

### Error Handling
```javascript
/**
 * @param {string} path - File path
 * @returns {Promise<string>} File content
 * @throws {Error} When file cannot be read
 */
async function readFile(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }
}
```

### Optional Parameters
```javascript
/**
 * @param {string} name - Required name
 * @param {Object} [options] - Optional configuration
 * @param {boolean} [options.verbose] - Enable verbose output
 */
function process(name, options = {}) {
  // Implementation
}
```

This JSDoc approach maintains all the type safety benefits of TypeScript while keeping the codebase as pure JavaScript.