import { describe, it, expect } from "bun:test";
import { runCli, assertSuccess, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();

describe("execution commands", () => {
  it("execution list", async () => {
    const result = await runCli(["execution", "list", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("execution list --limit 5", async () => {
    const result = await runCli(["execution", "list", "--limit", "5", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
    expect((data.data as unknown[]).length).toBeLessThanOrEqual(5);
  });

  it("execution list --status error", async () => {
    const result = await runCli(["execution", "list", "--status", "error", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("execution get nonexistent returns error", async () => {
    const result = await runCli(["execution", "get", "99999999", "--json"], env);
    expect(result.exitCode).not.toBe(0);
    const data = parseJsonResult(result);
    expect(data.success).toBe(false);
  });
});
