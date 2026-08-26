import { InspectionDetail } from "@/components/InspectionDetail";
import { MetrologicShell } from "@/components/MetrologicShell";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { ComplianceStatus, InspectionRecord } from "@shared/inspection";
import { animate, stagger } from "animejs";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const statusStyle: Record<ComplianceStatus, string> = {
  COMPLIANT: "bg-[#ecffd2] text-[#456900]",
  PARTIAL_VIOLATION: "bg-[#fff3c2] text-[#765100]",
  NON_COMPLIANT: "bg-[#ffe1dc] text-[#8b2a20]",
};

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

  return <MetrologicShell eyebrow="Retained inspection repository" title="Scan History" actions={<span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#666960] sm:block">{scans.data?.length ?? 0} records in view</span>}>
    <section className="history-reveal motion-card border border-[#11120f]/15 bg-[#fbfaf6] p-4 shadow-[8px_8px_0_rgba(17,18,15,.08)] sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[210px] flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6f716a]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search brand or product…" aria-label="Search inspection history" className="h-10 rounded-none border-[#11120f]/20 bg-white pl-9 font-mono text-xs focus-visible:ring-[#8bb600]" /></div>
        <Select value={status} onValueChange={value => setStatus(value as ComplianceStatus | "ALL")}><SelectTrigger aria-label="Filter by compliance status" className="h-10 w-[190px] rounded-none border-[#11120f]/20 bg-white font-mono text-[10px] uppercase tracking-[0.11em]"><SlidersHorizontal className="mr-2 h-3.5 w-3.5" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="COMPLIANT">Compliant</SelectItem><SelectItem value="PARTIAL_VIOLATION">Partial violation</SelectItem><SelectItem value="NON_COMPLIANT">Non compliant</SelectItem></SelectContent></Select>
        <Input type="date" value={from} onChange={event => setFrom(event.target.value)} aria-label="From date" className="h-10 w-[155px] rounded-none border-[#11120f]/20 bg-white font-mono text-[10px]" />
        <Input type="date" value={to} onChange={event => setTo(event.target.value)} aria-label="To date" className="h-10 w-[155px] rounded-none border-[#11120f]/20 bg-white font-mono text-[10px]" />
      </div>
    </section>
    <section className="history-reveal motion-card mt-7 overflow-hidden border border-[#11120f]/15 bg-[#fbfaf6]">
      <div className="border-b border-[#11120f]/15 px-5 py-4"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#73756d]">Searchable enforcement archive</p><h2 className="font-serif text-3xl">Inspection register</h2></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#efeee7] font-mono text-[9px] uppercase tracking-[0.15em] text-[#74766f]"><tr><th className="px-5 py-3">Record</th><th className="px-5 py-3">Brand / commodity</th><th className="px-5 py-3">Compliance</th><th className="px-5 py-3">Key issue</th><th className="px-5 py-3">Date</th></tr></thead><tbody>
        {scans.isLoading ? <tr><td colSpan={5} className="px-5 py-12 font-mono text-xs text-[#75776f]">Loading retained inspections…</td></tr> : scans.data?.length ? scans.data.map(record => <tr key={record.id} role="button" tabIndex={0} aria-label={`Open inspection ${record.brand}`} onClick={() => openRecord(record)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRecord(record); } }} className="cursor-pointer border-t border-[#11120f]/10 hover:bg-[#f5f5ed] focus-visible:bg-[#163d33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7ca900]"><td className="px-5 py-4 font-mono text-[10px] text-[#6e7068]">{record.id}</td><td className="px-5 py-4"><p className="font-serif text-lg">{record.brand}</p><p className="font-mono text-[10px] text-[#777970]">{record.extractedData.generic_name ?? "Unidentified package"}</p></td><td className="px-5 py-4"><span className={cn("px-2 py-1 font-mono text-[9px] font-bold tracking-[0.1em]", statusStyle[record.status])}>{record.status.replaceAll("_", " ")}</span><p className="mt-1 font-mono text-[10px]">{record.complianceScore}% score</p></td><td className="max-w-60 px-5 py-4 font-mono text-[10px] leading-relaxed text-[#696b63]">{record.evaluation.violations[0]?.title ?? "No violation"}</td><td className="px-5 py-4 font-mono text-[10px] text-[#70726a]">{new Date(record.createdAt).toLocaleDateString()}</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center font-mono text-xs text-[#75776f]">No inspection records match the applied filters.</td></tr>}
      </tbody></table></div>
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent showCloseButton={false} className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#f3f2ed] p-0 shadow-[-12px_0_0_rgba(200,255,0,.65)] sm:h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-5xl sm:p-0">
        <DialogTitle className="sr-only">Inspection detail</DialogTitle>
        <DialogDescription className="sr-only">Detailed evidence, seven-rule evaluation, notes, and report exports for the selected inspection.</DialogDescription>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-color:#11120f_#e8e7df] [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-6">
          {selected && <InspectionDetail record={selected} onClose={close} compact />}
        </div>
      </DialogContent>
    </Dialog>
  </MetrologicShell>;
}
