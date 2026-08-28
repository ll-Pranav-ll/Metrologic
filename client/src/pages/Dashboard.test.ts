import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("./Dashboard.tsx", import.meta.url), "utf8");
const stylesheetSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("Dashboard decorative motion", () => {
  it("includes looping background and side-panel decoration layers", () => {
    expect(dashboardSource).toContain("dashboard-glow--hero");
    expect(dashboardSource).toContain("dashboard-sweep");
    expect(dashboardSource).toContain("dashboard-glow--panel");
    expect(dashboardSource).toContain("dashboard-glow--rhythm");
    expect(dashboardSource).toContain("dashboard-rhythm-bar");
  });

  it("defines subtle transform/opacity motion with reduced-motion protection", () => {
    expect(stylesheetSource).toContain("@keyframes dashboard-glow-breathe");
    expect(stylesheetSource).toContain("@keyframes dashboard-orbit-drift");
    expect(stylesheetSource).toContain("@keyframes dashboard-sweep-glide");
    expect(stylesheetSource).toContain(".dashboard-glow, .dashboard-orbit, .dashboard-sweep, .dashboard-spark, .dashboard-rhythm-bar { animation: none !important; }");
  });
});
