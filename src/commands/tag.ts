import { request } from "../http.ts";
import { jsonOutput, tableOutput, printItem } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleTagCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action) throw { code: 1, message: "Usage: n8n tag <list|get|create|update|delete>" };

  if (action === "list") {
    const params: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
    }
    const result = await request<{ data: unknown[] }>("/tags", "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data);
    } else {
      tableOutput(result.data as unknown[], ["id", "name", "createdAt"]);
    }

  } else if (action === "get") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n tag get <id>" };
    const result = await request<unknown>(`/tags/${id}`, "GET", config);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "createdAt", "updatedAt"]);
    }

  } else if (action === "create") {
    const name = args[1];
    if (!name) throw { code: 1, message: "Usage: n8n tag create <name>" };
    const result = await request<unknown>("/tags", "POST", config, { name });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "createdAt"]);
    }

  } else if (action === "update") {
    const id = args[1];
    const name = args[2];
    if (!id || !name) throw { code: 1, message: "Usage: n8n tag update <id> <name>" };
    const result = await request<unknown>(`/tags/${id}`, "PUT", config, { name });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "updatedAt"]);
    }

  } else if (action === "delete") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n tag delete <id>" };
    await request(`/tags/${id}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ deleted: true, id });
    } else {
      console.log(`Tag '${id}' deleted`);
    }

  } else {
    throw { code: 1, message: `Unknown tag action: ${action}` };
  }
}
