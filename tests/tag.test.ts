import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { runCli, assertSuccess, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();
let tagId: string;

describe("tag commands", () => {
  it("tag create", async () => {
    const result = await runCli(["tag", "create", "test-tag-cli", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(data.success).toBe(true);
    tagId = (data.data as Record<string, string>).id;
    expect(tagId).toBeTruthy();
  });

  it("tag list", async () => {
    const result = await runCli(["tag", "list", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
    expect((data.data as unknown[]).length).toBeGreaterThan(0);
  });

  it("tag get", async () => {
    const result = await runCli(["tag", "get", tagId, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, string>).id).toBe(tagId);
  });

  it("tag update", async () => {
    const result = await runCli(["tag", "update", tagId, "updated-tag-cli", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, string>).name).toBe("updated-tag-cli");
  });

  it("tag delete", async () => {
    const result = await runCli(["tag", "delete", tagId, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, unknown>).deleted).toBe(true);
  });
});
