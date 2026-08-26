import { describe, expect, it } from "vitest";

describe("Gemini server credential", () => {
  it("authenticates against the Gemini models endpoint", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey ?? "")}`,
    );

    expect(response.ok).toBe(true);
    const body = (await response.json()) as { models?: Array<{ name?: string }> };
    expect(body.models?.some(model => model.name?.includes("gemini"))).toBe(true);
  }, 20_000);
});
