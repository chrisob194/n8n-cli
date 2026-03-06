import { readConfigFile, writeConfigFile } from "../http.ts";
import { jsonOutput, printItem } from "../output.ts";
import { DEFAULT_BASE_URL } from "../http.ts";
import type { Config } from "../types.ts";

export async function handleConfigCommand(args: string[], config: Config): Promise<void> {
  const action = args[0];

  if (action === "get") {
    const key = args[1];
    if (!key) throw { code: 1, message: "Usage: n8n config get <key>" };
    const fileConfig = await readConfigFile();
    const value = fileConfig[key];
    if (config.jsonMode) {
      jsonOutput(value ?? null);
    } else {
      if (value) {
        console.log(value);
      } else {
        throw { code: 1, message: `Config key '${key}' not found` };
      }
    }
  } else if (action === "set") {
    const key = args[1];
    const value = args[2];
    if (!key || !value) throw { code: 1, message: "Usage: n8n config set <key> <value>" };
    if (key === "api_key" || key === "N8N_API_KEY") {
      throw { code: 1, message: "API key should not be stored in config file. Use N8N_API_KEY environment variable." };
    }
    const fileConfig = await readConfigFile();
    fileConfig[key] = value;
    await writeConfigFile(fileConfig);
    if (config.jsonMode) {
      jsonOutput({ key, value });
    } else {
      console.log(`Config '${key}' set to '${value}'`);
    }
  } else if (action === "list") {
    const fileConfig = await readConfigFile();
    const configWithDefaults = {
      ...fileConfig,
      base_url: fileConfig.base_url ?? DEFAULT_BASE_URL,
    };
    if (config.jsonMode) {
      jsonOutput(configWithDefaults);
    } else {
      console.log("Configuration:");
      Object.entries(configWithDefaults).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}`);
      });
    }
  } else {
    throw { code: 1, message: `Unknown config action: ${action}. Usage: n8n config <get|set|list>` };
  }
}
