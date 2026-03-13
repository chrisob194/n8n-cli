# n8n CLI

Command Line Interface for the [n8n](https://n8n.io) Public API. Designed for use by both humans and AI agents.

Built with [Bun](https://bun.sh) — zero external dependencies, compiles to a single executable.

## Installation

### From npm (recommended)

```bash
# With Bun
bun install -g @chrisob/n8n-cli

# With npm
npm install -g @chrisob/n8n-cli

# Run without installing
bunx @chrisob/n8n-cli --help
```

### From source

```bash
git clone <repo-url>
cd n8n-cli
bun build ./src/cli.ts --compile --outfile n8n
```

### Cross-platform builds

```bash
bun build ./src/cli.ts --compile --target=bun-linux-x64 --outfile n8n-linux
bun build ./src/cli.ts --compile --target=bun-darwin-arm64 --outfile n8n-mac
bun build ./src/cli.ts --compile --target=bun-windows-x64 --outfile n8n.exe
```

## Configuration

### Quick setup

```bash
# Point to your n8n instance
n8n config set base_url https://your-n8n-instance.com

# Set your API key (environment variable — not stored in config for security)
export N8N_API_KEY=your-api-key

# Verify
n8n workflow list
```

### Config file

Configuration is stored in `~/.config/n8n-cli/config.json` (XDG Base Directory Specification).

```bash
n8n config set base_url https://n8n.example.com   # Save setting
n8n config get base_url                             # Read setting
n8n config list                                     # Show all settings
```

### Environment variables

| Variable       | Required | Default                 | Description                |
|----------------|----------|-------------------------|----------------------------|
| `N8N_API_KEY`  | Yes      | —                       | API key for authentication |
| `N8N_BASE_URL` | No       | `http://localhost:5678`  | Base URL of n8n instance   |

### Precedence order

1. CLI flags (`--base-url`, `--api-key`)
2. Environment variables (`N8N_BASE_URL`, `N8N_API_KEY`)
3. Config file (`~/.config/n8n-cli/config.json`)
4. Defaults (`http://localhost:5678`)

## Quick start

```bash
# List all workflows
n8n workflow list

# Get a specific workflow
n8n workflow get abc123

# List recent executions
n8n execution list --limit 10

# Get JSON output (for scripts and agents)
n8n workflow list --json

# Create a workflow from file
n8n workflow create my-workflow.json

# Manage tags
n8n tag list
n8n tag create production
```

## Commands

| Command          | Description              |
|------------------|--------------------------|
| `config`         | Manage CLI configuration |
| `workflow`       | Manage workflows         |
| `execution`      | Manage executions        |
| `credential`     | Manage credentials       |
| `tag`            | Manage tags              |
| `variable`       | Manage variables         |
| `project`        | Manage projects          |
| `user`           | Manage users             |
| `audit`          | Security audit           |
| `source-control` | Source control operations |
| `completion`     | Shell completion scripts |

For detailed command reference, see [docs/commands.md](docs/commands.md).

## Global flags

| Flag              | Description                              |
|-------------------|------------------------------------------|
| `--json`          | Output in JSON format                    |
| `--base-url <url>`| Override the n8n instance URL            |
| `--api-key <key>` | Override the API key (not stored)        |

## Output formats

### Human-readable (default)

```
id          name              active
==========  ================  ======
abc123      My Workflow       true
def456      Backup Flow       false

2 item(s)
```

### JSON mode (`--json`)

```json
{
  "success": true,
  "data": [...],
  "error": null
}
```

On error:

```json
{
  "success": false,
  "data": null,
  "error": "Error message"
}
```

## Exit codes

| Code | Meaning                                        |
|------|------------------------------------------------|
| `0`  | Success                                        |
| `1`  | Error (API error, network error, invalid args) |
| `2`  | Configuration error (missing API key)          |

## Shell completion

```bash
# Bash — add to ~/.bashrc
eval "$(n8n completion bash)"

# Zsh — add to ~/.zshrc
eval "$(n8n completion zsh)"

# Fish — add to ~/.config/fish/config.fish
n8n completion fish | source
```

Completion supports commands, subcommands, flags, and resource IDs (fetched live from the API).

## Development

```bash
# Run in development mode
bun run src/cli.ts workflow list

# Run tests
bun test tests/

# Run specific test suite
bun test tests/workflow.test.ts

# Build executable
bun build ./src/cli.ts --compile --outfile n8n

# Publish to npm
bun publish --access public
```

## Architecture

The CLI is a single-purpose tool with no external dependencies:

```
src/
├── cli.ts              # Entry point, arg parsing, command routing
├── types.ts            # TypeScript type definitions
├── http.ts             # HTTP client with auth, timeout, config loading
├── output.ts           # JSON/table output formatting
├── help.ts             # Help text
├── completion.ts       # Shell completion generation
└── commands/
    ├── config.ts       # config get/set/list
    ├── workflow.ts     # workflow CRUD + activate/deactivate/tags/transfer
    ├── execution.ts    # execution CRUD + stop/stop-all/retry/tags
    ├── credential.ts   # credential CRUD + schema/transfer
    ├── tag.ts          # tag CRUD
    ├── variable.ts     # variable CRUD
    ├── project.ts      # project CRUD + user management
    ├── user.ts         # user CRUD + role management
    ├── audit.ts        # security audit generation
    └── source-control.ts  # pull from source control
```

## License

MIT
