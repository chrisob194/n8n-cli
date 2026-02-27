# n8n CLI

> ⚠️ **Work in Progress** - This project is under active development.

Command Line Interface for n8n. Designed for use by both humans and AI agents.

## Installation

```bash
# Build the executable
bun build ./src/cli.ts --compile --outfile n8n

# Configure your n8n instance
./n8n config set baseUrl https://your-n8n-instance.com
./n8n config set apiKey your-api-key

# Verify installation
./n8n --help
```

## Configuration

Configuration is saved to `~/.config/n8n-cli/config.json` (XDG Base Directory Specification).

```bash
# View configuration
n8n config get baseUrl
n8n config get apiKey
n8n config list

# Update configuration
n8n config set baseUrl https://your-n8n-instance.com
n8n config set apiKey your-api-key
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
```

## Documentation

For detailed documentation, see [AGENTS.md](./AGENTS.md).

## License

MIT
