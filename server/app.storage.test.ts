import type { Server } from "node:http";
import { request } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";

describe("Supabase Storage HTTP route", () => {
  let server: Server;
  let baseUrl: string;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeAll(async () => {
    process.env.SUPABASE_URL = "https://storage-test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    server = createApp().listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP server address");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  async function get(path: string) {
    return new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }>((resolve, reject) => {
      const req = request(`${baseUrl}${path}`, (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => resolve({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks).toString("utf8") }));
      });
      req.on("error", reject);
      req.end();
    });
  }

  it("redirects stored files through a fresh Supabase signed URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ signedURL: "/object/sign/inspection-evidence/path/file.png?token=test" }), { status: 200 }));

    const response = await get("/api/storage/inspections/scan-1/file.png");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("https://storage-test.supabase.co/storage/v1/object/sign/inspection-evidence/path/file.png?token=test");
  });

  it("returns not found when Supabase cannot sign the file", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("denied", { status: 403 }));

    const response = await get("/api/storage/inspections/scan-1/missing.png");

    expect(response.status).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ error: "Stored file is unavailable" });
  });
});
