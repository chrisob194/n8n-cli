import { $ } from "bun";
import { expect } from "bun:test";
import { readFileSync, existsSync, copyFileSync } from "fs";

const ENV_FILE = new URL("../scripts/test.env", import.meta.url).pathname;
const ENV_EXAMPLE = new URL("../scripts/test.env.example", import.meta.url).pathname;
const CLI_PATH = new URL("../src/cli.ts", import.meta.url).pathname;

export function loadTestEnv(): Record<string, string> {
  if (!existsSync(ENV_FILE)) {
    if (existsSync(ENV_EXAMPLE)) {
      copyFileSync(ENV_EXAMPLE, ENV_FILE);
    } else {
      throw new Error(`Test env file not found: ${ENV_FILE}. Copy scripts/test.env.example to scripts/test.env`);
    }
  }
  const content = readFileSync(ENV_FILE, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCli(args: string[], env: Record<string, string>): Promise<CliResult> {
  try {
    const result = await $`bun run ${CLI_PATH} ${args}`.env({ ...process.env, ...env }).quiet();
    return {
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
      exitCode: result.exitCode,
    };
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer; exitCode?: number };
    return {
      stdout: err.stdout?.toString() ?? "",
      stderr: err.stderr?.toString() ?? "",
      exitCode: err.exitCode ?? 1,
    };
  }
}

export function assertSuccess(result: CliResult): void {
  if (result.exitCode !== 0) {
    throw new Error(`CLI exited with code ${result.exitCode}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  }
  expect(result.exitCode).toBe(0);
}

export function parseJsonResult(result: CliResult): { success: boolean; data: unknown; error: string | null } {
  return JSON.parse(result.stdout);
}
