# CLI Usage Guide

The rules-translator now supports a comprehensive CLI interface for production-ready usage with extensive customization options.

## Installation & Setup

### Installing from Private GitHub Repository

```bash
# Install using Personal Access Token (PAT)
npm install git+https://<YOUR_PAT>@github.com/madebywild/ai-internship.git#main

# Install globally for system-wide CLI access
npm install -g git+https://<YOUR_PAT>@github.com/madebywild/ai-internship.git#main

# Using SSH (requires SSH key setup)
npm install git+ssh://git@github.com/madebywild/ai-internship.git#main
```

**📖 For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md)**

### Quick PAT Setup

```bash
# Environment variable approach (recommended)
export GITHUB_PAT="ghp_your_token_here"
npm install git+https://${GITHUB_PAT}@github.com/madebywild/ai-internship.git#main
```

### Verification

```bash
# Verify installation
npx rules-translator --version
which rules-translator  # (if installed globally)
```

## Basic Usage

```bash
# Use all built-in providers (default behavior)
npx rules-translator

# Initialize interactively in a new project
npx rules-translator --init

# Show help
npx rules-translator --help

# Show version
npx rules-translator --version

# List available built-in providers
npx rules-translator --list-providers
```

## Provider Management

### Using Built-in Providers

```bash
# Use specific built-in providers only
npx rules-translator --providers cursor,cline

# Exclude built-in providers entirely
npx rules-translator --no-builtin --provider ./my-provider.js
```

### Using Custom Providers

```bash
# Add a single custom provider
npx rules-translator --provider ./my-provider.js

# Add multiple custom providers
npx rules-translator --provider ./provider1.js --provider ./provider2.js

# Mix custom and built-in providers
npx rules-translator --provider ./my-provider.js --providers cursor,cline

# Validate a custom provider before using it
npx rules-translator --validate ./my-provider.js
```

## Input/Output Control

```bash
# Use custom input directory
npx rules-translator --input ./my-rules

# Filter files by pattern
npx rules-translator --filter "**/*.md"
npx rules-translator --filter "git*.md"

# Dry run to see what would be processed
npx rules-translator --dry-run

# Verbose output for debugging
npx rules-translator --verbose

# Minimal output
npx rules-translator --quiet

# Initialize and then run with defaults
npx rules-translator --init && npx rules-translator
```

## Advanced Configuration

```bash
# Load configuration from file
npx rules-translator --config ./config.json

# Control parallelism
npx rules-translator --parallel 2

# Combine multiple options
npx rules-translator \
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
npx rules-translator --config ./config.json
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
 * @implements {import("rules-translator/src/types.js").RuleProvider}
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
   * @param {import("rules-translator/src/types.js").RuleFileInput} file
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
npx rules-translator --validate ./my-provider.js
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
npx rules-translator --validate ./my-provider.js

# 2. Test with dry run
npx rules-translator --provider ./my-provider.js --dry-run --verbose

# 3. Run with limited scope
npx rules-translator --provider ./my-provider.js --filter "test*.md"

# 4. Full production run
npx rules-translator --provider ./my-provider.js --quiet
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

      - name: Install rules-translator
        run: |
          npm install git+https://${{ secrets.GITHUB_TOKEN }}@github.com/madebywild/ai-internship.git#main

      - name: Translate rules
        run: |
          npx rules-translator \
            --provider ./providers/production.js \
            --providers cursor,cline \
            --input ./documentation/rules \
            --quiet || exit 1
```

**Docker Example:**

```dockerfile
# Use build argument for PAT
ARG GITHUB_PAT
ENV NPM_TOKEN=${GITHUB_PAT}

RUN npm install git+https://${NPM_TOKEN}@github.com/madebywild/ai-internship.git#main
```

**Team Usage:**

```bash
# In your CI pipeline with secure token storage
npx rules-translator \
  --provider ./providers/production.js \
  --providers cursor,cline \
  --input ./documentation/rules \
  --quiet || exit 1
```

### Multi-Environment Setup

```bash
# Development
npx rules-translator --config ./config/dev.json --verbose

# Staging
npx rules-translator --config ./config/staging.json

# Production
npx rules-translator --config ./config/prod.json --quiet
```

## Error Handling

The CLI provides clear error messages for common issues:

- ❌ **Provider validation errors**: Fix your provider implementation
- ❌ **File not found errors**: Check file paths and permissions
- ❌ **ID conflicts**: Ensure unique provider IDs
- ❌ **Module loading errors**: Verify ES module syntax

Use `DEBUG=1 npx rules-translator ...` for full stack traces during development.

## Best Practices

1. **Always validate** custom providers before production use
2. **Use dry run** to test changes without side effects
3. **Start with verbose mode** when debugging issues
4. **Use configuration files** for complex setups
5. **Test incrementally** with file filters
6. **Version your providers** alongside your rules
7. **Document provider behavior** for team usage

This production-ready CLI makes the rules-translator highly flexible and suitable for complex real-world requirements while maintaining type safety and developer experience.
