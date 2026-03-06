import { request } from "../http.ts";
import { jsonOutput, tableOutput, printItem } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleVariableCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action) throw { code: 1, message: "Usage: n8n variable <list|create|update|delete>" };

  if (action === "list") {
    const params: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
    }
    const result = await request<{ data: unknown[] }>("/variables", "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data);
    } else {
      tableOutput(result.data as unknown[], ["id", "key", "value", "type"]);
    }

  } else if (action === "create") {
    const key = args[1];
    const value = args[2];
    if (!key || !value) throw { code: 1, message: "Usage: n8n variable create <key> <value>" };
    const result = await request<unknown>("/variables", "POST", config, { key, value });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "key", "value", "type"]);
    }

  } else if (action === "update") {
    const id = args[1];
    const key = args[2];
    const value = args[3];
    if (!id || !key || !value) throw { code: 1, message: "Usage: n8n variable update <id> <key> <value>" };
    const result = await request<unknown>(`/variables/${id}`, "PUT", config, { key, value });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "key", "value", "type"]);
    }

  } else if (action === "delete") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n variable delete <id>" };
    await request(`/variables/${id}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ deleted: true, id });
    } else {
      console.log(`Variable '${id}' deleted`);
    }

  } else {
    throw { code: 1, message: `Unknown variable action: ${action}` };
  }
}
