import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComplianceEvaluation, ExtractedLabelData, InspectionRecord } from "../shared/inspection";

const extracted: ExtractedLabelData = {
  generic_name: "Rice flour", manufacturer_name: "Test Foods", manufacturer_address: "1 Test Street", net_quantity: "500", unit: "g", mfg_date: "08/2026", mrp_amount: "₹50 inclusive of all taxes", includes_all_taxes: true, customer_care_email: "care@test.example", customer_care_phone: null, legibility_score: 90,
};
const evaluation: ComplianceEvaluation = { status: "COMPLIANT", complianceScore: 100, results: [], violations: [] };
const record: InspectionRecord = { id: "scan-fixed-id", brand: "Test Foods", status: "COMPLIANT", complianceScore: 100, inspectorNotes: "", extractedData: extracted, evaluation, evidence: [], regionFlags: [], createdAt: "2026-08-26T00:00:00.000Z" };
const repository = {
  list: vi.fn(), get: vi.fn(), metrics: vi.fn(), save: vi.fn(), updateNotesAndFlags: vi.fn(), attachReport: vi.fn(),
};

vi.mock("./services/inspectionRepository", () => ({ inspectionRepository: repository }));
vi.mock("./services/ocrService", () => ({ extractPackageLabel: vi.fn(async () => extracted) }));
vi.mock("./services/ruleEngine", () => ({ evaluateCompliance: vi.fn(() => evaluation) }));
vi.mock("./storage", () => ({ storagePut: vi.fn(async () => ({ key: "stored/test.jpg", url: "/manus-storage/stored/test.jpg" })) }));
vi.mock("nanoid", () => ({ nanoid: vi.fn(() => "fixed-id") }));

const { appRouter } = await import("./routers");
const ctx = { user: null, req: {} as never, res: {} as never };

describe("inspection router contracts", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns list and get repository results", async () => {
    repository.list.mockResolvedValue([record]);
    repository.get.mockResolvedValue(record);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.inspection.list({ status: "ALL" })).resolves.toEqual([record]);
    await expect(caller.inspection.get({ id: record.id })).resolves.toEqual(record);
    expect(repository.list).toHaveBeenCalledWith({ status: "ALL" });
    expect(repository.get).toHaveBeenCalledWith(record.id);
  });

  it("extracts, evaluates, stores evidence, and saves a new inspection through one mutation", async () => {
    repository.save.mockImplementation(async (input: InspectionRecord) => input);
    const caller = appRouter.createCaller(ctx);
    const response = await caller.inspection.analyze({ images: [{ name: "label.jpg", contentType: "image/jpeg", data: "aGVsbG8gd29ybGQ=" }], inspectorNotes: "Captured on site" });
    expect(response.id).toBe("scan-fixed-id");
    expect(response.evidence[0]?.url).toBe("/manus-storage/stored/test.jpg");
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ brand: "Test Foods", inspectorNotes: "Captured on site", status: "COMPLIANT" }));
  });

  it("persists revised notes and attaches a generated report", async () => {
    repository.updateNotesAndFlags.mockResolvedValue(record);
    repository.attachReport.mockResolvedValue({ ...record, reportUrl: "/manus-storage/stored/report.pdf" });
    const caller = appRouter.createCaller(ctx);
    await caller.inspection.updateNotes({ id: record.id, inspectorNotes: "Follow up needed", regionFlags: [] });
    await caller.inspection.saveReport({ id: record.id, filename: "report.pdf", data: "aGVsbG8gd29ybGQ=" });
    expect(repository.updateNotesAndFlags).toHaveBeenCalledWith(record.id, "Follow up needed", []);
    expect(repository.attachReport).toHaveBeenCalledWith(record.id, "stored/test.jpg", "/manus-storage/stored/test.jpg");
  });
});
