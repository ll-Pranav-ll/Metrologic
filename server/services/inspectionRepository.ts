import type { InspectionFilters, InspectionMetrics, InspectionRecord, RegionFlag } from "../../shared/inspection";
import { createInspection, getInspectionById, listInspections, updateInspection } from "../db";
import { seededInspections } from "./mockDatabase";

export interface InspectionRepository {
  list(filters?: InspectionFilters): Promise<InspectionRecord[]>;
  get(id: string): Promise<InspectionRecord | null>;
  save(record: InspectionRecord): Promise<InspectionRecord>;
  updateNotesAndFlags(id: string, notes: string, flags: RegionFlag[]): Promise<InspectionRecord | null>;
  attachReport(id: string, reportKey: string, reportUrl: string): Promise<InspectionRecord | null>;
  metrics(): Promise<InspectionMetrics>;
}

function toRecord(row: any): InspectionRecord {
  return {
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? row.createdAt),
    inspectorNotes: row.inspectorNotes ?? "",
    extractedData: row.extractedData,
    evaluation: row.evaluation,
    evidence: row.evidence,
    regionFlags: row.regionFlags,
  } as InspectionRecord;
}

function matches(record: InspectionRecord, filters: InspectionFilters = {}) {
  const query = filters.query?.trim().toLowerCase();
  const text = `${record.brand} ${record.extractedData.generic_name ?? ""} ${record.extractedData.manufacturer_name ?? ""}`.toLowerCase();
  if (query && !text.includes(query)) return false;
  if (filters.status && filters.status !== "ALL" && record.status !== filters.status) return false;
  if (filters.from && new Date(record.createdAt) < new Date(filters.from)) return false;
  if (filters.to && new Date(record.createdAt) > new Date(`${filters.to}T23:59:59.999Z`)) return false;
  return true;
}

class DurableInspectionRepository implements InspectionRepository {
  async list(filters: InspectionFilters = {}) {
    const records = (await listInspections()).map(toRecord);
    return [...records, ...seededInspections].filter(record => matches(record, filters)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async get(id: string) {
    const seeded = seededInspections.find(record => record.id === id);
    if (seeded) return seeded;
    const record = await getInspectionById(id);
    return record ? toRecord(record) : null;
  }

  async save(record: InspectionRecord) {
    await createInspection({
      id: record.id,
      brand: record.brand,
      status: record.status,
      complianceScore: record.complianceScore,
      inspectorNotes: record.inspectorNotes,
      extractedData: record.extractedData,
      evaluation: record.evaluation,
      evidence: record.evidence,
      regionFlags: record.regionFlags,
    });
    return record;
  }

  async updateNotesAndFlags(id: string, inspectorNotes: string, regionFlags: RegionFlag[]) {
    const seeded = seededInspections.find(record => record.id === id);
    if (seeded) {
      seeded.inspectorNotes = inspectorNotes;
      seeded.regionFlags = regionFlags;
      return seeded;
    }
    const updated = await updateInspection(id, { inspectorNotes, regionFlags });
    return updated ? toRecord(updated) : null;
  }

  async attachReport(id: string, reportKey: string, reportUrl: string) {
    const seeded = seededInspections.find(record => record.id === id);
    if (seeded) {
      seeded.reportKey = reportKey;
      seeded.reportUrl = reportUrl;
      return seeded;
    }
    const updated = await updateInspection(id, { reportKey, reportUrl });
    return updated ? toRecord(updated) : null;
  }

  async metrics() {
    const records = await this.list();
    const violations = records.flatMap(record => record.evaluation.violations);
    const common = violations.reduce<Record<string, number>>((count, item) => ({ ...count, [item.title]: (count[item.title] ?? 0) + 1 }), {});
    const mostCommonViolation = Object.entries(common).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No violations";
    return {
      totalInspections: records.length,
      compliancePassRate: records.length ? Math.round((records.filter(record => record.status === "COMPLIANT").length / records.length) * 100) : 0,
      totalViolations: violations.length,
      mostCommonViolation,
    };
  }
}

export const inspectionRepository = new DurableInspectionRepository();
