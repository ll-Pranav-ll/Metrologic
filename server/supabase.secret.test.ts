import { describe, expect, it } from "vitest";

describe("Supabase server credentials", () => {
  it("authenticates against the supplied project REST root", async () => {
    const projectUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${projectUrl}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey ?? "",
        authorization: `Bearer ${serviceRoleKey ?? ""}`,
      },
    });

    expect(response.ok).toBe(true);
  }, 20_000);
});
