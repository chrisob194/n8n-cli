import { request } from "../http.ts";
import { jsonOutput } from "../output.ts";
import type { Config } from "../types.ts";

export async function handleSourceControlCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (!action || action === "pull") {
    const result = await request<unknown>("/source-control/pull", "POST", config);
    if (config.jsonMode) {
      jsonOutput(result);
    } else {
      console.log("Source control pull completed");
      console.log(JSON.stringify(result, null, 2));
    }

  } else {
    throw { code: 1, message: `Unknown source-control action: ${action}. Usage: n8n source-control pull` };
  }
}
