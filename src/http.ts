import { file, write, $ } from "bun";
import type { Config } from "./types.ts";

export const CONFIG_FILE = `${process.env.HOME || process.env.USERPROFILE}/.config/n8n-cli/config.json`;
export const DEFAULT_BASE_URL = "http://localhost:5678";
const TIMEOUT_MS = 30000;

export async function loadConfig(overrides: {
  baseUrl?: string;
  apiKey?: string;
  jsonMode?: boolean;
}): Promise<Config> {
  const envApiKey = process.env.N8N_API_KEY;
  const envBaseUrl = process.env.N8N_BASE_URL;

  let fileConfig: Record<string, string> = {};
  try {
    const content = await file(CONFIG_FILE).text();
    fileConfig = JSON.parse(content);
  } catch {}

  return {
    baseUrl: overrides.baseUrl ?? envBaseUrl ?? fileConfig.base_url ?? DEFAULT_BASE_URL,
    apiKey: overrides.apiKey ?? envApiKey ?? null,
    jsonMode: overrides.jsonMode ?? false,
  };
}

export async function readConfigFile(): Promise<Record<string, string>> {
  try {
    const content = await file(CONFIG_FILE).text();
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function writeConfigFile(config: Record<string, string>): Promise<void> {
  const dir = CONFIG_FILE.replace(/\/[^/]+$/, "");
  await $`mkdir -p ${dir}`.quiet();
  await write(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function request<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  config: Config,
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<T> {
  if (!config.apiKey) {
    throw { code: 2, message: "API key not configured. Set N8N_API_KEY environment variable or run 'n8n config set api_key <value>'" };
  }

  const url = new URL(`${config.baseUrl}/api/v1${endpoint}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v) url.searchParams.append(k, v);
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        "X-N8N-API-KEY": config.apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      throw { code: 2, message: "Authentication failed. Check your API key." };
    }

    if (response.status === 404) {
      throw { code: 1, message: `Not found: ${endpoint}` };
    }

    if (response.status >= 500) {
      throw { code: 1, message: `Server error: ${response.status}` };
    }

    const text = await response.text();

    if (!response.ok) {
      let errMsg = `API error: ${response.status}`;
      try {
        const errJson = JSON.parse(text);
        errMsg += errJson.message ? ` - ${errJson.message}` : "";
      } catch {
        errMsg += text ? ` - ${text}` : "";
      }
      throw { code: 1, message: errMsg };
    }

    if (text === "") return {} as T;
    return JSON.parse(text);
  } catch (e: unknown) {
    clearTimeout(timeout);
    if (e && typeof e === "object" && "code" in e) throw e;
    const err = e as Error;
    if (err.name === "AbortError") {
      throw { code: 1, message: `Request timeout after ${TIMEOUT_MS}ms` };
    }
    throw { code: 1, message: `Network error: ${err.message}` };
  }
}

export async function parseJsonInput(input: string): Promise<unknown> {
  try {
    if (input.startsWith("{") || input.startsWith("[")) {
      return JSON.parse(input);
    }
    const content = await file(input).text();
    return JSON.parse(content);
  } catch {
    throw { code: 1, message: `Invalid JSON: ${input}` };
  }
}

export async function fetchIds(endpoint: string, config: Config): Promise<string[]> {
  try {
    if (!config.apiKey) return [];
    const url = new URL(`${config.baseUrl}/api/v1${endpoint}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "X-N8N-API-KEY": config.apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json() as { data?: unknown[] };
    const items = data.data ?? [];
    if (!Array.isArray(items)) return [];
    return items.map((item: unknown) => String((item as Record<string, unknown>)["id"] ?? "")).filter(Boolean);
  } catch {
    return [];
  }
}
