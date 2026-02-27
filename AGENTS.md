# n8n CLI

CLI for interacting with n8n Public API. Designed for use by both humans and AI agents.

## Tech Stack

- **Runtime**: Bun
- **Build**: `bun build --compile` (single-file executable)
- **Dependencies**: None (uses native Bun APIs)

## Configuration

The CLI follows standard Unix CLI patterns: user configuration is saved locally, with environment variables as fallback.

### User Configuration

Configuration is saved to `~/.config/n8n-cli/config.json` (XDG Base Directory Specification).

```bash
# Read a configuration value
n8n config get base_url

# Set a configuration value
n8n config set base_url https://your-n8n-instance.com

# List all configuration
n8n config list
```

The configuration file contains only non-sensitive settings (e.g., `base_url`). API keys are NOT stored for security.

### Environment Variables (Fallback)

Environment variables are supported as fallback for backward compatibility and CI/CD:

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

### Installation

```bash
# Build the executable
bun build ./src/cli.ts --compile --outfile n8n

# Installazione globale con Bun
bun install -g ./n8n

# Usage (se ~/.bun/bin è nel PATH)
n8n --help

# Oppure usa bunx senza installazione
bunx ./n8n --help
```

## Code Structure

The code is contained in a single file: `src/cli.ts`

### Main Sections

1. **Config** (lines 1-50) - Env var reading, validation
2. **HTTP Client** (lines 51-100) - Fetch wrapper with auth headers
3. **Output** (lines 101-150) - JSON/table formatter
4. **Commands** (lines 151-400) - CLI command handling
5. **Main** (lines 401+) - Entry point, routing

### Patterns Used

- **Args parsing**: `process.argv` + array slicing
- **HTTP**: Native `fetch` with `async/await`
- **Error handling**: try/catch with exit codes
- **Output**: JSON mode for agents, human-readable for humans

## Commands

### Config

```bash
# Read a configuration value
n8n config get <key>

# Set a configuration value
n8n config set <key> <value>

# List all configuration (excludes sensitive values)
n8n config list
```

### Workflow

```bash
# List workflows
n8n workflow list [--active] [--tags <tags>] [--name <name>] [--project-id <id>] [--limit <n>] [--json]

# Get specific workflow
n8n workflow get <id> [--exclude-pinned-data] [--json]

# Create workflow (from JSON file)
n8n workflow create <file.json> [--json]

# Update workflow
n8n workflow update <id> <file.json> [--json]

# Delete workflow
n8n workflow delete <id> [--json]

# Activate/Publish workflow
n8n workflow activate <id> [--version-id <vid>] [--json]

# Deactivate workflow
n8n workflow deactivate <id> [--json]

# Tag workflow
n8n workflow tags <id> [--json]
n8n workflow tags <id> --set <tagIds> [--json]
```

### Execution

```bash
# List executions
n8n execution list [--status <status>] [--workflow-id <id>] [--project-id <id>] [--include-data] [--limit <n>] [--json]

# Get execution
n8n execution get <id> [--include-data] [--json]

# Delete execution
n8n execution delete <id> [--json]

# Stop execution
n8n execution stop <id> [--json]

# Retry execution
n8n execution retry <id> [--load-workflow] [--json]
```

### Credential

```bash
# List credentials
n8n credential list [--limit <n>] [--json]

# Get credential
n8n credential get <id> [--json]

# Get credential type schema
n8n credential schema <typeName> [--json]

# Create credential
n8n credential create <file.json> [--json]

# Update credential
n8n credential update <id> <file.json> [--json]

# Delete credential
n8n credential delete <id> [--json]

# Transfer credential
n8n credential transfer <id> --destination <projectId> [--json]
```

## Input/Output Format

### JSON Input

Commands requiring JSON (create, update) accept:
- File path: `n8n workflow create ./workflow.json`
- Inline JSON: `n8n workflow create '{"name":"Test",...}'`

### JSON Output

Use the `--json` flag for structured JSON output (useful for agents):

```bash
n8n workflow list --json
# {"success":true,"data":[...],"error":null}
```

Without `--json`, output is human-readable (tables for lists, formatted for single items).

## Exit Codes

- `0` - Success
- `1` - Error (API error, network error, invalid args)
- `2` - Configuration error (missing API key)

## Development

```bash
# Run in development
bun run src/cli.ts workflow list

# Build executable
bun build ./src/cli.ts --compile --outfile n8n

# Build for other OSes
bun build ./src/cli.ts --compile --target=bun-linux-x64 --outfile n8n-linux
bun build ./src/cli.ts --compile --target=bun-windows-x64 --outfile n8n.exe
bun build ./src/cli.ts --compile --target=bun-darwin-arm64 --outfile n8n-mac

# Pubblicare su npm registry
bun publish --access public
```

## Notes for Agents

1. **Authentication**: Always verify `N8N_API_KEY` before calling commands
2. **Rate limiting**: n8n API may rate limit multiple requests
3. **Reference IDs**: Workflow/Execution IDs are strings, not numbers
4. **Workflow versions**: Workflows have versions, use `--version-id` to activate specific version
5. **Sensitive data**: Credentials contain secrets, do not fully log output

## API Reference

See `api-1.json` for the complete OpenAPI specification of n8n Public API v1.1.1.
