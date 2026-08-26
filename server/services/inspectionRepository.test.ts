import { describe, expect, it } from "vitest";
import { inspectionRepository } from "./inspectionRepository";

describe("inspection repository", () => {
  it("exposes the seeded records through the repository abstraction", async () => {
    const records = await inspectionRepository.list();
    expect(records.filter(record => record.id.startsWith("demo-"))).toHaveLength(5);
    expect(records.map(record => record.id)).toContain("demo-harvest");
  });

  it("filters seeded inspection records by compliance status and text query", async () => {
    const nonCompliant = await inspectionRepository.list({ status: "NON_COMPLIANT" });
    const pulse = await inspectionRepository.list({ query: "pulse" });
    expect(nonCompliant.filter(record => record.id.startsWith("demo-"))).toHaveLength(2);
    expect(pulse).toHaveLength(1);
    expect(pulse[0]?.brand).toBe("PulsePure");
  });

  it("derives high-level dashboard metrics from the same record source", async () => {
    const records = await inspectionRepository.list();
    const metrics = await inspectionRepository.metrics();
    const compliant = records.filter(record => record.status === "COMPLIANT").length;
    expect(metrics.totalInspections).toBe(records.length);
    expect(metrics.compliancePassRate).toBe(Math.round((compliant / records.length) * 100));
    expect(metrics.totalViolations).toBeGreaterThan(0);
  });
});
