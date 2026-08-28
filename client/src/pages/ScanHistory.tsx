import { InspectionDetail } from "@/components/InspectionDetail";
import { MetrologicShell } from "@/components/MetrologicShell";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { ComplianceStatus, InspectionRecord } from "@shared/inspection";
import { animate, stagger } from "animejs";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

function statusTone(status: ComplianceStatus) {
  if (status === "COMPLIANT") return "status-chip--pass";
  if (status === "PARTIAL_VIOLATION") return "status-chip--warning";
  return "status-chip--fail";
}

export default function ScanHistory() {
  const [location, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ComplianceStatus | "ALL">("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<InspectionRecord | null>(null);
  const scans = trpc.inspection.list.useQuery({ query: query || undefined, status, from: from || undefined, to: to || undefined });
  const requested = params.get("scan");
  const specific = trpc.inspection.get.useQuery({ id: requested ?? "" }, { enabled: Boolean(requested) });

  useEffect(() => { if (specific.data) setSelected(specific.data); }, [specific.data]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(".history-reveal", { opacity: [0, 1], translateY: [14, 0], delay: stagger(70), duration: 520, ease: "outExpo" });
  }, []);

  const close = () => { setSelected(null); navigate("/history"); };
  const openRecord = (record: InspectionRecord) => setSelected(record);

  return <MetrologicShell eyebrow="Retained inspection repository" title="Scan history" actions={<span className="hidden border border-[#11120f]/15 bg-[#f7f6f0] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#66685f] sm:block"><span className="text-[#8a7600]">{String(scans.data?.length ?? 0).padStart(2, "0")}</span> records in view</span>}>
    <div className="space-y-8">
      <section className="history-reveal hairline-heading"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777970]">03</span><div><p className="section-kicker">Retained evidence</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.045em]">Find the signal in the archive.</h2></div><span className="hidden font-mono text-[9px] uppercase tracking-[0.15em] text-[#777970] sm:block">Search · filter · examine</span></section>
      <section className="history-reveal paper-card motion-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4"><div><p className="section-kicker">Query controls</p><h2 className="mt-1 font-display text-xl font-semibold tracking-[-0.04em]">Narrow the register.</h2></div><SlidersHorizontal className="h-5 w-5 text-[#8a7600]" /></div>
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_155px_155px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#777970]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search brand or product…" aria-label="Search inspection history" className="h-10 rounded-none border-[#11120f]/20 bg-white pl-9 font-mono text-xs focus-visible:ring-[#b29a00]" /></div>
          <Select value={status} onValueChange={value => setStatus(value as ComplianceStatus | "ALL")}><SelectTrigger aria-label="Filter by compliance status" className="h-10 w-full rounded-none border-[#11120f]/20 bg-white font-mono text-[10px] uppercase tracking-[0.11em]"><SlidersHorizontal className="mr-2 h-3.5 w-3.5" /><SelectValue /></SelectTrigger><SelectContent position="item-aligned"><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="COMPLIANT">Compliant</SelectItem><SelectItem value="PARTIAL_VIOLATION">Partial violation</SelectItem><SelectItem value="NON_COMPLIANT">Non compliant</SelectItem></SelectContent></Select>
          <Input type="date" value={from} onChange={event => setFrom(event.target.value)} aria-label="From date" className="h-10 w-full rounded-none border-[#11120f]/20 bg-white font-mono text-[10px]" />
          <Input type="date" value={to} onChange={event => setTo(event.target.value)} aria-label="To date" className="h-10 w-full rounded-none border-[#11120f]/20 bg-white font-mono text-[10px]" />
        </div>
      </section>
      <section className="history-reveal paper-card motion-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#11120f]/15 px-5 py-5"><div><p className="section-kicker">Searchable enforcement archive</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em]">Inspection register.</h2></div><p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#777970]">Select a row to examine</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-[#e5e4dc] font-mono text-[9px] uppercase tracking-[0.15em] text-[#74766f]"><tr><th className="px-5 py-3">Record</th><th className="px-5 py-3">Brand / commodity</th><th className="px-5 py-3">Compliance</th><th className="px-5 py-3">Key issue</th><th className="px-5 py-3">Date</th><th className="px-5 py-3" /></tr></thead><tbody>
          {scans.isLoading ? <tr><td colSpan={6} className="px-5 py-12 font-mono text-xs text-[#75776f]">Loading retained inspections…</td></tr> : scans.data?.length ? scans.data.map((record, index) => <tr key={record.id} role="button" tabIndex={0} aria-label={`Open inspection ${record.brand}`} onClick={() => openRecord(record)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRecord(record); } }} className="group cursor-pointer border-t border-[#11120f]/10 hover:bg-[#11120f] hover:text-[#f7f6f0] focus-visible:bg-[#11120f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8a7600]"><td className="px-5 py-4 font-mono text-[10px] text-[#6e7068] group-hover:text-[#b9baaf]"><span className="mr-3 text-[#9b9c92]">{String(index + 1).padStart(2, "0")}</span>{record.id}</td><td className="px-5 py-4"><p className="font-display text-lg font-semibold tracking-[-0.035em] group-hover:text-[#f7f6f0]">{record.brand}</p><p className="font-mono text-[10px] text-[#777970] group-hover:text-[#b9baaf]">{record.extractedData.generic_name ?? "Unidentified package"}</p></td><td className="px-5 py-4"><span className={cn("status-chip", statusTone(record.status))}>{record.status.replaceAll("_", " ")}</span><p className="mt-2 font-mono text-[10px]">{record.complianceScore}% score</p></td><td className="max-w-60 px-5 py-4 font-mono text-[10px] leading-relaxed text-[#696b63] group-hover:text-[#b9baaf]">{record.evaluation.violations[0]?.title ?? "No violation"}</td><td className="px-5 py-4 font-mono text-[10px] text-[#70726a] group-hover:text-[#b9baaf]">{new Date(record.createdAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><ArrowRight className="ml-auto h-4 w-4 text-[#9b9c92] transition-transform group-hover:translate-x-1 group-hover:text-[#ffd600]" /></td></tr>) : <tr><td colSpan={6} className="px-5 py-12 text-center font-mono text-xs text-[#75776f]">No inspection records match the applied filters.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent showCloseButton={false} className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#ecebe4] p-0 shadow-[-12px_0_0_rgba(255,214,0,.78)] sm:h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-5xl sm:p-0">
        <DialogTitle className="sr-only">Inspection detail</DialogTitle><DialogDescription className="sr-only">Detailed evidence, seven-rule evaluation, notes, and report exports for the selected inspection.</DialogDescription>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-color:#11120f_#e5e4dc] [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-6">{selected && <InspectionDetail record={selected} onClose={close} compact />}</div>
      </DialogContent>
    </Dialog>
  </MetrologicShell>;
}
