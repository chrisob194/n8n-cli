#!/usr/bin/env bun

import { existsSync } from "fs";
import { join } from "path";
import { file, $ } from "bun";

// Load test.env if present
const envFile = join(import.meta.dir, "test.env");
if (existsSync(envFile)) {
  const content = await file(envFile).text();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  }
}

const apiKey = process.env.N8N_API_KEY;
const baseUrl = process.env.N8N_BASE_URL ?? "http://localhost:5678";

if (!apiKey) {
  console.error("Error: N8N_API_KEY is not set.");
  console.error("");
  console.error("Setup:");
  console.error("  1. Start n8n: docker compose -f scripts/compose.yml up -d");
  console.error("  2. Open http://localhost:5678, create an account, go to Settings > API Keys");
  console.error("  3. Create scripts/test.env with:");
  console.error("       N8N_API_KEY=your-api-key-here");
  console.error("       N8N_BASE_URL=http://localhost:5678");
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: bun run scripts/test.ts <command> [args]");
  console.log("Example: bun run scripts/test.ts workflow list --json");
  process.exit(1);
}

console.log(`Running: bun run src/cli.ts ${args.join(" ")}`);
console.log(`With N8N_BASE_URL=${baseUrl}`);
console.log("");

const result = await $`bun run src/cli.ts ${args}`
  .env({ ...process.env, N8N_API_KEY: apiKey, N8N_BASE_URL: baseUrl })
  .nothrow();

if (result.stdout) console.log(result.stdout.toString());
if (result.stderr) console.error(result.stderr.toString());

if (result.exitCode !== 0) {
  console.error(`Test failed with exit code ${result.exitCode}`);
  process.exit(1);
}

console.log("Test passed!");
