#!/usr/bin/env bun

import { loadConfig } from "./http.ts";
import { printError } from "./output.ts";
import { getCompletions, showCompletion } from "./completion.ts";
import { showHelp } from "./help.ts";
import { handleConfigCommand } from "./commands/config.ts";
import { handleWorkflowCommand } from "./commands/workflow.ts";
import { handleExecutionCommand } from "./commands/execution.ts";
import { handleCredentialCommand } from "./commands/credential.ts";
import { handleTagCommand } from "./commands/tag.ts";
import { handleVariableCommand } from "./commands/variable.ts";
import { handleProjectCommand } from "./commands/project.ts";
import { handleUserCommand } from "./commands/user.ts";
import { handleAuditCommand } from "./commands/audit.ts";
import { handleSourceControlCommand } from "./commands/source-control.ts";

const rawArgs = process.argv.slice(2);

// Parse global flags and build clean args (without global flags)
let jsonMode = false;
let baseUrlOverride: string | undefined;
let apiKeyOverride: string | undefined;
const cleanArgs: string[] = [];

for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--json") {
    jsonMode = true;
  } else if (rawArgs[i] === "--base-url" && rawArgs[i + 1]) {
    baseUrlOverride = rawArgs[++i];
  } else if (rawArgs[i] === "--api-key" && rawArgs[i + 1]) {
    apiKeyOverride = rawArgs[++i];
  } else {
    cleanArgs.push(rawArgs[i]);
  }
}

async function main(): Promise<void> {
  try {
    const config = await loadConfig({
      baseUrl: baseUrlOverride,
      apiKey: apiKeyOverride,
      jsonMode,
    });

    // Completion mode
    if (process.env.N8N_COMPLETE) {
      const cword = parseInt(process.env.N8N_COMP_CWORD || "0");
      const completions = await getCompletions(cleanArgs, cword, config);
      console.log(completions.join("\n"));
      return;
    }

    if (cleanArgs.length === 0 || cleanArgs[0] === "help" || cleanArgs[0] === "--help" || cleanArgs[0] === "-h") {
      showHelp();
      return;
    }

    const category = cleanArgs[0];
    const subArgs = cleanArgs.slice(1);

    switch (category) {
      case "config":
        await handleConfigCommand(subArgs, config);
        break;
      case "workflow":
        await handleWorkflowCommand(subArgs, config);
        break;
      case "execution":
        await handleExecutionCommand(subArgs, config);
        break;
      case "credential":
        await handleCredentialCommand(subArgs, config);
        break;
      case "tag":
        await handleTagCommand(subArgs, config);
        break;
      case "variable":
        await handleVariableCommand(subArgs, config);
        break;
      case "project":
        await handleProjectCommand(subArgs, config);
        break;
      case "user":
        await handleUserCommand(subArgs, config);
        break;
      case "audit":
        await handleAuditCommand(subArgs, config);
        break;
      case "source-control":
        await handleSourceControlCommand(subArgs, config);
        break;
      case "completion":
        showCompletion(subArgs[0] || "bash");
        break;
      default:
        throw { code: 1, message: `Unknown command: ${category}. Run 'n8n help' for usage.` };
    }
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && "message" in e) {
      const err = e as { code: number | string; message: string };
      printError(err.message, jsonMode);
      process.exit(typeof err.code === "number" ? err.code : 1);
    }
    const err = e as Error;
    printError(err.message || String(e), jsonMode);
    process.exit(1);
  }
}

main();
