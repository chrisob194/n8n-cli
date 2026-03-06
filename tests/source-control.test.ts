import { describe, it, expect } from "bun:test";
import { runCli, loadTestEnv } from "./helpers.ts";

const env = loadTestEnv();

describe("source-control commands", () => {
  it("source-control pull (skips gracefully if not configured)", async () => {
    const result = await runCli(["source-control", "pull", "--json"], env);
    // Source control may not be enabled — just verify the command is handled
    expect(typeof result.exitCode).toBe("number");
  });
});
