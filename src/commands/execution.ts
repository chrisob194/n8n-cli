import { request } from "../http.ts";
import { jsonOutput, tableOutput, printItem } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleExecutionCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action) throw { code: 1, message: "Usage: n8n execution <list|get|delete|stop|stop-all|retry|tags>" };

  if (action === "list") {
    const params: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--status" && args[i + 1]) { params["status"] = args[++i]; }
      else if (args[i] === "--workflow-id" && args[i + 1]) { params["workflowId"] = args[++i]; }
      else if (args[i] === "--project-id" && args[i + 1]) { params["projectId"] = args[++i]; }
      else if (args[i] === "--include-data") params["includeData"] = "true";
      else if (args[i] === "--limit" && args[i + 1]) { params["limit"] = args[++i]; }
    }
    const result = await request<{ data: unknown[] }>("/executions", "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result.data);
    } else {
      tableOutput(result.data as unknown[], ["id", "workflowId", "status", "mode", "startedAt", "finishedAt"]);
    }

  } else if (action === "get") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n execution get <id>" };
    const params: Record<string, string> = { includeData: "true" };
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--exclude-data") delete params["includeData"];
    }
    const result = await request<unknown>(`/executions/${id}`, "GET", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "workflowId", "status", "mode", "startedAt", "finishedAt", "data", "error"]);
    }

  } else if (action === "delete") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n execution delete <id>" };
    await request(`/executions/${id}`, "DELETE", config);
    if (config.jsonMode) {
      jsonOutput({ deleted: true, id });
    } else {
      console.log(`Execution '${id}' deleted`);
    }

  } else if (action === "stop") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n execution stop <id>" };
    const result = await request<unknown>(`/executions/${id}/stop`, "POST", config);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "status", "stoppedAt"]);
    }

  } else if (action === "stop-all") {
    const body: Record<string, string> = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--status" && args[i + 1]) { body["status"] = args[++i]; }
      else if (args[i] === "--workflow-id" && args[i + 1]) { body["workflowId"] = args[++i]; }
    }
    const result = await request<unknown>("/executions/stop", "POST", config, Object.keys(body).length > 0 ? body : undefined);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log("Stop-all request sent");
      console.log(JSON.stringify(result, null, 2));
    }

  } else if (action === "retry") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n execution retry <id>" };
    const params: Record<string, string> = {};
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--load-workflow") params["loadWorkflow"] = "true";
    }
    const result = await request<unknown>(`/executions/${id}/retry`, "POST", config, undefined, params);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      printItem(result as Record<string, unknown>, ["id", "status", "startedAt"]);
    }

  } else if (action === "tags") {
    const id = args[1];
    if (!id) throw { code: 1, message: "Usage: n8n execution tags <id> [--set <tagIds>]" };
    let tagIds: string[] | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--set" && args[i + 1]) { tagIds = args[++i].split(","); }
    }
    let result: unknown;
    if (tagIds) {
      result = await request<unknown>(`/executions/${id}/tags`, "PUT", config, tagIds.map(id => ({ id })));
    } else {
      result = await request<unknown>(`/executions/${id}/tags`, "GET", config);
    }
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

  } else {
    throw { code: 1, message: `Unknown execution action: ${action}` };
  }
}
