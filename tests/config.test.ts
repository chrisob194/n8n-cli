import { describe, it, expect } from "bun:test";
import { runCli, assertSuccess, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();

describe("config commands", () => {
  it("config list", async () => {
    const result = await runCli(["config", "list", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(data.success).toBe(true);
    expect(data.data).toBeTruthy();
  });

  it("config set and get", async () => {
    const setResult = await runCli(["config", "set", "test_key", "test_value", "--json"], env);
    assertSuccess(setResult);

    const getResult = await runCli(["config", "get", "test_key", "--json"], env);
    assertSuccess(getResult);
    const data = parseJsonResult(getResult);
    expect(data.data).toBe("test_value");
  });

  it("config get missing key returns null in json mode", async () => {
    const result = await runCli(["config", "get", "nonexistent_key_xyz", "--json"], env);
    const data = parseJsonResult(result);
    expect(data.data).toBeNull();
  });

  it("config set api_key is rejected", async () => {
    const result = await runCli(["config", "set", "api_key", "somevalue", "--json"], env);
    expect(result.exitCode).toBe(1);
    const data = parseJsonResult(result);
    expect(data.success).toBe(false);
  });
});
