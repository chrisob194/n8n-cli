import { describe, it, expect } from "bun:test";
import { runCli, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();
let variableId: string;

function isLicenseError(stdout: string): boolean {
  try {
    const d = JSON.parse(stdout);
    return typeof d.error === "string" && d.error.includes("license");
  } catch {
    return false;
  }
}

describe("variable commands", () => {
  it("variable create", async () => {
    const result = await runCli(["variable", "create", "TEST_CLI_VAR", "test_value_123", "--json"], env);
    if (isLicenseError(result.stdout)) return; // skip: feature not licensed
    expect(result.exitCode).toBe(0);
    const data = parseJsonResult(result);
    expect(data.success).toBe(true);
    variableId = (data.data as Record<string, string>).id;
    expect(variableId).toBeTruthy();
  });

  it("variable list", async () => {
    const result = await runCli(["variable", "list", "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("variable update", async () => {
    if (!variableId) return; // skip if create was skipped
    const result = await runCli(["variable", "update", variableId, "TEST_CLI_VAR", "updated_value", "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
  });

  it("variable delete", async () => {
    if (!variableId) return;
    const result = await runCli(["variable", "delete", variableId, "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, unknown>).deleted).toBe(true);
  });
});
