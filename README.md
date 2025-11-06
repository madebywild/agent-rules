# Agent Rules

Translates markdown rules into AI agent-specific formats using a provider pattern. With **production-ready CLI support** for extensive customization and custom provider integration. Created and maintained by the fine folks at [wild](https://wild.as).

## Installation

### From GitHub Repository

This package is not published to NPM. Install directly from the GitHub repository:

```bash
# Using HTTPS
npm install git+https://github.com/madebywild/agent-rules.git#main

# For global installation
npm install -g git+https://github.com/madebywild/agent-rules.git#main
```

**📖 See [INSTALLATION.md](./INSTALLATION.md) for comprehensive installation guide including:**

- CI/CD integration examples (GitHub Actions, Docker, Jenkins)
- Troubleshooting common issues

### Quick Setup

1. **Install:** Run the installation command above
2. **Verify:** `npx agent-rules --version`

### Local Development

```bash
# Clone and install for local development
git clone https://github.com/madebywild/agent-rules.git
npm install
```

## Quick Start

```bash
# After installation, use as CLI tool
npx agent-rules --help
npx agent-rules --list-providers
npx agent-rules --dry-run --verbose

# Initialize in a new project (interactive)
npx agent-rules --init

# For local development
npm run translate_rules
```

## CLI Usage

The enhanced CLI provides production-ready functionality with custom provider support:

```bash
# Use built-in providers only
npx agent-rules

# Add custom provider
npx agent-rules --provider ./my-provider.js

# Mix custom and built-in providers
npx agent-rules --provider ./my-provider.js --providers cursor,cline

# Advanced usage
npx agent-rules \
  --provider ./my-provider.js \
  --input ./custom-rules \
  --filter "*.md" \
  --dry-run \
  --verbose

# Interactive initialization
npx agent-rules --init
```

**📖 See [CLI_GUIDE.md](./CLI_GUIDE.md) for comprehensive CLI documentation and examples.**

### Use in package.json scripts

Add `agent-rules` to your `package.json` scripts for easy, repeatable runs:

```json
{
  "scripts": {
    "rules": "agent-rules",
    "rules:dry": "agent-rules --dry-run --verbose",
    "rules:cursor": "agent-rules --providers cursor",
    "rules:custom": "agent-rules --provider ./tools/my-provider.js --no-builtin",
    "rules:ci": "agent-rules --quiet"
  }
}
```

Then run with:

```bash
npm run rules          # generate all built-in outputs
npm run rules:dry      # preview without writing files
npm run rules:cursor   # only the Cursor provider
npm run rules:custom   # only your custom provider
```

Notes:

- If installed as a dependency (via the Installation section), `agent-rules` is available to scripts from `node_modules/.bin`.
- Adjust `--input`, `--filter`, or `--config` to match your project (defaults: `--input agent-rules`, `--filter "*.md"`).

## Default Output

This processes all `.md` files in `agent-rules/` and generates:

- `.cursor/rules/*.mdc` (Cursor AI rules)
- `.clinerules/*.md` (Cline rules)
- `CLAUDE.md` (Combined reference)
- `.github/copilot-instructions.md` (GitHub Copilot repository instructions)
- `AGENTS.md` (OpenAI AGENTS.md format - open standard for AI agent instructions)
- `replit.md` (Replit AI instructions)
- Custom formats via your own providers

## Adding Rules

Create markdown files in `agent-rules/` with YAML front-matter:

```markdown
---
description: Your rule description
alwaysApply: true
cursor:
  retrieval-strategy: always
---

# Your Rule Content

Rule documentation goes here...
```

## Custom Provider Development

### Basic Provider Structure (JavaScript/JSDoc)

```javascript
// my-provider.js
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Custom provider for your specific format
 * @implements {import("agent-rules/src/types.js").RuleProvider}
 */
export class MyProvider {
  /**
   * @readonly
   * @type {string}
   */
  id = "my-format";

  /**
   * @returns {Promise<void>}
   */
  async init() {
    /* setup output directory */
  }

  /**
   * @param {import("agent-rules/src/types.js").RuleFileInput} file
   * @returns {Promise<void>}
   */
  async handle({ filename, frontMatter, content }) {
    /* transform rule */
  }

  /**
   * @returns {Promise<void>}
   */
  async finish() {
    /* cleanup/finalize */
  }
}
```

### Provider Validation

```bash
# Validate your provider before using it
npx agent-rules --validate ./my-provider.js

# Test with dry run
npx agent-rules --provider ./my-provider.js --dry-run
```

### Built-in Provider Development

For permanent built-in providers, implement the `RuleProvider` interface in `src/providers/`:

```javascript
// src/providers/new-agent.js
export class NewAgentProvider {
  id = "new-agent";
  async init() {
    /* setup */
  }
  async handle({ filename, frontMatter, content }) {
    /* transform */
  }
  async finish() {
    /* finalize */
  }
}
```

Add to the built-in providers in `src/provider-loader.js`.

## Features

✅ **Production-Ready CLI**: Extensive command-line options for real-world usage  
✅ **Custom Providers**: Load your own providers via `--provider` option  
✅ **Provider Validation**: Validate custom providers before use  
✅ **Flexible Filtering**: Process specific files with glob patterns  
✅ **Configuration Files**: JSON-based configuration for complex setups  
✅ **Type Safety**: Full JSDoc type annotations for IDE support  
✅ **Zero Compilation**: Pure JavaScript, runs directly with Node.js

## Structure

```
agent-rules/           # Source of truth (edit these)
├── frontend_style.md
├── meta-rule-authoring.md
└── prototype-structure.md

src/
├── providers/         # Built-in AI agent translators
├── types.js          # Provider interface definitions
├── cli.js            # CLI argument parsing
├── provider-loader.js # Dynamic provider loading
└── index.js          # Main orchestrator

# Generated outputs (don't edit directly)
.cursor/rules/        # Cursor AI format
.clinerules/          # Cline format
CLAUDE.md             # Combined format
.github/copilot-instructions.md  # GitHub Copilot format
AGENTS.md             # OpenAI format
replit.md             # Replit format
```

## Documentation

- **[INSTALLATION.md](./INSTALLATION.md)** - Comprehensive installation guide
- **[CLI_GUIDE.md](./CLI_GUIDE.md)** - Comprehensive CLI usage guide
- **[JSDOC_GUIDE.md](./JSDOC_GUIDE.md)** - JSDoc patterns and maintenance guide

## Disclaimer

**Important:** Wild (the company behind this project) is not liable for any outputs generated by AI agents using this tool. Users are solely responsible for managing, reviewing, and owning all prompts, rules, and generated content. By using this software, you acknowledge that:

- You are responsible for the content and behavior defined in your agent rules
- You must review and validate all AI-generated outputs before use
- The tool is provided "as is" without warranties of any kind
- Wild assumes no liability for any damages or issues arising from the use of this software

Please use responsibly and ensure all generated content complies with applicable laws, regulations, and your organization's policies.
