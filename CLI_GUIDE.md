# CLI Usage Guide

The agent-rules now supports a comprehensive CLI interface for production-ready usage with extensive customization options.

## Installation & Setup

### Installing from GitHub Repository

```bash
# Install using HTTPS
npm install git+https://github.com/madebywild/agent-rules.git#main

# Install globally for system-wide CLI access
npm install -g git+https://github.com/madebywild/agent-rules.git#main

# Using SSH (requires SSH key setup)
npm install git+ssh://git@github.com/madebywild/agent-rules.git#main
```

**📖 For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md)**

### Verification

```bash
# Verify installation
npx agent-rules --version
which agent-rules  # (if installed globally)
```

## Basic Usage

```bash
# Use all built-in providers (default behavior)
npx agent-rules

# Initialize interactively in a new project
npx agent-rules --init

# Show help
npx agent-rules --help

# Show version
npx agent-rules --version

# List available built-in providers
npx agent-rules --list-providers
```

## Provider Management

### Using Built-in Providers

```bash
# Use specific built-in providers only
npx agent-rules --providers cursor,cline

# Exclude built-in providers entirely
npx agent-rules --no-builtin --provider ./my-provider.js
```

### Using Custom Providers

```bash
# Add a single custom provider
npx agent-rules --provider ./my-provider.js

# Add multiple custom providers
npx agent-rules --provider ./provider1.js --provider ./provider2.js

# Mix custom and built-in providers
npx agent-rules --provider ./my-provider.js --providers cursor,cline

# Validate a custom provider before using it
npx agent-rules --validate ./my-provider.js
```

## Input/Output Control

```bash
# Use custom input directory
npx agent-rules --input ./my-rules

# Filter files by pattern
npx agent-rules --filter "**/*.md"
npx agent-rules --filter "git*.md"

# Dry run to see what would be processed
npx agent-rules --dry-run

# Verbose output for debugging
npx agent-rules --verbose

# Minimal output
npx agent-rules --quiet

# Initialize and then run with defaults
npx agent-rules --init && npx agent-rules
```

## Advanced Configuration

```bash
# Load configuration from file
npx agent-rules --config ./config.json

# Control parallelism
npx agent-rules --parallel 2

# Combine multiple options
npx agent-rules \
  --provider ./my-provider.js \
  --providers cursor \
  --input ./custom-rules \
  --filter "*.md" \
  --dry-run \
  --verbose
```

## Configuration File Format

Create a `config.json` file for complex setups:

```json
{
  "provider": ["./providers/custom1.js", "./providers/custom2.js"],
  "providers": ["cursor", "cline"],
  "input": "./my-rules",
  "filter": "**/*.md",
  "verbose": true,
  "parallel": 4
}
```

Then use it with:

```bash
npx agent-rules --config ./config.json
```

CLI options override config file settings.

## Custom Provider Development

### Basic Provider Structure

```javascript
// my-provider.js
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Custom provider for my specific format
 * @implements {import("agent-rules/src/types.js").RuleProvider}
 */
export class MyProvider {
  /**
   * @readonly
   * @type {string}
   */
  id = "my-format";

  /**
   * Prepare output directory, clear old artifacts
   * @returns {Promise<void>}
   */
  async init() {
    // Setup logic here
  }

  /**
   * Convert one rule file to your format
   * @param {import("agent-rules/src/types.js").RuleFileInput} file
   * @returns {Promise<void>}
   */
  async handle({ filename, frontMatter, content }) {
    // Process each file here
  }

  /**
   * Optional final step
   * @returns {Promise<void>}
   */
  async finish() {
    // Cleanup or finalization here
  }
}
```

### Provider Requirements

1. **Export a class** that implements the `RuleProvider` interface
2. **ES Module compatible** - use ES6 imports/exports
3. **Required methods**: `init()`, `handle()`, `finish()`
4. **Unique ID**: Each provider must have a unique `id` property
5. **JSDoc types**: Use proper JSDoc annotations for type safety

### Validation

Before using a custom provider in production:

```bash
npx agent-rules --validate ./my-provider.js
```

This will check:

- ✅ File loads correctly as ES module
- ✅ Exports proper provider class
- ✅ Implements required interface
- ✅ Has all required methods
- ✅ Unique provider ID

## Real-World Examples

### Development Workflow

```bash
# 1. Validate your custom provider
npx agent-rules --validate ./my-provider.js

# 2. Test with dry run
npx agent-rules --provider ./my-provider.js --dry-run --verbose

# 3. Run with limited scope
npx agent-rules --provider ./my-provider.js --filter "test*.md"

# 4. Full production run
npx agent-rules --provider ./my-provider.js --quiet
```

### CI/CD Integration

**GitHub Actions Example:**

```yaml
# .github/workflows/rules-translation.yml
name: Translate Rules
on: [push, pull_request]

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install agent-rules
        run: |
          npm install git+https://${{ secrets.GITHUB_TOKEN }}@github.com/madebywild/agent-rules.git#main

      - name: Translate rules
        run: |
          npx agent-rules \
            --provider ./providers/production.js \
            --providers cursor,cline \
            --input ./documentation/rules \
            --quiet || exit 1
```

**Docker Example:**

```dockerfile
# Install agent-rules from GitHub
RUN npm install git+https://github.com/madebywild/agent-rules.git#main
```

**Team Usage:**

```bash
# In your CI pipeline with secure token storage
npx agent-rules \
  --provider ./providers/production.js \
  --providers cursor,cline \
  --input ./documentation/rules \
  --quiet || exit 1
```

### Multi-Environment Setup

```bash
# Development
npx agent-rules --config ./config/dev.json --verbose

# Staging
npx agent-rules --config ./config/staging.json

# Production
npx agent-rules --config ./config/prod.json --quiet
```

## Error Handling

The CLI provides clear error messages for common issues:

- ❌ **Provider validation errors**: Fix your provider implementation
- ❌ **File not found errors**: Check file paths and permissions
- ❌ **ID conflicts**: Ensure unique provider IDs
- ❌ **Module loading errors**: Verify ES module syntax

Use `DEBUG=1 npx agent-rules ...` for full stack traces during development.

## Best Practices

1. **Always validate** custom providers before production use
2. **Use dry run** to test changes without side effects
3. **Start with verbose mode** when debugging issues
4. **Use configuration files** for complex setups
5. **Test incrementally** with file filters
6. **Version your providers** alongside your rules
7. **Document provider behavior** for team usage

This production-ready CLI makes the agent-rules highly flexible and suitable for complex real-world requirements while maintaining type safety and developer experience.
