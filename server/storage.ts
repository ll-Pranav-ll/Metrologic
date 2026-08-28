const BUCKET = "inspection-evidence";

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase storage config missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return { supabaseUrl, serviceRoleKey };
}

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  return lastDot === -1 ? `${relKey}_${hash}` : `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function objectUrl(key: string) {
  const { supabaseUrl } = getSupabaseConfig();
  return `${supabaseUrl}/storage/v1/object/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function serverUrl(key: string) {
  return `/api/storage/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { serviceRoleKey } = getSupabaseConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const response = await fetch(objectUrl(key), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": contentType,
      "x-upsert": "false",
      "cache-control": "3600",
    },
    body: typeof data === "string" ? data : new Uint8Array(data),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase Storage upload failed (${response.status}): ${message}`);
  }
  return { key, url: serverUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: serverUrl(key) };
}

export async function storageGetSignedUrl(relKey: string, expiresIn = 3600): Promise<string> {
  const { serviceRoleKey } = getSupabaseConfig();
  const key = normalizeKey(relKey);
  const { supabaseUrl: baseUrl } = getSupabaseConfig();
  const signPath = key.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${baseUrl}/storage/v1/object/sign/${BUCKET}/${signPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase Storage signing failed (${response.status}): ${message}`);
  }
  const result = (await response.json()) as { signedURL?: string };
  if (!result.signedURL) throw new Error("Supabase Storage returned no signed URL");
  return result.signedURL.startsWith("http") ? result.signedURL : `${getSupabaseConfig().supabaseUrl}/storage/v1${result.signedURL}`;
}
