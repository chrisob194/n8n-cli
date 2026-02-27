# n8n CLI

> ⚠️ **Work in Progress** - This project is under active development.

Command Line Interface for n8n. Designed for use by both humans and AI agents.

## Installation

### Quick Install (recommended)

```bash
# With Bun
bun install -g @chrisob/n8n-cli

# Or with npm
npm install -g @chrisob/n8n-cli

# Verify
n8n --help

# Or run without installing
bunx @chrisob/n8n-cli --help
```

### From Source

```bash
# Build the executable
bun build ./src/cli.ts --compile --outfile n8n

# Install globally
bun install -g ./n8n
```

## Configuration

Configuration is saved to `~/.config/n8n-cli/config.json` (XDG Base Directory Specification).

```bash
# View configuration
n8n config get base_url
n8n config get api_key
n8n config list

# Update configuration
n8n config set base_url https://your-n8n-instance.com
n8n config set api_key your-api-key
```

## Quick Start

```bash
# List workflows
n8n workflow list

# Get a specific workflow
n8n workflow get <id>

# List executions
n8n execution list

# List credentials
n8n credential list
```

## Development

```bash
# Run in development
bun run src/cli.ts workflow list

# Build executable
bun build ./src/cli.ts --compile --outfile n8n

# Publish to npm registry
bun publish --access public
```

## Documentation

For detailed documentation, see [AGENTS.md](./AGENTS.md).

## License

MIT
