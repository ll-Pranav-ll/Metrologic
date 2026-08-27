import { type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("Vercel Express app", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createApp().listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected a TCP server address");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("serves the public health procedure through the API route", async () => {
    const input = encodeURIComponent(JSON.stringify({ json: { timestamp: 0 } }));
    const response = await fetch(`${baseUrl}/api/trpc/system.health?input=${input}`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      result: { data: { json: { ok: true } } },
    });
  });
});
