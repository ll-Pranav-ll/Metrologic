import { afterEach, describe, expect, it, vi } from "vitest";
import { storageGetSignedUrl, storagePut } from "./storage";

describe("Supabase Storage adapter", () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it("uploads to the private inspection bucket and returns a server URL", async () => {
    process.env.SUPABASE_URL = "https://storage-test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    const result = await storagePut("inspections/scan-1/evidence-1.png", new Uint8Array([1, 2, 3]), "image/png");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/^https:\/\/storage-test\.supabase\.co\/storage\/v1\/object\/inspection-evidence\/inspections\/scan-1\/evidence-1_[a-f0-9]{8}\.png$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-service-role-key", apikey: "test-service-role-key", "x-upsert": "false" });
    expect(result.url).toMatch(/^\/api\/storage\/inspections\/scan-1\/evidence-1_[a-f0-9]{8}\.png$/);
  });

  it("returns the signed URL from Supabase for a stored object", async () => {
    process.env.SUPABASE_URL = "https://storage-test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ signedURL: "/object/sign/inspection-evidence/file.pdf?token=abc" }), { status: 200 }));

    await expect(storageGetSignedUrl("inspections/scan-1/file.pdf")).resolves.toBe("https://storage-test.supabase.co/storage/v1/object/sign/inspection-evidence/file.pdf?token=abc");
  });

  it("surfaces upload failures without exposing credentials", async () => {
    process.env.SUPABASE_URL = "https://storage-test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("denied", { status: 403 }));

    await expect(storagePut("file.txt", "payload", "text/plain")).rejects.toThrow("Supabase Storage upload failed (403): denied");
  });
});
