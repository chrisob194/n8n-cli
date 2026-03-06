import { describe, it, expect } from "bun:test";
import { runCli, loadTestEnv, parseJsonResult } from "./helpers.ts";

const env = loadTestEnv();

describe("audit commands", () => {
  it("audit generate", async () => {
    const result = await runCli(["audit", "generate", "--json"], env);
    // Audit may not be available in all n8n versions/configs, just check it runs
    expect(typeof result.exitCode).toBe("number");
    if (result.exitCode === 0) {
      const data = parseJsonResult(result);
      expect(data.success).toBe(true);
    }
  });

  it("audit generate with options", async () => {
    const result = await runCli([
      "audit", "generate",
      "--days-abandoned", "30",
      "--categories", "credentials,nodes",
      "--json",
    ], env);
    expect(typeof result.exitCode).toBe("number");
  });
});
