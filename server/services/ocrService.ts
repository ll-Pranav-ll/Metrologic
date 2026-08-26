import type { AnalysisInputImage, ExtractedLabelData } from "../../shared/inspection";

const extractionSchema = {
  type: "OBJECT",
  properties: {
    generic_name: { type: "STRING", nullable: true },
    manufacturer_name: { type: "STRING", nullable: true },
    manufacturer_address: { type: "STRING", nullable: true },
    net_quantity: { type: "STRING", nullable: true },
    unit: { type: "STRING", nullable: true },
    mfg_date: { type: "STRING", nullable: true },
    mrp_amount: { type: "STRING", nullable: true },
    includes_all_taxes: { type: "BOOLEAN" },
    customer_care_email: { type: "STRING", nullable: true },
    customer_care_phone: { type: "STRING", nullable: true },
    legibility_score: { type: "NUMBER", minimum: 0, maximum: 100 },
  },
  required: [
    "generic_name", "manufacturer_name", "manufacturer_address", "net_quantity", "unit", "mfg_date", "mrp_amount", "includes_all_taxes", "customer_care_email", "customer_care_phone", "legibility_score",
  ],
};

const emptyExtraction: ExtractedLabelData = {
  generic_name: null,
  manufacturer_name: null,
  manufacturer_address: null,
  net_quantity: null,
  unit: null,
  mfg_date: null,
  mrp_amount: null,
  includes_all_taxes: false,
  customer_care_email: null,
  customer_care_phone: null,
  legibility_score: 0,
};

function normalizeExtraction(raw: Partial<ExtractedLabelData>): ExtractedLabelData {
  const stringField = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
  const score = typeof raw.legibility_score === "number" && Number.isFinite(raw.legibility_score)
    ? Math.max(0, Math.min(100, Math.round(raw.legibility_score)))
    : 0;
  return {
    generic_name: stringField(raw.generic_name),
    manufacturer_name: stringField(raw.manufacturer_name),
    manufacturer_address: stringField(raw.manufacturer_address),
    net_quantity: stringField(raw.net_quantity),
    unit: stringField(raw.unit),
    mfg_date: stringField(raw.mfg_date),
    mrp_amount: stringField(raw.mrp_amount),
    includes_all_taxes: raw.includes_all_taxes === true,
    customer_care_email: stringField(raw.customer_care_email),
    customer_care_phone: stringField(raw.customer_care_phone),
    legibility_score: score,
  };
}

/** Server-only Gemini Vision extraction. Fields not visible must be null, never guessed. */
export async function extractPackageLabel(images: AnalysisInputImage[]): Promise<ExtractedLabelData> {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini Vision is not configured.");
  const contentTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
  if (images.some(image => !contentTypes.has(image.contentType))) {
    throw new Error("Only JPEG, PNG, WebP, HEIC, and HEIF package images can be analysed.");
  }

  const prompt = "You are a meticulous packaged-commodity label extractor. Examine all supplied label images together. Return only the requested schema. Extract text only when visible; never infer missing declarations. `mfg_date` must preserve a visible month/year expression. Set `includes_all_taxes` true only when the MRP declaration explicitly states 'incl. of all taxes' or 'inclusive of all taxes'. Score legibility 0–100 from visible text sharpness, contrast, and declaration clarity.";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            ...images.map(image => ({ inlineData: { mimeType: image.contentType, data: image.data } })),
          ],
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: extractionSchema,
          temperature: 0.1,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini Vision extraction failed (${response.status}): ${detail.slice(0, 240)}`);
  }
  const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim();
  if (!text) return emptyExtraction;
  try {
    return normalizeExtraction(JSON.parse(text) as Partial<ExtractedLabelData>);
  } catch {
    throw new Error("Gemini Vision returned an unreadable structured response.");
  }
}
