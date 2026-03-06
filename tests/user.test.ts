import { describe, it, expect } from "bun:test";
import { runCli, assertSuccess, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();

describe("user commands", () => {
  it("user list", async () => {
    const result = await runCli(["user", "list", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
    expect((data.data as unknown[]).length).toBeGreaterThan(0);
  });

  it("user list --include-role", async () => {
    const result = await runCli(["user", "list", "--include-role", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("user get current user (first in list)", async () => {
    const listResult = await runCli(["user", "list", "--json"], env);
    assertSuccess(listResult);
    const listData = parseJsonResult(listResult);
    const firstUser = (listData.data as Record<string, string>[])[0];
    expect(firstUser).toBeTruthy();

    const result = await runCli(["user", "get", firstUser.id, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, string>).id).toBe(firstUser.id);
  });
});
