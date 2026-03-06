import { request, parseJsonInput } from "../http.ts";
import { jsonOutput, tableOutput, printItem } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleCredentialCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action) throw { code: 1, message: "Usage: n8n credential <list|get|schema|create|update|delete|transfer>" };

  if (action === "list") {
    const params: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
    }
    const result = await request<{ data: unknown[] }>("/credentials", "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data);
    } else {
      tableOutput(result.data as unknown[], ["id", "name", "type", "createdAt", "updatedAt"]);
    }

  } else if (action === "get") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n credential get <id>" };
    const result = await request<{ data: unknown[] }>("/credentials", "GET", config);
    const item = (result.data as Record<string, unknown>[]).find(c => c["id"] === id);
    if (!item) throw { code: 1, message: `Credential '${id}' not found` };
    if (config.jsonMode) {
      jsonOutput(item);
    } else {
      printItem(item as Record<string, unknown>, ["id", "name", "type", "data", "nodes", "createdAt", "updatedAt"]);
    }

  } else if (action === "schema") {
    const typeName = args[1];
    if (!typeName) throw { code: 1, message: "Usage: n8n credential schema <typeName>" };
    const result = await request<unknown>(`/credentials/schema/${typeName}`, "GET", config);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

  } else if (action === "create") {
    const jsonInput = args[1];
    if (!jsonInput) throw { code: 1, message: "Usage: n8n credential create <file.json>" };
    const body = await parseJsonInput(jsonInput);
    const result = await request<unknown>("/credentials", "POST", config, body);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "type", "createdAt"]);
    }

  } else if (action === "update") {
    const id = args[1];
    const jsonInput = args[2];
    if (!id || !jsonInput) throw { code: 1, message: "Usage: n8n credential update <id> <file.json>" };
    const body = await parseJsonInput(jsonInput);
    const result = await request<unknown>(`/credentials/${id}`, "PATCH", config, body);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "type", "updatedAt"]);
    }

  } else if (action === "delete") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n credential delete <id>" };
    await request(`/credentials/${id}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ deleted: true, id });
    } else {
      console.log(`Credential '${id}' deleted`);
    }

  } else if (action === "transfer") {
    const id = args[1];
    let destinationId: string | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--destination" && args[i + 1]) { destinationId = args[++i]; }
    }
    if (!id || !destinationId) throw { code: 1, message: "Usage: n8n credential transfer <id> --destination <projectId>" };
    const result = await request<unknown>(`/credentials/${id}/transfer`, "PUT", config, { destinationId });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "type", "projectId"]);
    }

  } else {
    throw { code: 1, message: `Unknown credential action: ${action}` };
  }
}
