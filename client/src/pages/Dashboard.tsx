import { MetrologicShell } from "@/components/MetrologicShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, ClipboardCheck, FileSearch, Plus, ScanLine, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { animate, stagger } from "animejs";

function statusTone(status: string) {
  if (status === "COMPLIANT") return "status-chip--pass";
  if (status === "PARTIAL_VIOLATION") return "status-chip--warning";
  return "status-chip--fail";
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const metrics = trpc.inspection.metrics.useQuery();
  const scans = trpc.inspection.list.useQuery({});

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(".dashboard-reveal", { opacity: [0, 1], translateY: [14, 0], delay: stagger(55), duration: 520, ease: "outExpo" });
  }, []);

  const cards = [
    { index: "01", label: "Total inspections", value: metrics.data?.totalInspections ?? "—", icon: ClipboardCheck, tone: "#ffd600" },
    { index: "02", label: "Compliance pass rate", value: metrics.data ? `${metrics.data.compliancePassRate}%` : "—", icon: ShieldCheck, tone: "#9fc32b" },
    { index: "03", label: "Violations flagged", value: metrics.data?.totalViolations ?? "—", icon: AlertTriangle, tone: "#db7568" },
    { index: "04", label: "Frequent issue", value: metrics.data?.mostCommonViolation ?? "—", icon: FileSearch, tone: "#b9a332", compact: true },
  ];

  return <MetrologicShell eyebrow="Enforcement command" title="Inspection overview" actions={<button onClick={() => navigate("/scan")} className="signal-button h-10 px-3"><Plus className="mr-2 h-3.5 w-3.5" />New scan</button>}>
    <div className="space-y-9">
      <section className="dashboard-reveal grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <div className="ink-card relative min-h-[300px] overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-[#ffd600]/35" />
          <div className="pointer-events-none absolute -right-3 top-8 h-52 w-52 rounded-full border border-[#ffd600]/25" />
          <div className="pointer-events-none absolute bottom-6 right-8 grid grid-cols-5 gap-2 opacity-60">{Array.from({ length: 15 }).map((_, index) => <span key={index} className={cn("h-1 w-1", index % 4 === 0 ? "bg-[#ffd600]" : "bg-[#66705e]")} />)}</div>
          <div className="relative max-w-2xl"><p className="section-kicker text-[#ffd600]">Field intelligence / retained evidence</p><h2 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#f7f6f0] sm:text-6xl">Every declaration, examined as evidence.</h2><p className="mt-5 max-w-xl font-mono text-xs leading-relaxed text-[#b9baaf]">Capture packaged labels in the field, evaluate the seven declaration checks, and retain the complete inspection record for desktop review.</p><div className="mt-7 flex flex-wrap items-center gap-4"><button onClick={() => navigate("/scan")} className="signal-button h-10 px-3">Open field scanner <ArrowRight className="ml-2 h-3.5 w-3.5" /></button><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#777970]">Protocol 07 / live evaluation</span></div></div>
        </div>
        <aside className="paper-card dashboard-reveal flex min-h-[300px] flex-col justify-between p-5 sm:p-6">
          <div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center bg-[#ffd600] text-[#11120f]"><ScanLine className="h-5 w-5" /></div><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#777970]">Ready state</span></div>
          <div><p className="section-kicker">Field kit status</p><h2 className="mt-2 font-display text-3xl font-semibold leading-none tracking-[-0.05em]">Ready to inspect.</h2><p className="mt-4 font-mono text-xs leading-relaxed text-[#55574e]">Camera capture, multi-image evidence, structured extraction, and report storage are connected.</p><button onClick={() => navigate("/scan")} className="mt-6 inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a6d00] underline decoration-[#ffd600] decoration-2 underline-offset-4">Start a fresh inspection <ArrowRight className="ml-2 h-3.5 w-3.5" /></button></div>
        </aside>
      </section>

      <section className="dashboard-reveal hairline-heading"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777970]">01</span><div><p className="section-kicker">System readout</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.045em]">The working numbers.</h2></div><span className="hidden font-mono text-[9px] uppercase tracking-[0.15em] text-[#777970] sm:block">Updated from retained records</span></section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <article key={card.label} className="dashboard-reveal paper-card motion-card min-h-36 p-4" style={{ borderTop: `4px solid ${card.tone}` }}><div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="font-mono text-[9px] text-[#9b9c92]">{card.index}</span><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#66685f]">{card.label}</p></div><card.icon className="h-4 w-4 text-[#3f4139]" /></div><p className={cn("mt-7 font-display font-semibold leading-none tracking-[-0.06em]", card.compact ? "max-w-[190px] text-2xl" : "text-5xl")}>{card.value}</p></article>)}</section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_.65fr]">
        <div className="dashboard-reveal paper-card motion-card overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#11120f]/15 px-4 py-5 sm:px-5"><div><p className="section-kicker">Latest retained records</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em]">Recent scans</h2></div><button onClick={() => navigate("/history")} className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a6d00] underline decoration-[#ffd600] decoration-2 underline-offset-4">View history <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#e5e4dc] font-mono text-[9px] uppercase tracking-[0.14em] text-[#777970]"><tr><th className="px-5 py-3">Package</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Captured</th><th className="px-5 py-3" /></tr></thead><tbody>{(scans.data ?? []).slice(0, 5).map(record => <tr key={record.id} onClick={() => navigate(`/history?scan=${record.id}`)} className="group cursor-pointer border-t border-[#11120f]/10 font-mono text-xs transition-colors hover:bg-[#11120f] hover:text-[#f7f6f0] focus-within:bg-[#11120f]"><td className="px-5 py-4"><strong className="font-display text-base font-semibold tracking-[-0.025em] group-hover:text-[#f7f6f0]">{record.brand}</strong><span className="mt-1 block text-[10px] text-[#777970] group-hover:text-[#b9baaf]">{record.extractedData.generic_name ?? "Unidentified package"}</span></td><td className="px-5 py-4"><span className={cn("status-chip", statusTone(record.status))}>{record.status.replaceAll("_", " ")}</span></td><td className="px-5 py-4">{record.complianceScore}%</td><td className="px-5 py-4 text-[10px] text-[#777970] group-hover:text-[#b9baaf]">{new Date(record.createdAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><ArrowRight className="ml-auto h-4 w-4 text-[#9b9c92] transition-transform group-hover:translate-x-1 group-hover:text-[#ffd600]" /></td></tr>)}</tbody></table></div>
          {!scans.data?.length && <div className="px-5 py-10 font-mono text-xs text-[#777970]">No retained scans yet. Open the field scanner to create the first record.</div>}
        </div>
        <aside className="dashboard-reveal ink-card motion-card relative overflow-hidden p-5 sm:p-6"><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[#ffd600]/25" /><div className="relative"><p className="section-kicker text-[#ffd600]">Inspection rhythm</p><div className="mt-7 flex items-end gap-2"><span className="font-display text-6xl font-semibold leading-none tracking-[-0.08em] text-[#ffd600]">07</span><span className="mb-1 font-mono text-[9px] uppercase leading-relaxed tracking-[0.13em] text-[#b9baaf]">declaration<br />checks</span></div><div className="mt-7 grid grid-cols-7 gap-1">{Array.from({ length: 7 }).map((_, index) => <span key={index} className={cn("h-2", index < 5 ? "bg-[#ffd600]" : "bg-[#42443b]")} />)}</div><p className="mt-5 font-mono text-[10px] leading-relaxed text-[#b9baaf]">A compact readout for the rules that turn a label image into an inspection record.</p></div></aside>
      </section>
    </div>
  </MetrologicShell>;
}
