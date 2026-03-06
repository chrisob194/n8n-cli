import { request } from "../http.ts";
import { jsonOutput, tableOutput, printItem } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleProjectCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action) throw { code: 1, message: "Usage: n8n project <list|create|update|delete|users|user-add|user-update|user-remove>" };

  if (action === "list") {
    const params: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
    }
    const result = await request<{ data: unknown[] }>("/projects", "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data);
    } else {
      tableOutput(result.data as unknown[], ["id", "name", "type", "createdAt"]);
    }

  } else if (action === "create") {
    const name = args[1];
    if (!name) throw { code: 1, message: "Usage: n8n project create <name>" };
    const result = await request<unknown>("/projects", "POST", config, { name });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name", "type", "createdAt"]);
    }

  } else if (action === "update") {
    const id = args[1];
    const name = args[2];
    if (!id || !name) throw { code: 1, message: "Usage: n8n project update <id> <name>" };
    const result = await request<unknown>(`/projects/${id}`, "PUT", config, { name });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "name"]);
    }

  } else if (action === "delete") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n project delete <id>" };
    await request(`/projects/${id}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ deleted: true, id });
    } else {
      console.log(`Project '${id}' deleted`);
    }

  } else if (action === "users") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n project users <id>" };
    const params: Record<string, string> = {};
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
    }
    const result = await request<{ data: unknown[] }>(`/projects/${id}/users`, "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data ?? result);
    } else {
      const data = (result as Record<string, unknown>).data ?? result;
      tableOutput(Array.isArray(data) ? data as unknown[] : [data], ["id", "email", "role"]);
    }

  } else if (action === "user-add") {
    const id = args[1];
    let userId: string | undefined;
    let role: string | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--user-id" && args[i + 1]) { userId = args[++i]; }
      else if (args[i] === "--role" && args[i + 1]) { role = args[++i]; }
    }
    if (!id || !userId || !role) throw { code: 1, message: "Usage: n8n project user-add <id> --user-id <uid> --role <role>" };
    const result = await request<unknown>(`/projects/${id}/users`, "POST", config, [{ id: userId, role }]);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(`User '${userId}' added to project '${id}' with role '${role}'`);
    }

  } else if (action === "user-update") {
    const id = args[1];
    const userId = args[2];
    let role: string | undefined;
    for (let i = 3; i < args.length; i++) {
      if (args[i] === "--role" && args[i + 1]) { role = args[++i]; }
    }
    if (!id || !userId || !role) throw { code: 1, message: "Usage: n8n project user-update <id> <userId> --role <role>" };
    const result = await request<unknown>(`/projects/${id}/users/${userId}`, "PATCH", config, { role });
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(`User '${userId}' role updated to '${role}' in project '${id}'`);
    }

  } else if (action === "user-remove") {
    const id = args[1];
    const userId = args[2];
    if (!id || !userId) throw { code: 1, message: "Usage: n8n project user-remove <id> <userId>" };
    await request(`/projects/${id}/users/${userId}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ removed: true, projectId: id, userId });
    } else {
      console.log(`User '${userId}' removed from project '${id}'`);
    }

  } else {
    throw { code: 1, message: `Unknown project action: ${action}` };
  }
}
