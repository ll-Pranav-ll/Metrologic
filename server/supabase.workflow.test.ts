import { afterAll, describe, expect, it, vi } from "vitest";
import type { ExtractedLabelData } from "../shared/inspection";

const extracted: ExtractedLabelData = {
  generic_name: "Synthetic verification flour",
  manufacturer_name: "Metrologic Test Foods",
  manufacturer_address: "1 Verification Street",
  net_quantity: "500",
  unit: "g",
  mfg_date: "08/2026",
  mrp_amount: "₹50 inclusive of all taxes",
  includes_all_taxes: true,
  customer_care_email: "care@test.example",
  customer_care_phone: null,
  legibility_score: 90,
};

vi.mock("./services/ocrService", () => ({ extractPackageLabel: vi.fn(async () => extracted) }));

const shouldRun = process.env.RUN_SUPABASE_E2E === "1";

describe.skipIf(!shouldRun)("Supabase-backed application workflow", () => {
  const ctx = { user: null, req: {} as never, res: {} as never };
  const createdKeys: string[] = [];
  let createdId = "";
  let appRouter: typeof import("./routers").appRouter;

  afterAll(async () => {
    if (createdId && process.env.SUPABASE_DATABASE_URL) {
      const pg = await import("pg");
      const client = new pg.default.Client({ connectionString: process.env.SUPABASE_DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query("DELETE FROM public.inspections WHERE id = $1", [createdId]);
      await client.end();
    }
    const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (baseUrl && key && createdKeys.length) {
      await fetch(`${baseUrl}/storage/v1/object/inspection-evidence`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify(createdKeys),
      });
    }
  });

  it("creates, retains, lists, and retrieves an inspection through the real router", async () => {
    ({ appRouter } = await import("./routers"));
    const caller = appRouter.createCaller(ctx);
    const record = await caller.inspection.analyze({
      images: [{ name: "synthetic-label.png", contentType: "image/png", data: "aGVsbG8gd29ybGQ=" }],
      inspectorNotes: "Synthetic Supabase integration verification",
    });
    createdId = record.id;
    createdKeys.push(...record.evidence.map((file) => file.key));
    expect(record.id).toMatch(/^scan-/);
    expect(record.evidence[0]?.url).toMatch(/^\/api\/storage\//);

    const report = await caller.inspection.saveReport({ id: record.id, filename: "verification.pdf", data: "JVBERi0xLjQgc3ludGhldGljIHJlcG9ydA==" });
    if (report?.reportKey) createdKeys.push(report.reportKey);
    expect(report?.reportUrl).toMatch(/^\/api\/storage\//);

    const listed = await caller.inspection.list({ query: "Metrologic Test Foods" });
    const retrieved = await caller.inspection.get({ id: record.id });
    expect(listed.some((item) => item.id === record.id)).toBe(true);
    expect(retrieved?.reportKey).toBe(report?.reportKey);
    expect(retrieved?.evidence[0]?.key).toBe(record.evidence[0]?.key);
  });
});
