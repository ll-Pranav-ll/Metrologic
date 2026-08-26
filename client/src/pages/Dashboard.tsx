import { MetrologicShell } from "@/components/MetrologicShell";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, ClipboardCheck, FileSearch, Plus, ScanLine, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { animate, stagger } from "animejs";

function statusStyle(status: string) { return status === "COMPLIANT" ? "bg-[#ebffd1] text-[#426500]" : status === "PARTIAL_VIOLATION" ? "bg-[#fff2bd] text-[#765000]" : "bg-[#ffe0db] text-[#8a281d]"; }

export default function Dashboard() {
  const [, navigate] = useLocation();
  const metrics = trpc.inspection.metrics.useQuery();
  const scans = trpc.inspection.list.useQuery({});
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(".dashboard-reveal", { opacity: [0, 1], translateY: [14, 0], delay: stagger(55), duration: 520, ease: "outExpo" });
  }, []);
  const cards = [
    { label: "Total inspections", value: metrics.data?.totalInspections ?? "—", icon: ClipboardCheck, tone: "#c8ff00" },
    { label: "Compliance pass rate", value: metrics.data ? `${metrics.data.compliancePassRate}%` : "—", icon: ShieldCheck, tone: "#d6e6ff" },
    { label: "Violations flagged", value: metrics.data?.totalViolations ?? "—", icon: AlertTriangle, tone: "#ffe0db" },
    { label: "Frequent issue", value: metrics.data?.mostCommonViolation ?? "—", icon: FileSearch, tone: "#fff1bc", compact: true },
  ];
  return <MetrologicShell eyebrow="Enforcement command" title="Inspection overview" actions={<button onClick={() => navigate("/scan")} className="inline-flex h-10 items-center bg-[#11120f] px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#c8ff00] transition-transform active:scale-[0.97]"><Plus className="mr-2 h-3.5 w-3.5" />New Scan</button>}>
    <section className="relative overflow-hidden border border-[#11120f]/15 bg-[#11120f] px-5 py-7 text-[#f6f5ef] shadow-[10px_10px_0_#c8ff00] sm:px-8 sm:py-9">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#c8ff00]/40" /><div className="absolute -right-5 top-5 h-56 w-56 rounded-full border border-[#c8ff00]/30" />
      <div className="relative max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[0.23em] text-[#c8ff00]">Field intelligence / retained evidence</p><h2 className="mt-3 font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">Every declaration, examined as evidence.</h2><p className="mt-5 max-w-xl font-mono text-xs leading-relaxed text-[#bfc3b4]">Capture packaged labels in the field, evaluate the seven mock declaration checks, and retain the complete inspection record for desktop review.</p><button onClick={() => navigate("/scan")} className="mt-6 inline-flex items-center border border-[#c8ff00] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#c8ff00] hover:bg-[#c8ff00] hover:text-[#11120f]">Open field scanner <ArrowRight className="ml-2 h-3.5 w-3.5" /></button></div>
    </section>
    <section className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <article key={card.label} className="dashboard-reveal motion-card min-h-36 border border-[#11120f]/15 bg-[#fbfaf6] p-4 shadow-[4px_4px_0_rgba(17,18,15,0.08)]" style={{ borderTop: `4px solid ${card.tone}` }}><div className="flex items-start justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6a6c64]">{card.label}</p><card.icon className="h-4 w-4" /></div><p className={cn("mt-7 font-serif leading-none", card.compact ? "text-2xl" : "text-4xl")}>{card.value}</p></article>)}</section>
    <section className="mt-9 grid gap-6 xl:grid-cols-[1.55fr_.7fr]">
      <div className="dashboard-reveal motion-card overflow-hidden border border-[#11120f]/15 bg-[#fbfaf6]"><div className="flex items-center justify-between border-b border-[#11120f]/15 px-4 py-4 sm:px-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#70726a]">Latest retained records</p><h2 className="font-serif text-2xl">Recent scans</h2></div><button onClick={() => navigate("/history")} className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#537700] hover:underline">View history</button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#f0efe8] font-mono text-[9px] uppercase tracking-[0.14em] text-[#777970]"><tr><th className="px-5 py-3">Package</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Captured</th></tr></thead><tbody>{(scans.data ?? []).slice(0, 5).map(record => <tr key={record.id} onClick={() => navigate(`/history?scan=${record.id}`)} className="cursor-pointer border-t border-[#11120f]/10 font-mono text-xs hover:bg-[#f5f5ee]"><td className="px-5 py-4"><strong className="font-serif text-base">{record.brand}</strong><span className="mt-1 block text-[10px] text-[#777970]">{record.extractedData.generic_name ?? "Unidentified package"}</span></td><td className="px-5 py-4"><span className={cn("px-2 py-1 text-[9px] font-bold tracking-[0.11em]", statusStyle(record.status))}>{record.status.replaceAll("_", " ")}</span></td><td className="px-5 py-4">{record.complianceScore}%</td><td className="px-5 py-4 text-[10px] text-[#777970]">{new Date(record.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>
      <div className="dashboard-reveal motion-card border border-[#11120f]/15 bg-[#e5ffc2] p-5"><ScanLine className="h-5 w-5" /><p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-[#577300]">Field kit status</p><h2 className="mt-2 font-serif text-3xl leading-none">Ready to inspect.</h2><p className="mt-4 font-mono text-xs leading-relaxed text-[#48600b]">Camera capture, multi-image evidence, structured Gemini Vision extraction, and document storage are connected.</p><button onClick={() => navigate("/scan")} className="mt-6 inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] underline underline-offset-4">Start a fresh inspection <ArrowRight className="ml-2 h-3.5 w-3.5" /></button></div>
    </section>
  </MetrologicShell>;
}
