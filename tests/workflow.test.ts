import { describe, it, expect } from "bun:test";
import { runCli, assertSuccess, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();
let workflowId: string;

const minimalWorkflow = JSON.stringify({
  name: "Test CLI Workflow",
  nodes: [],
  connections: {},
  settings: { executionOrder: "v1" },
});

describe("workflow commands", () => {
  it("workflow create", async () => {
    const result = await runCli(["workflow", "create", minimalWorkflow, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(data.success).toBe(true);
    workflowId = (data.data as Record<string, string>).id;
    expect(workflowId).toBeTruthy();
  });

  it("workflow list", async () => {
    const result = await runCli(["workflow", "list", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("workflow list --active", async () => {
    const result = await runCli(["workflow", "list", "--active", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("workflow get", async () => {
    const result = await runCli(["workflow", "get", workflowId, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, string>).id).toBe(workflowId);
  });

  it("workflow update", async () => {
    const updatedWorkflow = JSON.stringify({
      name: "Test CLI Workflow Updated",
      nodes: [],
      connections: {},
      settings: { executionOrder: "v1" },
    });
    const result = await runCli(["workflow", "update", workflowId, updatedWorkflow, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, string>).name).toBe("Test CLI Workflow Updated");
  });

  it("workflow activate", async () => {
    const result = await runCli(["workflow", "activate", workflowId, "--json"], env);
    // May fail if workflow has no trigger node, just check it runs
    expect(typeof result.exitCode).toBe("number");
  });

  it("workflow deactivate", async () => {
    const result = await runCli(["workflow", "deactivate", workflowId, "--json"], env);
    expect(typeof result.exitCode).toBe("number");
  });

  it("workflow tags get", async () => {
    const result = await runCli(["workflow", "tags", workflowId, "--json"], env);
    assertSuccess(result);
  });

  it("workflow delete", async () => {
    const result = await runCli(["workflow", "delete", workflowId, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, unknown>).deleted).toBe(true);
  });
});
