# Command Reference

Complete reference for all n8n CLI commands.

## config

Manage CLI configuration. Settings are stored in `~/.config/n8n-cli/config.json`.

```bash
n8n config get <key>            # Read a config value
n8n config set <key> <value>    # Write a config value
n8n config list                 # Show all config with defaults
```

**Supported keys:** `base_url`

> **Note:** API keys cannot be stored in the config file for security. Use the `N8N_API_KEY` environment variable instead.

**Examples:**

```bash
n8n config set base_url https://n8n.example.com
n8n config get base_url
# → https://n8n.example.com

n8n config list
# base_url: https://n8n.example.com (config file)
```

---

## workflow

Manage n8n workflows — list, create, update, delete, activate, and tag.

### workflow list

List workflows with optional filters.

```bash
n8n workflow list [flags]
```

| Flag                  | Description                      |
|-----------------------|----------------------------------|
| `--active`            | Show only active workflows       |
| `--tags <ids>`        | Filter by tag IDs (comma-sep)    |
| `--name <name>`       | Filter by workflow name          |
| `--project-id <id>`   | Filter by project                |
| `--limit <n>`         | Maximum number of results        |

**Examples:**

```bash
n8n workflow list
n8n workflow list --active --limit 5
n8n workflow list --tags tag1,tag2 --json
n8n workflow list --name "My Workflow"
```

### workflow get

Get a specific workflow by ID.

```bash
n8n workflow get <id> [flags]
```

| Flag                      | Description                      |
|---------------------------|----------------------------------|
| `--exclude-pinned-data`   | Exclude pinned test data         |
| `--version <versionId>`   | Get a specific workflow version  |

**Examples:**

```bash
n8n workflow get abc123
n8n workflow get abc123 --version v2 --json
```

### workflow create

Create a workflow from a JSON file or inline JSON.

```bash
n8n workflow create <file.json | json-string>
```

The input is sanitized to only include allowed fields: `name`, `nodes`, `connections`, `settings`, `staticData`. If the input is wrapped in `{ "success": true, "data": ... }` format (e.g., from a previous `--json` export), the data is automatically unwrapped.

**Examples:**

```bash
n8n workflow create ./my-workflow.json
n8n workflow create '{"name":"Test","nodes":[],"connections":{}}' --json
```

### workflow update

Update an existing workflow.

```bash
n8n workflow update <id> <file.json | json-string>
```

Same sanitization and unwrapping as `workflow create`.

**Examples:**

```bash
n8n workflow update abc123 ./updated-workflow.json
```

### workflow delete

Delete a workflow.

```bash
n8n workflow delete <id>
```

### workflow activate

Activate (publish) a workflow so it can be triggered.

```bash
n8n workflow activate <id> [--version-id <vid>]
```

| Flag                  | Description                          |
|-----------------------|--------------------------------------|
| `--version-id <vid>`  | Activate a specific workflow version |

### workflow deactivate

Deactivate a workflow.

```bash
n8n workflow deactivate <id>
```

### workflow tags

Get or set tags on a workflow.

```bash
n8n workflow tags <id>                    # List tags
n8n workflow tags <id> --set <tagIds>     # Set tags (comma-separated)
```

**Examples:**

```bash
n8n workflow tags abc123
n8n workflow tags abc123 --set tag1,tag2,tag3
```

### workflow transfer

Transfer a workflow to a different project.

```bash
n8n workflow transfer <id> --destination <projectId>
```

---

## execution

Manage workflow executions — list, inspect, stop, retry, and delete.

### execution list

List executions with optional filters.

```bash
n8n execution list [flags]
```

| Flag                   | Description                         |
|------------------------|-------------------------------------|
| `--status <status>`    | Filter by status (e.g., `success`, `error`, `waiting`) |
| `--workflow-id <id>`   | Filter by workflow ID               |
| `--project-id <id>`    | Filter by project ID                |
| `--include-data`       | Include full execution data         |
| `--limit <n>`          | Maximum number of results           |

**Examples:**

```bash
n8n execution list --limit 20
n8n execution list --status error --workflow-id abc123
n8n execution list --include-data --json
```

### execution get

Get details of a specific execution. Includes execution data by default.

```bash
n8n execution get <id> [--exclude-data]
```

| Flag              | Description                        |
|-------------------|------------------------------------|
| `--exclude-data`  | Exclude execution data from output |

### execution delete

Delete an execution.

```bash
n8n execution delete <id>
```

### execution stop

Stop a running execution.

```bash
n8n execution stop <id>
```

### execution stop-all

Stop all executions matching the given filters.

```bash
n8n execution stop-all [--status <s>] [--workflow-id <id>]
```

| Flag                   | Description                   |
|------------------------|-------------------------------|
| `--status <status>`    | Filter by execution status    |
| `--workflow-id <id>`   | Filter by workflow ID         |

### execution retry

Retry a failed execution.

```bash
n8n execution retry <id> [--load-workflow]
```

| Flag               | Description                              |
|--------------------|------------------------------------------|
| `--load-workflow`  | Load workflow definition for the retry   |

### execution tags

Get or set tags on an execution.

```bash
n8n execution tags <id>                    # List tags
n8n execution tags <id> --set <tagIds>     # Set tags (comma-separated)
```

---

## credential

Manage n8n credentials — list, create, update, delete, and transfer.

### credential list

List all credentials.

```bash
n8n credential list [--limit <n>]
```

### credential get

Get details of a specific credential.

```bash
n8n credential get <id>
```

Displays: `id`, `name`, `type`, `data`, `nodesAccess`, `createdAt`, `updatedAt`.

### credential schema

Get the JSON schema for a credential type.

```bash
n8n credential schema <typeName>
```

**Examples:**

```bash
n8n credential schema oAuth2Api --json
n8n credential schema slackApi
```

### credential create

Create a credential from a JSON file or inline JSON.

```bash
n8n credential create <file.json | json-string>
```

### credential update

Update an existing credential.

```bash
n8n credential update <id> <file.json | json-string>
```

### credential delete

Delete a credential.

```bash
n8n credential delete <id>
```

### credential transfer

Transfer a credential to a different project.

```bash
n8n credential transfer <id> --destination <projectId>
```

---

## tag

Manage tags for organizing workflows.

```bash
n8n tag list [--limit <n>]       # List all tags
n8n tag get <id>                 # Get a specific tag
n8n tag create <name>            # Create a tag
n8n tag update <id> <name>       # Rename a tag
n8n tag delete <id>              # Delete a tag
```

**Examples:**

```bash
n8n tag list --json
n8n tag create production
n8n tag update abc123 staging
```

---

## variable

Manage environment variables in n8n.

```bash
n8n variable list [--limit <n>]           # List all variables
n8n variable create <key> <value>         # Create a variable
n8n variable update <id> <key> <value>    # Update a variable
n8n variable delete <id>                  # Delete a variable
```

**Examples:**

```bash
n8n variable list --json
n8n variable create API_ENDPOINT https://api.example.com
n8n variable update abc123 API_ENDPOINT https://new-api.example.com
```

---

## project

Manage n8n projects and their user assignments.

### project list

```bash
n8n project list [--limit <n>]
```

### project create

```bash
n8n project create <name>
```

### project update

```bash
n8n project update <id> <name>
```

### project delete

```bash
n8n project delete <id>
```

### project users

List users assigned to a project.

```bash
n8n project users <id> [--limit <n>]
```

### project user-add

Add a user to a project with a role.

```bash
n8n project user-add <projectId> --user-id <userId> --role <role>
```

### project user-update

Update a user's role in a project.

```bash
n8n project user-update <projectId> <userId> --role <role>
```

### project user-remove

Remove a user from a project.

```bash
n8n project user-remove <projectId> <userId>
```

---

## user

Manage n8n users.

### user list

```bash
n8n user list [--limit <n>] [--include-role]
```

| Flag              | Description                    |
|-------------------|--------------------------------|
| `--limit <n>`     | Maximum number of results      |
| `--include-role`  | Include user roles in output   |

### user get

```bash
n8n user get <id>
```

### user create

```bash
n8n user create <email> [--role <role>]
```

### user delete

```bash
n8n user delete <id>
```

### user set-role

```bash
n8n user set-role <id> --role <role>
```

---

## audit

Generate a security audit report for your n8n instance.

```bash
n8n audit generate [flags]
```

| Flag                        | Description                                      |
|-----------------------------|--------------------------------------------------|
| `--days-abandoned <days>`   | Days threshold for abandoned workflow detection   |
| `--categories <categories>` | Comma-separated categories to include in audit    |

**Examples:**

```bash
n8n audit generate --json
n8n audit generate --days-abandoned 30
n8n audit generate --categories credentials,nodes
```

---

## source-control

Interact with n8n source control integration.

```bash
n8n source-control pull
```

Pulls the latest changes from the configured source control provider.

---

## completion

Generate shell completion scripts for tab completion of commands, subcommands, flags, and resource IDs.

```bash
n8n completion bash    # Bash completion script
n8n completion zsh     # Zsh completion script
n8n completion fish    # Fish completion script
```

**Setup:**

```bash
# Bash — add to ~/.bashrc
eval "$(n8n completion bash)"

# Zsh — add to ~/.zshrc
eval "$(n8n completion zsh)"

# Fish — add to ~/.config/fish/config.fish
n8n completion fish | source
```

Completions are context-aware: they suggest valid commands, subcommands, and flags. For commands that take a resource ID (e.g., `workflow get`, `tag delete`), completions fetch available IDs from the n8n API in real time.
