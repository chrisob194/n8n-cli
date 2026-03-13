import { fetchIds } from "./http.ts";
import type { Config } from "./types.ts";

const COMMAND_FLAGS: Record<string, Record<string, string[]>> = {
  workflow: {
    list: ["--active", "--tags", "--name", "--project-id", "--limit", "--json"],
    get: ["--exclude-pinned-data", "--version", "--json"],
    create: ["--json"],
    update: ["--json"],
    delete: ["--json"],
    activate: ["--version-id", "--json"],
    deactivate: ["--json"],
    tags: ["--set", "--json"],
    transfer: ["--destination", "--json"],
  },
  execution: {
    list: ["--status", "--workflow-id", "--project-id", "--include-data", "--limit", "--json"],
    get: ["--exclude-data", "--json"],
    delete: ["--json"],
    stop: ["--json"],
    "stop-all": ["--status", "--workflow-id", "--json"],
    retry: ["--load-workflow", "--json"],
    tags: ["--set", "--json"],
  },
  credential: {
    list: ["--limit", "--json"],
    get: ["--json"],
    schema: ["--json"],
    create: ["--json"],
    update: ["--json"],
    delete: ["--json"],
    transfer: ["--destination", "--json"],
  },
  tag: {
    list: ["--limit", "--json"],
    get: ["--json"],
    create: ["--json"],
    update: ["--json"],
    delete: ["--json"],
  },
  variable: {
    list: ["--limit", "--json"],
    create: ["--json"],
    update: ["--json"],
    delete: ["--json"],
  },
  project: {
    list: ["--limit", "--json"],
    create: ["--json"],
    update: ["--json"],
    delete: ["--json"],
    users: ["--limit", "--json"],
    "user-add": ["--user-id", "--role", "--json"],
    "user-update": ["--role", "--json"],
    "user-remove": ["--json"],
  },
  user: {
    list: ["--limit", "--include-role", "--json"],
    get: ["--json"],
    create: ["--role", "--json"],
    delete: ["--json"],
    "set-role": ["--role", "--json"],
  },
  audit: {
    generate: ["--days-abandoned", "--categories", "--json"],
  },
  "source-control": {
    pull: ["--json"],
  },
  config: {
    get: [],
    set: [],
    list: [],
  },
  completion: {
    bash: [],
    zsh: [],
    fish: [],
  },
};

const ID_ENDPOINTS: Record<string, Record<string, string>> = {
  workflow: {
    get: "/workflows",
    update: "/workflows",
    delete: "/workflows",
    activate: "/workflows",
    deactivate: "/workflows",
    tags: "/workflows",
    transfer: "/workflows",
  },
  execution: {
    get: "/executions",
    delete: "/executions",
    stop: "/executions",
    retry: "/executions",
    tags: "/executions",
  },
  credential: {
    get: "/credentials",
    update: "/credentials",
    delete: "/credentials",
    transfer: "/credentials",
  },
  tag: { get: "/tags", update: "/tags", delete: "/tags" },
  variable: { update: "/variables", delete: "/variables" },
  project: {
    update: "/projects",
    delete: "/projects",
    users: "/projects",
    "user-add": "/projects",
    "user-update": "/projects",
    "user-remove": "/projects",
  },
  user: { get: "/users", delete: "/users", "set-role": "/users" },
};

export async function getCompletions(args: string[], cword: number, config: Config): Promise<string[]> {
  const category = args[0];
  const action = args[1];

  if (cword === 0) {
    return Object.keys(COMMAND_FLAGS);
  }

  if (cword === 1) {
    return Object.keys(COMMAND_FLAGS[category] ?? {});
  }

  if (cword === 2) {
    const endpoint = ID_ENDPOINTS[category]?.[action];
    if (endpoint) return fetchIds(endpoint, config);
    return COMMAND_FLAGS[category]?.[action] ?? [];
  }

  return COMMAND_FLAGS[category]?.[action] ?? [];
}

export function showCompletion(shell: string): void {
  if (shell === "bash") {
    console.log(`_n8n_complete() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local prev_words=("\${COMP_WORDS[@]:1:\$((COMP_CWORD-1))}")
  local completions
  completions=$(N8N_COMPLETE=bash N8N_COMP_CWORD=$((COMP_CWORD-1)) n8n "\${prev_words[@]}" 2>/dev/null)
  COMPREPLY=($(compgen -W "$completions" -- "$cur"))
  return 0
}
complete -F _n8n_complete n8n`);
  } else if (shell === "zsh") {
    console.log(`#compdef n8n
_n8n() {
  local completions
  completions=(\$(N8N_COMPLETE=zsh N8N_COMP_CWORD=\$((CURRENT-2)) n8n "\${words[2,\$((CURRENT-1))]}" 2>/dev/null))
  compadd -a completions
}
compdef _n8n n8n`);
  } else if (shell === "fish") {
    console.log(`function __n8n_complete
  set cmd (commandline -opc)
  set -e cmd[1]
  set cword (count $cmd)
  N8N_COMPLETE=fish N8N_COMP_CWORD=$cword n8n $cmd 2>/dev/null
end
complete -c n8n -f -a "(__n8n_complete)"`);
  } else {
    throw { code: 1, message: `Unknown shell: ${shell}. Supported: bash, zsh, fish` };
  }
}
