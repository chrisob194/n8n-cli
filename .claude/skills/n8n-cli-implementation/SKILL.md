---
name: n8n-cli-implementation
description: Implementa il CLI completo per interagire con n8n Public API
license: MIT
compatibility: opencode
metadata:
  audience: developers
  project: n8n-cli
---
## Contesto
Il progetto n8n-cli è un CLI per interagire con n8n Public API v1.1.1. Il codice sorgente non esiste ancora, solo la documentazione in AGENTS.md e la specifica OpenAPI in api-1.json.

## Tech Stack
- Runtime: Bun
- Build: `bun build --compile` (single-file executable)
- Dependencies: None (uses native Bun APIs)

## Piano di Implementazione

### Fase 1: Fondamenta
1. **Config** - Lettura variabili env (N8N_API_KEY, N8N_BASE_URL), config file (~/.config/n8n-cli/config.json), CLI flags
2. **HTTP Client** - Wrapper fetch con auth header, gestione errori, timeout
3. **Output Formatter** - JSON mode per agenti, output tabellare per umani

### Fase 2: Comandi Config
- `config get <key>` - Legge valore configurazione
- `config set <key> <value>` - Salva valore su file config
- `config list` - Mostra tutta la configurazione

### Fase 3: Comandi Workflow
- `workflow list [--active] [--tags <tags>] [--name <name>] [--project-id <id>] [--limit <n>]`
- `workflow get <id> [--exclude-pinned-data]`
- `workflow create <file.json>` (file path o inline JSON)
- `workflow update <id> <file.json>`
- `workflow delete <id>`
- `workflow activate <id> [--version-id <vid>]`
- `workflow deactivate <id>`
- `workflow tags <id>` - Get tags
- `workflow tags <id> --set <tagIds>` - Set tags

### Fase 4: Comandi Execution
- `execution list [--status <status>] [--workflow-id <id>] [--project-id <id>] [--include-data] [--limit <n>]`
- `execution get <id> [--include-data]`
- `execution delete <id>`
- `execution stop <id>`
- `execution retry <id> [--load-workflow]`

### Fase 5: Comandi Credential
- `credential list [--limit <n>]`
- `credential get <id>`
- `credential schema <typeName>`
- `credential create <file.json>`
- `credential update <id> <file.json>`
- `credential delete <id>`
- `credential transfer <id> --destination <projectId>`

### Fase 6: Error Handling
- Exit 0: Success
- Exit 1: API/Network/Args error
- Exit 2: Config error (missing API key)

## Ordine di Implementazione Consigliato
1. Prima le fondamenta (config, http, output)
2. Poi config commands
3. Poi workflow commands (più comuni)
4. Poi execution commands
5. Infine credential commands (dati sensibili)

## Riferimenti
- AGENTS.md - Documentazione completa del progetto
- api-1.json - Specifica OpenAPI n8n v1.1.1
