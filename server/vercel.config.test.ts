import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type VercelConfig = {
  buildCommand: string;
  outputDirectory: string;
  rewrites: Array<{ source: string; destination: string }>;
};

describe("Vercel routing configuration", () => {
  it("routes API requests to the serverless function before the SPA fallback", () => {
    const configPath = fileURLToPath(new URL("../vercel.json", import.meta.url));
    const config = JSON.parse(readFileSync(configPath, "utf8")) as VercelConfig;

    expect(config.buildCommand).toBe("pnpm run build:vercel");
    expect(config.outputDirectory).toBe("dist");
    expect(config.rewrites).toEqual([
      { source: "/api/:path*", destination: "/api/[...path]" },
      { source: "/(.*)", destination: "/index.html" },
    ]);
  });
});
