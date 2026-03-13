export function showHelp(): void {
  console.log(`n8n-cli - CLI for n8n Public API v1.1.1

Usage: n8n <command> [options]

Commands:
  config <action>          Manage configuration
  workflow <action>        Manage workflows
  execution <action>       Manage executions
  credential <action>      Manage credentials
  tag <action>             Manage tags
  variable <action>        Manage variables
  project <action>         Manage projects
  user <action>            Manage users
  audit generate           Generate security audit
  source-control pull      Pull from source control
  completion <shell>       Generate shell completion script

Global Options:
  --json              Output JSON format
  --base-url <url>    Override base URL
  --api-key <key>     Override API key (not stored)

Config Commands:
  config get <key>          Get config value
  config set <key> <value>  Set config value
  config list               List all config

Workflow Commands:
  workflow list [--active] [--tags <t>] [--name <n>] [--project-id <id>] [--limit <n>]
  workflow get <id> [--exclude-pinned-data] [--version <versionId>]
  workflow create <file.json>
  workflow update <id> <file.json>
  workflow delete <id>
  workflow activate <id> [--version-id <vid>]
  workflow deactivate <id>
  workflow tags <id> [--set <tagIds>]
  workflow transfer <id> --destination <projectId>

Execution Commands:
  execution list [--status <s>] [--workflow-id <id>] [--include-data] [--limit <n>]
  execution get <id> [--exclude-data]
  execution delete <id>
  execution stop <id>
  execution stop-all [--status <s>] [--workflow-id <id>]
  execution retry <id> [--load-workflow]
  execution tags <id> [--set <tagIds>]

Tag Commands:
  tag list [--limit <n>]
  tag get <id>
  tag create <name>
  tag update <id> <name>
  tag delete <id>

Variable Commands:
  variable list [--limit <n>]
  variable create <key> <value>
  variable update <id> <key> <value>
  variable delete <id>

Project Commands:
  project list [--limit <n>]
  project create <name>
  project update <id> <name>
  project delete <id>
  project users <id> [--limit <n>]
  project user-add <id> --user-id <uid> --role <role>
  project user-update <id> <userId> --role <role>
  project user-remove <id> <userId>

User Commands:
  user list [--limit <n>] [--include-role]
  user get <id>
  user create <email> [--role <role>]
  user delete <id>
  user set-role <id> --role <role>

Credential Commands:
  credential list [--limit <n>]
  credential get <id>
  credential schema <typeName>
  credential create <file.json>
  credential update <id> <file.json>
  credential delete <id>
  credential transfer <id> --destination <projectId>

Shell Completion:
  eval "$(n8n completion bash)"   # Add to ~/.bashrc
  eval "$(n8n completion zsh)"    # Add to ~/.zshrc
  n8n completion fish | source    # Add to ~/.config/fish/config.fish

Examples:
  n8n config set base_url https://n8n.example.com
  n8n workflow list --active
  n8n tag create my-tag --json
  n8n execution get <id> --json

For more info: https://docs.n8n.io/api/`);
}
