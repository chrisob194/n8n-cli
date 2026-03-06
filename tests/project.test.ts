import { describe, it, expect } from "bun:test";
import { runCli, loadTestEnv, parseJsonResult } from "./helpers.ts";

function isLicenseError(stdout: string): boolean {
  try {
    const d = JSON.parse(stdout);
    return typeof d.error === "string" && d.error.includes("license");
  } catch {
    return false;
  }
}

const env = loadTestEnv();
let projectId: string;

describe("project commands", () => {
  it("project list", async () => {
    const result = await runCli(["project", "list", "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("project create", async () => {
    const result = await runCli(["project", "create", "Test CLI Project", "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
    const data = parseJsonResult(result);
    expect(data.success).toBe(true);
    projectId = (data.data as Record<string, string>).id;
    expect(projectId).toBeTruthy();
  });

  it("project users", async () => {
    if (!projectId) return;
    const result = await runCli(["project", "users", projectId, "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
  });

  it("project update", async () => {
    if (!projectId) return;
    const result = await runCli(["project", "update", projectId, "Updated CLI Project", "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
  });

  it("project delete", async () => {
    if (!projectId) return;
    const result = await runCli(["project", "delete", projectId, "--json"], env);
    if (isLicenseError(result.stdout)) return;
    expect(result.exitCode).toBe(0);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, unknown>).deleted).toBe(true);
  });
});
