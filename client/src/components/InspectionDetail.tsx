import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createPdfReport, downloadCsv, downloadJson, downloadPdf } from "@/lib/inspectionExports";
import { trpc } from "@/lib/trpc";
import type { InspectionRecord, RegionFlag, RuleState } from "@shared/inspection";
import { AlertTriangle, Check, Download, FileJson, FileText, Flag, LoaderCircle, Save, Table2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const stateStyle: Record<RuleState, string> = {
  PASS: "border-[#a7c936] bg-[#e6f5b3] text-[#284000]",
  WARNING: "border-[#e0bd42] bg-[#fff0b0] text-[#6b4800]",
  FAIL: "border-[#e58d80] bg-[#ffd9d2] text-[#7a2017]",
};

function StateDot({ state }: { state: RuleState }) {
  return <span className={cn("h-2.5 w-2.5", state === "PASS" ? "bg-[#75a000]" : state === "WARNING" ? "bg-[#d99a00]" : "bg-[#d6493b]")} />;
}

function statusTone(status: InspectionRecord["status"]) {
  if (status === "COMPLIANT") return "border-[#91b51e] bg-[#e6f5b3] text-[#456900]";
  if (status === "PARTIAL_VIOLATION") return "border-[#e0bd42] bg-[#fff0b0] text-[#705000]";
  return "border-[#e58d80] bg-[#ffd9d2] text-[#82251b]";
}

export function InspectionDetail({ record, onClose, compact = false }: { record: InspectionRecord; onClose?: () => void; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [notes, setNotes] = useState(record.inspectorNotes);
  const [flags, setFlags] = useState<RegionFlag[]>(record.regionFlags);
  const [flagMode, setFlagMode] = useState(false);
  const [isPdfWorking, setIsPdfWorking] = useState(false);
  const [isPreviewWorking, setIsPreviewWorking] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const update = trpc.inspection.updateNotes.useMutation({
    onSuccess: () => { utils.inspection.get.invalidate({ id: record.id }); utils.inspection.list.invalidate(); toast.success("Inspector notes saved"); },
    onError: error => toast.error(error.message),
  });
  const saveReport = trpc.inspection.saveReport.useMutation({ onError: error => toast.error(error.message) });
  const summary = useMemo(() => `${record.evaluation.results.filter(item => item.state === "PASS").length}/7 declarations verified`, [record]);

  useEffect(() => () => { if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl); }, [pdfPreviewUrl]);

  const saveNotes = () => update.mutate({ id: record.id, inspectorNotes: notes, regionFlags: flags });
  const rememberPreview = (blob: Blob) => setPdfPreviewUrl(current => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(blob); });
  const preparePreview = async () => {
    setIsPreviewWorking(true);
    try { const report = await createPdfReport({ ...record, inspectorNotes: notes, regionFlags: flags }); rememberPreview(report.blob); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not prepare the report preview."); }
    finally { setIsPreviewWorking(false); }
  };
  const addFlag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!flagMode) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(90, ((event.clientX - box.left) / box.width) * 100 - 5));
    const y = Math.max(0, Math.min(90, ((event.clientY - box.top) / box.height) * 100 - 5));
    setFlags(current => [...current, { id: `flag-${Date.now()}`, label: "Inspector flag", note: "Review declaration region.", x, y, width: 12, height: 12 }]);
    setFlagMode(false);
  };
  const addKeyboardFlag = () => {
    if (!flagMode) return;
    setFlags(current => [...current, { id: `flag-${Date.now()}`, label: "Inspector flag", note: "Review declaration region.", x: 44, y: 44, width: 12, height: 12 }]);
    setFlagMode(false);
  };
  const exportPdf = async () => {
    setIsPdfWorking(true);
    try { const report = await createPdfReport({ ...record, inspectorNotes: notes, regionFlags: flags }); rememberPreview(report.blob); downloadPdf(report.blob, report.filename); saveReport.mutate({ id: record.id, filename: report.filename, data: report.data }); toast.success("Official-style PDF report generated"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate the PDF report."); }
    finally { setIsPdfWorking(false); }
  };

  return <motion.section initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }} className={cn("inspection-detail paper-card relative overflow-hidden p-4 sm:p-6", !compact && "shadow-[10px_10px_0_rgba(17,18,15,0.1)]")}>
    <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#151610_1px,transparent_1px),linear-gradient(90deg,#151610_1px,transparent_1px)] [background-size:24px_24px]" />
    <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-[#11120f]/15 pb-5">
      <div><p className="section-kicker">Live inspection / {record.id}</p><h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.06em]">{record.brand}</h2><p className="mt-2 font-mono text-[11px] text-[#62645d]">{summary} · captured {new Date(record.createdAt).toLocaleString()}</p></div>
      <div className="flex items-center gap-2"><span className={cn("status-chip", statusTone(record.status))}>{record.status.replaceAll("_", " ")}</span>{onClose && <button onClick={onClose} className="grid h-8 w-8 place-items-center border border-[#11120f]/15 hover:bg-[#11120f] hover:text-[#ffd600]" aria-label="Close scan detail"><X className="h-4 w-4" /></button>}</div>
    </div>

    <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{record.evaluation.results.map(item => <article key={item.id} className={cn("reveal-card min-h-[126px] border p-3", stateStyle[item.state])}><div className="flex items-center justify-between"><span className="flex items-center gap-2"><StateDot state={item.state} /><span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em]">{item.state}</span></span><span className="font-mono text-[9px] opacity-55">{item.id}</span></div><h3 className="mt-5 font-display text-lg font-semibold leading-none tracking-[-0.03em]">{item.title}</h3><p className="mt-2 font-mono text-[10px] leading-relaxed opacity-80">{item.message}</p></article>)}</div>

    <Tabs defaultValue="summary" onValueChange={value => { if (value === "report" && !pdfPreviewUrl && !isPreviewWorking) void preparePreview(); }} className="relative mt-8">
      <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-y border-[#11120f]/15 bg-transparent p-1"><TabsTrigger value="summary" className="rounded-none font-mono text-[10px] uppercase tracking-[0.13em] data-[state=active]:bg-[#11120f] data-[state=active]:text-[#ffd600]">Summary</TabsTrigger><TabsTrigger value="data" className="rounded-none font-mono text-[10px] uppercase tracking-[0.13em] data-[state=active]:bg-[#11120f] data-[state=active]:text-[#ffd600]">Extracted data</TabsTrigger><TabsTrigger value="raw" className="rounded-none font-mono text-[10px] uppercase tracking-[0.13em] data-[state=active]:bg-[#11120f] data-[state=active]:text-[#ffd600]">Raw JSON</TabsTrigger><TabsTrigger value="report" className="rounded-none font-mono text-[10px] uppercase tracking-[0.13em] data-[state=active]:bg-[#11120f] data-[state=active]:text-[#ffd600]">PDF preview</TabsTrigger></TabsList>
      <TabsContent value="summary" className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
        <div className="space-y-4"><div className="flex items-center justify-between gap-3"><div><p className="section-kicker">Evidence collector</p><h3 className="mt-1 font-display text-2xl font-semibold tracking-[-0.045em]">Package-label evidence.</h3></div><Button variant="outline" onClick={() => setFlagMode(!flagMode)} className={cn("rounded-none border-[#11120f]/20 font-mono text-[10px] uppercase tracking-[0.12em]", flagMode && "bg-[#ffd600] text-[#11120f]")}><Flag className="mr-2 h-3.5 w-3.5" />{flagMode ? "Click image" : "Flag region"}</Button></div>
          {record.evidence.length ? <div className="grid gap-3 sm:grid-cols-2">{record.evidence.map(file => <div key={file.id} role={flagMode ? "button" : undefined} tabIndex={flagMode ? 0 : -1} aria-label={flagMode ? "Add an evidence-region flag at the center of this image" : undefined} className={cn("relative overflow-hidden border border-[#11120f]/15 bg-[#e5e4dc]", flagMode && "cursor-crosshair focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a7600]")} onClick={addFlag} onKeyDown={event => { if (flagMode && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); addKeyboardFlag(); } }}><img src={file.url} alt={`Package evidence ${file.name}`} className="aspect-[4/3] w-full object-cover" />{flags.map(flag => <span key={flag.id} title={flag.note} className="absolute border-2 border-[#ff564a] bg-[#ff564a]/10" style={{ left: `${flag.x}%`, top: `${flag.y}%`, width: `${flag.width}%`, height: `${flag.height}%` }} />)}<p className="absolute bottom-0 left-0 bg-[#11120f]/85 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white">{file.name}</p></div>)}</div> : <div className="grid min-h-48 place-items-center border border-dashed border-[#11120f]/30 bg-[#e5e4dc] p-6 text-center"><AlertTriangle className="h-5 w-5 text-[#b47500]" /><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6d7068]">Stored record · evidence not available</p></div>}
          {flags.length > 0 && <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a2362e]">{flags.length} flagged visual region{flags.length === 1 ? "" : "s"} · save notes to persist</p>}
        </div>
        <div className="border-l-0 border-[#11120f]/15 lg:border-l lg:pl-6"><p className="section-kicker">Official comments</p><Textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Add field observations, directions, or corrective-action notes…" className="mt-3 min-h-36 resize-y rounded-none border-[#11120f]/20 bg-white font-mono text-xs focus-visible:ring-[#b29a00]" /><Button onClick={saveNotes} disabled={update.isPending} className="mt-3 rounded-none bg-[#11120f] font-mono text-[10px] uppercase tracking-[0.12em] text-[#ffd600] hover:bg-[#292a22]"><Save className="mr-2 h-3.5 w-3.5" />{update.isPending ? "Saving" : "Save notes"}</Button><div className="mt-7 border-t border-[#11120f]/15 pt-5"><p className="section-kicker">Violation breakdown</p><div className="mt-3 space-y-2">{record.evaluation.violations.length ? record.evaluation.violations.map(item => <div key={item.id} className="flex gap-2 border-l-2 border-[#de5144] bg-[#fff0ed] px-3 py-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c13f34]" /><p className="font-mono text-[10px] leading-relaxed"><strong>{item.title}:</strong> {item.message}</p></div>) : <div className="flex gap-2 border-l-2 border-[#8dbc12] bg-[#f1ffdb] px-3 py-2"><Check className="h-3.5 w-3.5 text-[#628a00]" /><p className="font-mono text-[10px]">All seven mock requirements verified.</p></div>}</div></div></div>
      </TabsContent>
      <TabsContent value="data" className="mt-6 overflow-hidden border border-[#11120f]/15 bg-white"><div className="grid divide-y divide-[#11120f]/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">{Object.entries(record.extractedData).map(([key, value]) => <div key={key} className="p-4"><p className="section-kicker">{key.replaceAll("_", " ")}</p><p className="mt-2 font-display text-lg font-semibold tracking-[-0.03em]">{String(value ?? "—")}</p></div>)}</div></TabsContent>
      <TabsContent value="raw" className="mt-6"><pre className="max-h-[420px] overflow-auto border border-[#11120f]/15 bg-[#11120f] p-4 font-mono text-[11px] leading-relaxed text-[#eaffaa]">{JSON.stringify({ extractedData: record.extractedData, evaluation: record.evaluation }, null, 2)}</pre></TabsContent>
      <TabsContent value="report" className="mt-6 border border-[#11120f]/15 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-[#ffd600] pb-5"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">Metrologic / inspection notice</p><h3 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-[-0.055em]">Packaged Commodity Compliance Report.</h3><p className="mt-2 font-mono text-xs text-[#66685f]">{record.status.replaceAll("_", " ")} · {record.complianceScore}% score · {record.id}</p></div><Button variant="outline" onClick={() => void preparePreview()} disabled={isPreviewWorking} className="rounded-none border-[#11120f]/20 font-mono text-[10px] uppercase tracking-[0.12em]">{isPreviewWorking ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}{isPreviewWorking ? "Preparing" : "Refresh preview"}</Button></div>{pdfPreviewUrl ? <iframe src={pdfPreviewUrl} title="Inspection report PDF preview" className="mt-5 h-[520px] w-full border border-[#11120f]/15" /> : <div className="mt-5 grid min-h-48 place-items-center border border-dashed border-[#11120f]/25 bg-[#f0efe8] p-6 text-center"><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#70726a]">{isPreviewWorking ? "Generating the official-style report…" : "Select this tab to generate a live PDF preview."}</p></div>}</TabsContent>
    </Tabs>
    <div className="relative mt-7 flex flex-wrap gap-2 border-t border-[#11120f]/15 pt-4"><Button onClick={exportPdf} disabled={isPdfWorking} className="rounded-none bg-[#ffd600] font-mono text-[10px] uppercase tracking-[0.12em] text-[#11120f] hover:bg-[#e6be00]">{isPdfWorking ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}{isPdfWorking ? "Building PDF" : "PDF report"}</Button><Button variant="outline" onClick={() => downloadJson({ ...record, inspectorNotes: notes, regionFlags: flags })} className="rounded-none border-[#11120f]/20 font-mono text-[10px] uppercase tracking-[0.12em]"><FileJson className="mr-2 h-3.5 w-3.5" />JSON</Button><Button variant="outline" onClick={() => downloadCsv({ ...record, inspectorNotes: notes, regionFlags: flags })} className="rounded-none border-[#11120f]/20 font-mono text-[10px] uppercase tracking-[0.12em]"><Table2 className="mr-2 h-3.5 w-3.5" />CSV</Button>{record.reportUrl && <a href={record.reportUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center border border-[#11120f]/20 px-3 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-[#11120f] hover:text-[#ffd600]"><Download className="mr-2 h-3.5 w-3.5" />Saved report</a>}</div>
  </motion.section>;
}
