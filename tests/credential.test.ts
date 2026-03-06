import { describe, it, expect } from "bun:test";
import { runCli, assertSuccess, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();
let credentialId: string;

describe("credential commands", () => {
  it("credential list", async () => {
    const result = await runCli(["credential", "list", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("credential schema httpBasicAuth", async () => {
    const result = await runCli(["credential", "schema", "httpBasicAuth", "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect(data.success).toBe(true);
    expect(data.data).toBeTruthy();
  });

  it("credential create", async () => {
    const cred = JSON.stringify({
      name: "Test CLI Credential",
      type: "httpBasicAuth",
      data: { user: "testuser", password: "testpassword" },
    });
    const result = await runCli(["credential", "create", cred, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    credentialId = (data.data as Record<string, string>).id;
    expect(credentialId).toBeTruthy();
  });

  it("credential get", async () => {
    const result = await runCli(["credential", "get", credentialId, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, string>).id).toBe(credentialId);
  });

  it("credential delete", async () => {
    const result = await runCli(["credential", "delete", credentialId, "--json"], env);
    assertSuccess(result);
    const data = parseJsonResult(result);
    expect((data.data as Record<string, unknown>).deleted).toBe(true);
  });
});
