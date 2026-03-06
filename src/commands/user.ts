import { request } from "../http.ts";
import { jsonOutput, tableOutput, printItem } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleUserCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action) throw { code: 1, message: "Usage: n8n user <list|get|create|delete|set-role>" };

  if (action === "list") {
    const params: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
      else if (args[i] === "--include-role") params["includeRole"] = "true";
    }
    const result = await request<{ data: unknown[] }>("/users", "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data);
    } else {
      tableOutput(result.data as unknown[], ["id", "email", "firstName", "lastName", "role"]);
    }

  } else if (action === "get") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n user get <id>" };
    const result = await request<unknown>(`/users/${id}`, "GET", config);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "email", "firstName", "lastName", "role", "createdAt"]);
    }

  } else if (action === "create") {
    const email = args[1];
    if (!email) throw { code: 1, message: "Usage: n8n user create <email> [--role <role>]" };
    let role: string | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--role" && args[i + 1]) { role = args[++i]; }
    }
    const body: Record<string, unknown> = { email };
    if (role) body["role"] = role;
    const result = await request<unknown>("/users", "POST", config, [body]);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      const data = Array.isArray(result) ? result[0] : result;
      printItem(data as Record<string, unknown>, ["id", "email", "role", "createdAt"]);
    }

  } else if (action === "delete") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n user delete <id>" };
    await request(`/users/${id}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ deleted: true, id });
    } else {
      console.log(`User '${id}' deleted`);
    }

  } else if (action === "set-role") {
    const id = args[1];
    let role: string | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--role" && args[i + 1]) { role = args[++i]; }
    }
    if (!id || !role) throw { code: 1, message: "Usage: n8n user set-role <id> --role <role>" };
    const result = await request<unknown>(`/users/${id}/role`, "PATCH", config, { newRoleName: role });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(`User '${id}' role set to '${role}'`);
    }

  } else {
    throw { code: 1, message: `Unknown user action: ${action}` };
  }
}
