import type {
  ComplianceEvaluation,
  ExtractedLabelData,
  RuleResult,
  RuleState,
} from "../../shared/inspection";

const validMetricUnits = new Set(["g", "kg", "ml", "l", "n", "m"]);
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validPhone = /^[+\d][\d\s().-]{6,}$/;
const validDate = /^(0[1-9]|1[0-2])\/(?:\d{2}|\d{4})$/;
const currencyAmount = /(?:₹|rs\.?|inr|\$|€|£)\s*\d/i;

export const ruleConfig = [
  { id: "manufacturer", title: "Manufacturer details" },
  { id: "identity", title: "Commodity identity" },
  { id: "quantity", title: "Net quantity" },
  { id: "mfgDate", title: "Manufacturing date" },
  { id: "mrp", title: "Maximum retail price" },
  { id: "consumerCare", title: "Consumer care details" },
  { id: "readability", title: "Readability & font score" },
] as const;

function result(
  id: string,
  title: string,
  state: RuleState,
  message: string,
  evidence: string[] = [],
): RuleResult {
  return { id, title, state, message, evidence };
}

/**
 * Isolated mock Legal Metrology evaluator. Exactly seven configurable checks are
 * evaluated so the rule list can later be replaced by jurisdiction-specific rules.
 */
export function evaluateCompliance(data: ExtractedLabelData): ComplianceEvaluation {
  const manufacturerPresent = Boolean(data.manufacturer_name?.trim() && data.manufacturer_address?.trim());
  const unit = data.unit?.trim().toLowerCase() ?? "";
  const hasQuantity = Boolean(data.net_quantity?.trim()) && validMetricUnits.has(unit);
  const hasMfgDate = Boolean(data.mfg_date && validDate.test(data.mfg_date.trim()));
  const hasMrp = Boolean(data.mrp_amount && currencyAmount.test(data.mrp_amount) && data.includes_all_taxes);
  const hasEmail = Boolean(data.customer_care_email && validEmail.test(data.customer_care_email.trim()));
  const hasPhone = Boolean(data.customer_care_phone && validPhone.test(data.customer_care_phone.trim()));
  const legibilityState: RuleState = data.legibility_score >= 65 ? "PASS" : data.legibility_score >= 45 ? "WARNING" : "FAIL";

  const results: RuleResult[] = [
    manufacturerPresent
      ? result("manufacturer", "Manufacturer details", "PASS", "Manufacturer name and full address are present.", [data.manufacturer_name!, data.manufacturer_address!])
      : result("manufacturer", "Manufacturer details", "FAIL", "Add a manufacturer name and full address.", ["manufacturer_name", "manufacturer_address"]),
    data.generic_name?.trim()
      ? result("identity", "Commodity identity", "PASS", "Generic commodity name is visible.", [data.generic_name])
      : result("identity", "Commodity identity", "FAIL", "Generic product name is not visible.", ["generic_name"]),
    hasQuantity
      ? result("quantity", "Net quantity", "PASS", "Net quantity uses a recognised metric unit.", [`${data.net_quantity} ${data.unit}`])
      : result("quantity", "Net quantity", "FAIL", "Net quantity must be present and use g, kg, ml, l, N, or m.", ["net_quantity", "unit"]),
    hasMfgDate
      ? result("mfgDate", "Manufacturing date", "PASS", "Manufacturing date matches MM/YYYY or MM/YY.", [data.mfg_date!])
      : result("mfgDate", "Manufacturing date", "FAIL", "Manufacturing date must use MM/YYYY or MM/YY.", ["mfg_date"]),
    hasMrp
      ? result("mrp", "Maximum retail price", "PASS", "MRP and an inclusive-tax statement are present.", [data.mrp_amount!])
      : result("mrp", "Maximum retail price", "FAIL", "Show a currency amount with “incl. of all taxes” or “inclusive of all taxes”.", ["mrp_amount", "includes_all_taxes"]),
    hasEmail || hasPhone
      ? result("consumerCare", "Consumer care details", "PASS", "At least one valid consumer-care contact is visible.", hasEmail ? [data.customer_care_email!] : [data.customer_care_phone!])
      : result("consumerCare", "Consumer care details", "FAIL", "Provide a valid customer-care email address or phone number.", ["customer_care_email", "customer_care_phone"]),
    legibilityState === "PASS"
      ? result("readability", "Readability & font score", "PASS", `Legibility score is ${data.legibility_score}/100.`, ["legibility_score"])
      : result("readability", "Readability & font score", legibilityState, legibilityState === "WARNING" ? `Legibility score is ${data.legibility_score}/100; improve contrast or focus.` : `Legibility score is ${data.legibility_score}/100; declarations are difficult to verify.`, ["legibility_score"]),
  ];

  const weights: Record<RuleState, number> = { PASS: 1, WARNING: 0.5, FAIL: 0 };
  const complianceScore = Math.round((results.reduce((total, item) => total + weights[item.state], 0) / results.length) * 100);
  const failures = results.filter(item => item.state === "FAIL");
  const warnings = results.filter(item => item.state === "WARNING");
  const status = failures.length === 0 && warnings.length === 0
    ? "COMPLIANT"
    : complianceScore >= 50
      ? "PARTIAL_VIOLATION"
      : "NON_COMPLIANT";

  return { status, complianceScore, results, violations: results.filter(item => item.state !== "PASS") };
}
