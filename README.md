# n8n CLI

> ⚠️ **Work in Progress** - This project is under active development.

Command Line Interface for n8n. Designed for use by both humans and AI agents.

## Installation

```bash
# Build the executable
bun build ./src/cli.ts --compile --outfile n8n

# Usage
export N8N_API_KEY="your-api-key"
export N8N_BASE_URL="https://your-n8n-instance.com"
./n8n --help
```

## Configuration

The CLI follows standard Unix CLI patterns: user configuration is stored locally, with environment variables as fallback.

### User Configuration

Configuration is saved to `~/.config/n8n-cli/config.json` (XDG Base Directory Specification).

```bash
n8n config get baseUrl
n8n config set baseUrl https://your-n8n-instance.com
n8n config list
```

The configuration file contains only non-sensitive settings (e.g., `baseUrl`). API keys are NOT stored for security.

### Environment Variables

| Variable      | Required | Default            | Description              |
|---------------|----------|--------------------|--------------------------|
| `N8N_API_KEY` | Yes      | -                  | API key for authentication |
| `N8N_BASE_URL` | No       | `http://localhost:5678` | Base URL of n8n instance |

### Precedence

Configuration is read in priority order (highest to lowest):

1. CLI flags (e.g., `--base-url`)
2. Environment variables (`N8N_BASE_URL`)
3. User configuration (`~/.config/n8n-cli/config.json`)
4. Hardcoded defaults

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
