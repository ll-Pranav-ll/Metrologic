export type ComplianceStatus = "COMPLIANT" | "PARTIAL_VIOLATION" | "NON_COMPLIANT";
export type RuleState = "PASS" | "WARNING" | "FAIL";

export type ExtractedLabelData = {
  generic_name: string | null;
  manufacturer_name: string | null;
  manufacturer_address: string | null;
  net_quantity: string | null;
  unit: string | null;
  mfg_date: string | null;
  mrp_amount: string | null;
  includes_all_taxes: boolean;
  customer_care_email: string | null;
  customer_care_phone: string | null;
  legibility_score: number;
};

export type RuleResult = {
  id: string;
  title: string;
  state: RuleState;
  message: string;
  evidence: string[];
};

export type ComplianceEvaluation = {
  status: ComplianceStatus;
  complianceScore: number;
  results: RuleResult[];
  violations: RuleResult[];
};

export type EvidenceFile = {
  id: string;
  name: string;
  key: string;
  url: string;
  contentType: string;
};

export type RegionFlag = {
  id: string;
  label: string;
  note: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type InspectionRecord = {
  id: string;
  brand: string;
  status: ComplianceStatus;
  complianceScore: number;
  inspectorNotes: string;
  extractedData: ExtractedLabelData;
  evaluation: ComplianceEvaluation;
  evidence: EvidenceFile[];
  regionFlags: RegionFlag[];
  reportKey?: string | null;
  reportUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type InspectionFilters = {
  query?: string;
  status?: ComplianceStatus | "ALL";
  from?: string;
  to?: string;
};

export type AnalysisInputImage = {
  name: string;
  contentType: string;
  data: string;
};

export type InspectionMetrics = {
  totalInspections: number;
  compliancePassRate: number;
  totalViolations: number;
  mostCommonViolation: string;
};
