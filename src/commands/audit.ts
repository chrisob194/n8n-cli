import { request } from "../http.ts";
import { jsonOutput } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleAuditCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action || action === "generate") {
    const body: Record<string, unknown> = {};
    const additionalOptions: Record<string, unknown> = {};

    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--days-abandoned" && args[i + 1]) {
        additionalOptions["daysAbandonedWorkflow"] = parseInt(args[++i]);
      } else if (args[i] === "--categories" && args[i + 1]) {
        body["categories"] = args[++i].split(",");
      }
    }

    if (Object.keys(additionalOptions).length > 0) {
      body["additionalOptions"] = additionalOptions;
    }

    const result = await request<unknown>("/audit", "POST", config, Object.keys(body).length > 0 ? body : undefined);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

  } else {
    throw { code: 1, message: `Unknown audit action: ${action}. Usage: n8n audit generate` };
  }
}
