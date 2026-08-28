import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const scanHistorySource = readFileSync(new URL("./ScanHistory.tsx", import.meta.url), "utf8");

describe("Scan History responsive filter", () => {
  it("uses item-aligned Select positioning to avoid Popper resize feedback", () => {
    expect(scanHistorySource).toContain('<SelectContent position="item-aligned">');
  });

  it("reads deep-link selection from the browser query string", () => {
    expect(scanHistorySource).toContain("window.location.search");
    expect(scanHistorySource).toContain('params.get("scan")');
  });
});
