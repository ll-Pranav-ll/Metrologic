import type { InspectionRecord } from "../../shared/inspection";
import { evaluateCompliance } from "./ruleEngine";

function seed(id: string, brand: string, createdAt: string, data: InspectionRecord["extractedData"]): InspectionRecord {
  const evaluation = evaluateCompliance(data);
  return {
    id,
    brand,
    createdAt,
    updatedAt: createdAt,
    inspectorNotes: "Seeded example inspection record.",
    evidence: [],
    regionFlags: [],
    extractedData: data,
    evaluation,
    status: evaluation.status,
    complianceScore: evaluation.complianceScore,
  };
}

export const seededInspections: InspectionRecord[] = [
  seed("demo-harvest", "Harvest & Co.", "2026-08-24T08:45:00.000Z", { generic_name: "Fortified wheat flour", manufacturer_name: "Harvest & Co. Foods Pvt. Ltd.", manufacturer_address: "Plot 12, Sector 8, Jaipur, Rajasthan 302001", net_quantity: "1", unit: "kg", mfg_date: "07/2026", mrp_amount: "₹68 (incl. of all taxes)", includes_all_taxes: true, customer_care_email: "care@harvestco.example", customer_care_phone: null, legibility_score: 92 }),
  seed("demo-pulse", "PulsePure", "2026-08-23T11:20:00.000Z", { generic_name: "Chana dal", manufacturer_name: "PulsePure Foods", manufacturer_address: "Village Harsaru, Gurugram, Haryana 122505", net_quantity: "500", unit: "g", mfg_date: "06/26", mrp_amount: "₹94 inclusive of all taxes", includes_all_taxes: true, customer_care_email: null, customer_care_phone: "+91 1800 555 9090", legibility_score: 81 }),
  seed("demo-spring", "SpringRoot", "2026-08-22T14:05:00.000Z", { generic_name: "Carbonated beverage", manufacturer_name: "SpringRoot Beverages", manufacturer_address: null, net_quantity: "750", unit: "ml", mfg_date: "08/2026", mrp_amount: "₹45", includes_all_taxes: false, customer_care_email: null, customer_care_phone: null, legibility_score: 58 }),
  seed("demo-marina", "Marina Select", "2026-08-20T10:10:00.000Z", { generic_name: null, manufacturer_name: "Marina Select Foods", manufacturer_address: "Harbour Road, Kochi, Kerala 682001", net_quantity: "250", unit: "gm", mfg_date: "2026/07", mrp_amount: "₹135 incl. of all taxes", includes_all_taxes: true, customer_care_email: "help@marina.example", customer_care_phone: null, legibility_score: 42 }),
  seed("demo-daily", "Daily Grain", "2026-08-18T09:30:00.000Z", { generic_name: "Breakfast cereal", manufacturer_name: null, manufacturer_address: null, net_quantity: "400", unit: "g", mfg_date: "07/26", mrp_amount: null, includes_all_taxes: false, customer_care_email: null, customer_care_phone: "123", legibility_score: 36 }),
];
