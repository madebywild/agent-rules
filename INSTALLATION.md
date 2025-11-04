# Installation Guide

This package is not published to NPM and must be installed directly from the GitHub repository.

## Quick Installation

```bash
# Using HTTPS (recommended)
npm install git+https://github.com/madebywild/agent-rules.git#main

# Global installation for CLI access
npm install -g git+https://github.com/madebywild/agent-rules.git#main
```

## package.json Dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "agent-rules": "git+https://github.com/madebywild/agent-rules.git#main"
  }
}
```

Then install:

```bash
npm install
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Install Rules Translator
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          npm install git+https://github.com/madebywild/agent-rules.git#main

      - name: Use agent-rules
        run: npx agent-rules --help
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install agent-rules
RUN npm install -g git+https://github.com/madebywild/agent-rules.git#main

# Your app setup
COPY . .
RUN npm install

CMD ["agent-rules", "--help"]
```

Build with:

```bash
docker build .
```

### Jenkins/Generic CI

```bash
#!/bin/bash
# Install and use
npm install git+https://github.com/madebywild/agent-rules.git#main
npx agent-rules --version
```

## Troubleshooting

### Common Issues

**Package Not Found:**

```
npm ERR! 404 Not Found
```

- Verify repository URL is correct
- Ensure you're using the correct branch name

### Verification Commands

```bash
# Verify installation
npx agent-rules --version

# Check globally installed location
npm list -g agent-rules

# Test basic functionality
npx agent-rules --help
npx agent-rules --list-providers
```

### Updating

```bash
# Update to latest version
npm update git+https://github.com/madebywild/agent-rules.git#main

# Or uninstall and reinstall
npm uninstall agent-rules
npm install git+https://github.com/madebywild/agent-rules.git#main
```

## Local Development

For development work on the package itself:

```bash
# Clone repository
git clone git@github.com:madebywild/agent-rules.git

# Install dependencies
npm install

# Link for local testing
npm link

# Use globally
agent-rules --help
```
