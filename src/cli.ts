#!/usr/bin/env bun

import { file, write, $ } from "bun";

const CONFIG_FILE = `${process.env.HOME || process.env.USERPROFILE}/.config/n8n-cli/config.json`;
const DEFAULT_BASE_URL = "http://localhost:5678";
const TIMEOUT_MS = 30000;

const args = process.argv.slice(2);
let jsonMode = false;
let baseUrlOverride: string | undefined;
let apiKeyOverride: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--json") {
    jsonMode = true;
  } else if (args[i] === "--base-url" && args[i + 1]) {
    baseUrlOverride = args[i + 1];
    i++;
  } else if (args[i] === "--api-key" && args[i + 1]) {
    apiKeyOverride = args[i + 1];
    i++;
  }
}

async function getConfig(): Promise<{ baseUrl: string; apiKey: string | null }> {
  const envApiKey = process.env.N8N_API_KEY;
  const envBaseUrl = process.env.N8N_BASE_URL;
  
  let fileConfig: Record<string, string> = {};
  try {
    const content = await file(CONFIG_FILE).text();
    fileConfig = JSON.parse(content);
  } catch {
  }

  return {
    baseUrl: baseUrlOverride ?? envBaseUrl ?? fileConfig.base_url ?? DEFAULT_BASE_URL,
    apiKey: apiKeyOverride ?? envApiKey ?? null,
  };
}

async function readConfigFile(): Promise<Record<string, string>> {
  try {
    const content = await file(CONFIG_FILE).text();
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function writeConfigFile(config: Record<string, string>): Promise<void> {
  const dir = CONFIG_FILE.replace(/\/[^/]+$/, "");
  await $`mkdir -p ${dir}`.quiet();
  await write(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function request<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<T> {
  const config = await getConfig();
  
  if (!config.apiKey) {
    throw { code: 2, message: "API key not configured. Set N8N_API_KEY environment variable or run 'n8n config set api_key <value>'" };
  }

  const url = new URL(`${config.baseUrl}/api/v1${endpoint}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v) url.searchParams.append(k, v);
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        "X-N8N-API-KEY": config.apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      throw { code: 2, message: "Authentication failed. Check your API key." };
    }

    if (response.status === 404) {
      throw { code: 1, message: `Not found: ${endpoint}` };
    }

    if (response.status >= 500) {
      throw { code: 1, message: `Server error: ${response.status}` };
    }

    const text = await response.text();
    
    if (!response.ok) {
      let errMsg = `API error: ${response.status}`;
      try {
        const errJson = JSON.parse(text);
        errMsg += errJson.message ? ` - ${errJson.message}` : "";
      } catch {
        errMsg += text ? ` - ${text}` : "";
      }
      throw { code: 1, message: errMsg };
    }

    if (text === "") {
      return {} as T;
    }

    return JSON.parse(text);
  } catch (e: unknown) {
    clearTimeout(timeout);
    if (e && typeof e === "object" && "code" in e) throw e;
    const err = e as Error;
    if (err.name === "AbortError") {
      throw { code: 1, message: `Request timeout after ${TIMEOUT_MS}ms` };
    }
    throw { code: 1, message: `Network error: ${err.message}` };
  }
}

function jsonOutput(data: unknown): void {
  console.log(JSON.stringify({ success: true, data, error: null }));
}

function tableOutput(data: unknown[], columns: string[]): void {
  if (!data || data.length === 0) {
    console.log("No data");
    return;
  }

  const colWidths: Record<string, number> = {};
  columns.forEach(col => {
    colWidths[col] = col.length;
  });

  data.forEach((row: unknown) => {
    const r = row as Record<string, unknown>;
    columns.forEach(col => {
      const val = String(r[col] ?? "");
      if (val.length > colWidths[col]) colWidths[col] = Math.min(val.length, 50);
    });
  });

  const header = columns.map(col => col.padEnd(colWidths[col])).join("  ");
  console.log(header);
  console.log(columns.map(col => "=".repeat(colWidths[col])).join("  "));

  data.forEach((row: unknown) => {
    const r = row as Record<string, unknown>;
    const line = columns.map(col => {
      const val = String(r[col] ?? "");
      return val.length > colWidths[col] ? val.slice(0, colWidths[col] - 3) + "..." : val.padEnd(colWidths[col]);
    }).join("  ");
    console.log(line);
  });

  console.log(`\n${data.length} item(s)`);
}

function printItem(item: Record<string, unknown>, fields: string[]): void {
  fields.forEach(field => {
    const val = item[field];
    if (val !== undefined) {
      if (typeof val === "object") {
        console.log(`${field}:`);
        console.log(JSON.stringify(val, null, 2));
      } else {
        console.log(`${field}: ${val}`);
      }
    }
  });
}

function printError(message: string): void {
  if (jsonMode) {
    console.log(JSON.stringify({ success: false, data: null, error: message }));
  } else {
    console.error(message);
  }
}

async function parseJsonInput(input: string): Promise<unknown> {
  try {
    if (input.startsWith("{") || input.startsWith("[")) {
      return JSON.parse(input);
    }
    const content = await file(input).text();
    return JSON.parse(content);
  } catch {
    throw { code: 1, message: `Invalid JSON: ${input}` };
  }
}

async function configGet(key: string): Promise<void> {
  const config = await readConfigFile();
  const value = config[key];
  
  if (jsonMode) {
    jsonOutput(value ?? null);
  } else {
    if (value) {
      console.log(value);
    } else {
      throw { code: 1, message: `Config key '${key}' not found` };
    }
  }
}

async function configSet(key: string, value: string): Promise<void> {
  if (key === "api_key" || key === "N8N_API_KEY") {
    throw { code: 1, message: "API key should not be stored in config file. Use N8N_API_KEY environment variable." };
  }
  
  const config = await readConfigFile();
  config[key] = value;
  await writeConfigFile(config);
  
  if (jsonMode) {
    jsonOutput({ key, value });
  } else {
    console.log(`Config '${key}' set to '${value}'`);
  }
}

async function configList(): Promise<void> {
  const config = await readConfigFile();
  const configWithDefaults = {
    ...config,
    base_url: config.base_url ?? DEFAULT_BASE_URL,
  };
  
  if (jsonMode) {
    jsonOutput(configWithDefaults);
  } else {
    console.log("Configuration:");
    Object.entries(configWithDefaults).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });
  }
}

async function workflowList(args: string[]): Promise<void> {
  const params: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--active") {
      params["active"] = "true";
    } else if (args[i] === "--tags" && args[i + 1]) {
      params["tags"] = args[i + 1];
      i++;
    } else if (args[i] === "--name" && args[i + 1]) {
      params["name"] = args[i + 1];
      i++;
    } else if (args[i] === "--project-id" && args[i + 1]) {
      params["projectId"] = args[i + 1];
      i++;
    } else if (args[i] === "--limit" && args[i + 1]) {
      params["limit"] = args[i + 1];
      i++;
    } else if (args[i] === "--json") {
    }
  }

  const result = await request<{ data: unknown[] }>("/workflows", "GET", undefined, params);
  
  if (jsonMode) {
    jsonOutput(result.data);
  } else {
    tableOutput(result.data as unknown[], ["id", "name", "active", "createdAt", "updatedAt"]);
  }
}

async function workflowGet(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n workflow get <id>" };
  
  const params: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--exclude-pinned-data") {
      params["excludePinnedData"] = "true";
    }
  }

  const result = await request<unknown>(`/workflows/${id}`, "GET", undefined, params);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "active", "nodes", "connections", "settings", "createdAt", "updatedAt"]);
  }
}

async function workflowCreate(args: string[]): Promise<void> {
  const jsonInput = args[0];
  if (!jsonInput) throw { code: 1, message: "Usage: n8n workflow create <file.json>" };
  
  const body = await parseJsonInput(jsonInput);
  const result = await request<unknown>("/workflows", "POST", body);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "active", "createdAt"]);
  }
}

async function workflowUpdate(args: string[]): Promise<void> {
  const [id, jsonInput] = args;
  if (!id || !jsonInput) throw { code: 1, message: "Usage: n8n workflow update <id> <file.json>" };
  
  const body = await parseJsonInput(jsonInput);
  const result = await request<unknown>(`/workflows/${id}`, "PUT", body);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "active", "updatedAt"]);
  }
}

async function workflowDelete(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n workflow delete <id>" };
  
  await request(`/workflows/${id}`, "DELETE");
  
  if (jsonMode) {
    jsonOutput({ deleted: true, id });
  } else {
    console.log(`Workflow '${id}' deleted`);
  }
}

async function workflowActivate(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n workflow activate <id>" };
  
  const body: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--version-id" && args[i + 1]) {
      body["versionId"] = args[i + 1];
      i++;
    }
  }

  const result = await request<unknown>(`/workflows/${id}/activate`, "POST", Object.keys(body).length > 0 ? body : undefined);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "active", "versionId"]);
  }
}

async function workflowDeactivate(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n workflow deactivate <id>" };
  
  const result = await request<unknown>(`/workflows/${id}/deactivate`, "POST");
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "active"]);
  }
}

async function workflowTags(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n workflow tags <id>" };
  
  let tagIds: string[] | undefined;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--set" && args[i + 1]) {
      tagIds = args[i + 1].split(",");
      i++;
    }
  }

  let result: unknown;
  if (tagIds) {
    result = await request<unknown>(`/workflows/${id}/tags`, "PUT", { tagIds });
  } else {
    result = await request<unknown>(`/workflows/${id}/tags`, "GET");
  }
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

async function executionList(args: string[]): Promise<void> {
  const params: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--status" && args[i + 1]) {
      params["status"] = args[i + 1];
      i++;
    } else if (args[i] === "--workflow-id" && args[i + 1]) {
      params["workflowId"] = args[i + 1];
      i++;
    } else if (args[i] === "--project-id" && args[i + 1]) {
      params["projectId"] = args[i + 1];
      i++;
    } else if (args[i] === "--include-data") {
      params["includeData"] = "true";
    } else if (args[i] === "--limit" && args[i + 1]) {
      params["limit"] = args[i + 1];
      i++;
    }
  }

  const result = await request<{ data: unknown[] }>("/executions", "GET", undefined, params);
  
  if (jsonMode) {
    jsonOutput(result.data);
  } else {
    tableOutput(result.data as unknown[], ["id", "workflowId", "status", "mode", "startedAt", "finishedAt"]);
  }
}

async function executionGet(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n execution get <id>" };
  
  const params: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--include-data") {
      params["includeData"] = "true";
    }
  }

  const result = await request<unknown>(`/executions/${id}`, "GET", undefined, params);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "workflowId", "status", "mode", "startedAt", "finishedAt", "data", "error"]);
  }
}

async function executionDelete(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n execution delete <id>" };
  
  await request(`/executions/${id}`, "DELETE");
  
  if (jsonMode) {
    jsonOutput({ deleted: true, id });
  } else {
    console.log(`Execution '${id}' deleted`);
  }
}

async function executionStop(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n execution stop <id>" };
  
  const result = await request<unknown>(`/executions/${id}/stop`, "POST");
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "status", "stoppedAt"]);
  }
}

async function executionRetry(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n execution retry <id>" };
  
  const params: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--load-workflow") {
      params["loadWorkflow"] = "true";
    }
  }

  const result = await request<unknown>(`/executions/${id}/retry`, "POST", undefined, params);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "status", "startedAt"]);
  }
}

async function credentialList(args: string[]): Promise<void> {
  const params: Record<string, string> = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      params["limit"] = args[i + 1];
      i++;
    }
  }

  const result = await request<{ data: unknown[] }>("/credentials", "GET", undefined, params);
  
  if (jsonMode) {
    jsonOutput(result.data);
  } else {
    tableOutput(result.data as unknown[], ["id", "name", "type", "createdAt", "updatedAt"]);
  }
}

async function credentialGet(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n credential get <id>" };

  // The n8n API does not have a GET /credentials/{id} endpoint.
  // We fetch the full list and filter by ID client-side.
  const result = await request<{ data: unknown[] }>("/credentials", "GET");
  const item = (result.data as Record<string, unknown>[]).find(c => c["id"] === id);

  if (!item) {
    throw { code: 1, message: `Credential '${id}' not found` };
  }

  if (jsonMode) {
    jsonOutput(item);
  } else {
    printItem(item as Record<string, unknown>, ["id", "name", "type", "data", "nodes", "createdAt", "updatedAt"]);
  }
}

async function credentialSchema(args: string[]): Promise<void> {
  const typeName = args[0];
  if (!typeName) throw { code: 1, message: "Usage: n8n credential schema <typeName>" };
  
  const result = await request<unknown>(`/credentials/schema/${typeName}`, "GET");
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

async function credentialCreate(args: string[]): Promise<void> {
  const jsonInput = args[0];
  if (!jsonInput) throw { code: 1, message: "Usage: n8n credential create <file.json>" };
  
  const body = await parseJsonInput(jsonInput);
  const result = await request<unknown>("/credentials", "POST", body);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "type", "createdAt"]);
  }
}

async function credentialUpdate(args: string[]): Promise<void> {
  const [id, jsonInput] = args;
  if (!id || !jsonInput) throw { code: 1, message: "Usage: n8n credential update <id> <file.json>" };
  
  const body = await parseJsonInput(jsonInput);
  const result = await request<unknown>(`/credentials/${id}`, "PATCH", body);
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "type", "updatedAt"]);
  }
}

async function credentialDelete(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) throw { code: 1, message: "Usage: n8n credential delete <id>" };
  
  await request(`/credentials/${id}`, "DELETE");
  
  if (jsonMode) {
    jsonOutput({ deleted: true, id });
  } else {
    console.log(`Credential '${id}' deleted`);
  }
}

async function credentialTransfer(args: string[]): Promise<void> {
  const id = args[0];
  let destinationId: string | undefined;
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--destination" && args[i + 1]) {
      destinationId = args[i + 1];
      i++;
    }
  }
  
  if (!id || !destinationId) throw { code: 1, message: "Usage: n8n credential transfer <id> --destination <projectId>" };
  
  const result = await request<unknown>(`/credentials/${id}/transfer`, "PUT", { destinationId });
  
  if (jsonMode) {
    jsonOutput(result);
  } else {
    printItem(result as Record<string, unknown>, ["id", "name", "type", "projectId"]);
  }
}

function showHelp(): void {
  console.log(`n8n-cli - CLI for n8n Public API v1.1.1

Usage: n8n <command> [options]

Commands:
  config <action> [args]    Manage configuration
  workflow <action> [args]   Manage workflows
  execution <action> [args] Manage executions
  credential <action> [args] Manage credentials

Global Options:
  --json              Output JSON format
  --base-url <url>    Override base URL
  --api-key <key>     Override API key (not stored)

Config Commands:
  config get <key>          Get config value
  config set <key> <value>  Set config value
  config list               List all config

Examples:
  n8n config set base_url https://n8n.example.com
  n8n workflow list --active
  n8n execution get <id> --json

For more info: https://docs.n8n.io/api/`);
}

async function main(): Promise<void> {
  try {
    if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
      showHelp();
      return;
    }

    const [category, action, ...rest] = args.filter(a => !a.startsWith("--"));

    if (category === "config") {
      if (!action) throw { code: 1, message: "Usage: n8n config <get|set|list> [args]" };
      
      if (action === "get") {
        const key = rest[0];
        if (!key) throw { code: 1, message: "Usage: n8n config get <key>" };
        await configGet(key);
      } else if (action === "set") {
        const [key, value] = rest;
        if (!key || !value) throw { code: 1, message: "Usage: n8n config set <key> <value>" };
        await configSet(key, value);
      } else if (action === "list") {
        await configList();
      } else {
        throw { code: 1, message: `Unknown config action: ${action}` };
      }
      return;
    }

    if (category === "workflow") {
      if (!action) throw { code: 1, message: "Usage: n8n workflow <list|get|create|update|delete|activate|deactivate|tags>" };
      
      if (action === "list") {
        await workflowList(rest);
      } else if (action === "get") {
        await workflowGet(rest);
      } else if (action === "create") {
        await workflowCreate(rest);
      } else if (action === "update") {
        await workflowUpdate(rest);
      } else if (action === "delete") {
        await workflowDelete(rest);
      } else if (action === "activate") {
        await workflowActivate(rest);
      } else if (action === "deactivate") {
        await workflowDeactivate(rest);
      } else if (action === "tags") {
        await workflowTags(rest);
      } else {
        throw { code: 1, message: `Unknown workflow action: ${action}` };
      }
      return;
    }

    if (category === "execution") {
      if (!action) throw { code: 1, message: "Usage: n8n execution <list|get|delete|stop|retry> [args]" };
      
      if (action === "list") {
        await executionList(rest);
      } else if (action === "get") {
        await executionGet(rest);
      } else if (action === "delete") {
        await executionDelete(rest);
      } else if (action === "stop") {
        await executionStop(rest);
      } else if (action === "retry") {
        await executionRetry(rest);
      } else {
        throw { code: 1, message: `Unknown execution action: ${action}` };
      }
      return;
    }

    if (category === "credential") {
      if (!action) throw { code: 1, message: "Usage: n8n credential <list|get|schema|create|update|delete|transfer> [args]" };
      
      if (action === "list") {
        await credentialList(rest);
      } else if (action === "get") {
        await credentialGet(rest);
      } else if (action === "schema") {
        await credentialSchema(rest);
      } else if (action === "create") {
        await credentialCreate(rest);
      } else if (action === "update") {
        await credentialUpdate(rest);
      } else if (action === "delete") {
        await credentialDelete(rest);
      } else if (action === "transfer") {
        await credentialTransfer(rest);
      } else {
        throw { code: 1, message: `Unknown credential action: ${action}` };
      }
      return;
    }

    throw { code: 1, message: `Unknown command: ${category}. Run 'n8n help' for usage.` };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && "message" in e) {
      const err = e as { code: number; message: string };
      printError(err.message);
      process.exit(err.code);
    }
    const err = e as Error;
    printError(err.message || String(e));
    process.exit(1);
  }
}

main();
