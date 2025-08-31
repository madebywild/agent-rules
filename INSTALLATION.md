# Installation Guide

This package is not published to NPM and must be installed directly from the private GitHub repository.

## Quick Installation

```bash
# Using Personal Access Token (most common)
npm install git+https://<YOUR_PAT>@github.com/madebywild/agent-rules.git#main

# Using SSH (if SSH keys are configured)
npm install git+ssh://git@github.com/madebywild/agent-rules.git#main

# Global installation for CLI access
npm install -g git+https://<YOUR_PAT>@github.com/madebywild/agent-rules.git#main
```

## Personal Access Token Setup

### Creating a GitHub PAT

1. **Go to GitHub Settings:**
   - Navigate to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "agent-rules-access")
   - Set expiration as needed
   - **Required scope:** `repo` (for private repository access)

3. **Copy the Token:**
   - Copy the generated token immediately (you won't see it again)
   - Store it securely

### Using the PAT

Replace `<YOUR_PAT>` with your actual token:

```bash
npm install git+https://ghp_your_actual_token_here@github.com/madebywild/agent-rules.git#main
```

## Team & Production Usage

### Environment Variable Approach (Recommended)

```bash
# Set environment variable
export GITHUB_PAT="ghp_your_token_here"

# Install using the variable
npm install git+https://${GITHUB_PAT}@github.com/madebywild/agent-rules.git#main
```

### .npmrc Configuration

Create a `.npmrc` file in your project root:

```ini
# .npmrc
//github.com/:_authToken=ghp_your_token_here
```

Then install without embedding the token:

```bash
npm install git+https://github.com/madebywild/agent-rules.git#main
```

**⚠️ Security Note:** Never commit `.npmrc` with tokens to version control. Add it to `.gitignore`.

### package.json Dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "agent-rules": "git+https://github.com/madebywild/agent-rules.git#main"
  }
}
```

Then install with authentication:

```bash
# Using environment variable
GITHUB_PAT=ghp_your_token npm install

# Or with .npmrc configured
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
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npm install git+https://${GITHUB_TOKEN}@github.com/madebywild/agent-rules.git#main

      - name: Use agent-rules
        run: npx agent-rules --help
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

# Build argument for PAT
ARG GITHUB_PAT
ENV GITHUB_PAT=${GITHUB_PAT}

WORKDIR /app

# Install agent-rules
RUN npm install -g git+https://${GITHUB_PAT}@github.com/madebywild/agent-rules.git#main

# Your app setup
COPY . .
RUN npm install

CMD ["agent-rules", "--help"]
```

Build with:

```bash
docker build --build-arg GITHUB_PAT=ghp_your_token_here .
```

### Jenkins/Generic CI

```bash
#!/bin/bash
# Set PAT as secure environment variable in your CI system
export GITHUB_PAT="${RULES_TRANSLATOR_PAT}"

# Install and use
npm install git+https://${GITHUB_PAT}@github.com/madebywild/agent-rules.git#main
npx agent-rules --version
```

## SSH Alternative

If you prefer SSH and have your GitHub SSH keys configured:

```bash
# One-time SSH setup (if not done already)
ssh-keygen -t ed25519 -C "your_email@example.com"
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub: Settings → SSH and GPG keys → New SSH key

# Install using SSH
npm install git+ssh://git@github.com/madebywild/agent-rules.git#main
```

## Troubleshooting

### Common Issues

**Authentication Failed:**

```
npm ERR! fatal: Authentication failed
```

- Verify your PAT is correct and not expired
- Ensure PAT has `repo` scope for private repositories
- Check if token is properly escaped in URL

**Permission Denied (SSH):**

```
npm ERR! Permission denied (publickey)
```

- Verify SSH key is added to GitHub
- Test SSH connection: `ssh -T git@github.com`
- Ensure SSH agent is running: `ssh-add -l`

**Package Not Found:**

```
npm ERR! 404 Not Found
```

- Verify repository URL is correct
- Check if you have access to the private repository
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
npm update git+https://<YOUR_PAT>@github.com/madebywild/agent-rules.git#main

# Or uninstall and reinstall
npm uninstall agent-rules
npm install git+https://<YOUR_PAT>@github.com/madebywild/agent-rules.git#main
```

## Security Best Practices

1. **Never commit PATs to version control**
2. **Use environment variables in CI/CD**
3. **Set appropriate token expiration**
4. **Use minimal required scopes (`repo` only)**
5. **Rotate tokens regularly**
6. **Use different tokens for different environments**
7. **Monitor token usage in GitHub settings**

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
