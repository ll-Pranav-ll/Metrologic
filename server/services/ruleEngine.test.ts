import { describe, expect, it } from "vitest";
import type { ExtractedLabelData } from "../../shared/inspection";
import { evaluateCompliance, ruleConfig } from "./ruleEngine";

const compliantLabel: ExtractedLabelData = {
  generic_name: "Roasted peanuts",
  manufacturer_name: "Kaveri Foods Pvt. Ltd.",
  manufacturer_address: "12 Market Road, Mysuru, Karnataka 570001",
  net_quantity: "200",
  unit: "g",
  mfg_date: "08/2026",
  mrp_amount: "₹80 inclusive of all taxes",
  includes_all_taxes: true,
  customer_care_email: "care@kaveri.example",
  customer_care_phone: null,
  legibility_score: 92,
};

describe("evaluateCompliance", () => {
  it("evaluates exactly the seven configured mock Legal Metrology requirements", () => {
    const evaluation = evaluateCompliance(compliantLabel);
    expect(ruleConfig).toHaveLength(7);
    expect(evaluation.results).toHaveLength(7);
    expect(evaluation.status).toBe("COMPLIANT");
    expect(evaluation.complianceScore).toBe(100);
    expect(evaluation.violations).toHaveLength(0);
  });

  it("flags invalid metric units, tax declaration, contacts, and readability", () => {
    const evaluation = evaluateCompliance({
      ...compliantLabel,
      unit: "gm",
      includes_all_taxes: false,
      customer_care_email: null,
      legibility_score: 38,
    });
    expect(evaluation.status).toBe("NON_COMPLIANT");
    expect(evaluation.violations.map(item => item.id)).toEqual(expect.arrayContaining(["quantity", "mrp", "consumerCare", "readability"]));
  });
});
