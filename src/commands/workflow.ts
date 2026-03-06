import { request, parseJsonInput } from "../http.ts";
import { jsonOutput, tableOutput, printItem } from "../output.ts";
import type { Config } from "../types.ts";

const WORKFLOW_ALLOWED_FIELDS = ["name", "nodes", "connections", "settings", "staticData"];

function sanitizeWorkflowBody(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const src = body as Record<string, unknown>;
  // Unwrap { success, data } format returned by --json output
  const target = (typeof src.data === "object" && src.data !== null && !Array.isArray(src.data))
    ? src.data as Record<string, unknown>
    : src;
  const result: Record<string, unknown> = {};
  for (const field of WORKFLOW_ALLOWED_FIELDS) {
    if (field in target) result[field] = target[field];
  }
  return result;
}

export async function handleWorkflowCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action) throw { code: 1, message: "Usage: n8n workflow <list|get|create|update|delete|activate|deactivate|tags|transfer>" };

  if (action === "list") {
    const params: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--active") params["active"] = "true";
      else if (args[i] === "--tags" && args[i + 1]) { params["tags"] = args[++i]; }
      else if (args[i] === "--name" && args[i + 1]) { params["name"] = args[++i]; }
      else if (args[i] === "--project-id" && args[i + 1]) { params["projectId"] = args[++i]; }
      else if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
    }
    const result = await request<{ data: unknown[] }>("/workflows", "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data);
    } else {
      tableOutput(result.data as unknown[], ["id", "name", "active", "createdAt", "updatedAt"]);
    }

  } else if (action === "get") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n workflow get <id>" };
    const params: Record<string, string> = {};
    let versionId: string | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--exclude-pinned-data") params["excludePinnedData"] = "true";
      else if (args[i] === "--version" && args[i + 1]) { versionId = args[++i]; }
    }
    const endpoint = versionId ? `/workflows/${id}/${versionId}` : `/workflows/${id}`;
    const result = await request<unknown>(endpoint, "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "active", "nodes", "connections", "settings", "createdAt", "updatedAt"]);
    }

  } else if (action === "create") {
    const jsonInput = args[1];
    if (!jsonInput) throw { code: 1, message: "Usage: n8n workflow create <file.json>" };
    const body = sanitizeWorkflowBody(await parseJsonInput(jsonInput));
    const result = await request<unknown>("/workflows", "POST", config, body);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "active", "createdAt"]);
    }

  } else if (action === "update") {
    const id = args[1];
    const jsonInput = args[2];
    if (!id || !jsonInput) throw { code: 1, message: "Usage: n8n workflow update <id> <file.json>" };
    const body = sanitizeWorkflowBody(await parseJsonInput(jsonInput));
    const result = await request<unknown>(`/workflows/${id}`, "PUT", config, body);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "active", "updatedAt"]);
    }

  } else if (action === "delete") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n workflow delete <id>" };
    await request(`/workflows/${id}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ deleted: true, id });
    } else {
      console.log(`Workflow '${id}' deleted`);
    }

  } else if (action === "activate") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n workflow activate <id>" };
    const body: Record<string, string> = {};
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--version-id" && args[i + 1]) { body["versionId"] = args[++i]; }
    }
    const result = await request<unknown>(`/workflows/${id}/activate`, "POST", config, Object.keys(body).length > 0 ? body : undefined);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "active", "versionId"]);
    }

  } else if (action === "deactivate") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n workflow deactivate <id>" };
    const result = await request<unknown>(`/workflows/${id}/deactivate`, "POST", config);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "active"]);
    }

  } else if (action === "tags") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n workflow tags <id> [--set <tagIds>]" };
    let tagIds: string[] | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--set" && args[i + 1]) { tagIds = args[++i].split(","); }
    }
    let result: unknown;
    if (tagIds) {
      result = await request<unknown>(`/workflows/${id}/tags`, "PUT", config, tagIds.map(id => ({ id })));
    } else {
      result = await request<unknown>(`/workflows/${id}/tags`, "GET", config);
    }
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

  } else if (action === "transfer") {
    const id = args[1];
    let destinationId: string | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--destination" && args[i + 1]) { destinationId = args[++i]; }
    }
    if (!id || !destinationId) throw { code: 1, message: "Usage: n8n workflow transfer <id> --destination <projectId>" };
    const result = await request<unknown>(`/workflows/${id}/transfer`, "PUT", config, { destinationId });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(`Workflow '${id}' transferred to project '${destinationId}'`);
    }

  } else {
    throw { code: 1, message: `Unknown workflow action: ${action}` };
  }
}
