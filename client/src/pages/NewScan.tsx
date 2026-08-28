import { InspectionDetail } from "@/components/InspectionDetail";
import { MetrologicShell } from "@/components/MetrologicShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { bindCameraStream, getCameraConstraints, hasRenderableCameraFrame } from "@/lib/camera";
import type { InspectionRecord } from "@shared/inspection";
import { Camera, ImagePlus, LoaderCircle, ScanLine, Trash2, Upload, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { animate, stagger } from "animejs";

type StagedImage = { id: string; file: File; url: string; data?: string };

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NewScan() {
  const [staged, setStaged] = useState<StagedImage[]>([]);
  const [notes, setNotes] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<InspectionRecord | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mutation = trpc.inspection.analyze.useMutation({
    onSuccess: record => { setResult(record); toast.success("Label extraction and seven-rule evaluation complete."); },
    onError: error => toast.error(error.message),
  });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(".scan-reveal", { opacity: [0, 1], translateY: [16, 0], delay: stagger(70), duration: 520, ease: "outExpo" });
  }, []);
  useEffect(() => {
    if (!cameraOpen) return;
    const stream = streamRef.current;
    if (!stream) return;
    const video = videoRef.current;
    bindCameraStream(video, stream);
    return () => {
      if (video?.srcObject === stream) video.srcObject = null;
      setCameraReady(false);
    };
  }, [cameraOpen]);
  useEffect(() => () => { streamRef.current?.getTracks().forEach(track => track.stop()); }, []);
  useEffect(() => { if (result) utils.inspection.list.invalidate(); }, [result, utils.inspection.list]);

  const appendFiles = (files: FileList | File[]) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const additions = Array.from(files).filter(file => allowed.includes(file.type));
    if (!additions.length) { toast.error("Add JPEG, PNG, WebP, HEIC, or HEIF package images."); return; }
    setStaged(current => [...current, ...additions.slice(0, Math.max(0, 6 - current.length)).map(file => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) }))]);
  };
  const removeImage = (id: string) => setStaged(current => { const item = current.find(image => image.id === id); if (item) URL.revokeObjectURL(item.url); return current.filter(image => image.id !== id); });
  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { cameraInputRef.current?.click(); return; }
    try {
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia(getCameraConstraints());
      streamRef.current = stream;
      setCameraOpen(true);
    } catch { toast.error("Camera access is unavailable. Use the image picker instead."); cameraInputRef.current?.click(); }
  };
  const closeCamera = () => { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; } setCameraReady(false); setCameraOpen(false); };
  const captureFrame = () => {
    const video = videoRef.current;
    if (!hasRenderableCameraFrame(video)) { toast.error("The camera preview is not ready yet. Wait for a live frame or use Upload."); return; }
    if (!video) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => { if (!blob) return; const file = new File([blob], `field-capture-${Date.now()}.jpg`, { type: "image/jpeg" }); appendFiles([file]); closeCamera(); }, "image/jpeg", 0.92);
  };
  const runAnalysis = async () => {
    if (!staged.length) { toast.error("Capture or upload at least one label image."); return; }
    const images = await Promise.all(staged.map(async image => ({ name: image.file.name, contentType: image.file.type as "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif", data: image.data ?? await fileToBase64(image.file) })));
    mutation.mutate({ images, inspectorNotes: notes });
  };

  return <MetrologicShell eyebrow="Field capture station" title="New scan" actions={<span className="hidden border border-[#11120f]/15 bg-[#f7f6f0] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#66685f] sm:block"><span className="text-[#8a7600]">{String(staged.length).padStart(2, "0")}</span> / 06 images</span>}>
    <div className="space-y-8">
      <section className="scan-reveal hairline-heading"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777970]">02</span><div><p className="section-kicker">Evidence intake</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.045em]">Build the evidence set.</h2></div><span className="hidden font-mono text-[9px] uppercase tracking-[0.15em] text-[#777970] sm:block">Front panel + declaration panel</span></section>

      <section className="grid gap-6 lg:grid-cols-[1.16fr_.84fr]">
        <div className="scan-reveal paper-card motion-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#11120f]/15 p-5 sm:p-6"><div><p className="section-kicker">Image intake / station 01</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.055em]">Capture package evidence.</h2></div><div className="flex gap-2"><button onClick={openCamera} className="outline-button h-10 px-3"><Camera className="mr-2 h-3.5 w-3.5" />Camera</button><button onClick={() => inputRef.current?.click()} className="ink-button h-10 px-3"><Upload className="mr-2 h-3.5 w-3.5" />Upload</button></div></div>
          <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={event => event.target.files && appendFiles(event.target.files)} />
          <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={event => event.target.files && appendFiles(event.target.files)} />
          <div role="button" tabIndex={0} aria-label="Upload package-label images" onKeyDown={event => { if (!staged.length && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); inputRef.current?.click(); } }} onDragOver={event => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={event => { event.preventDefault(); setIsDragging(false); appendFiles(event.dataTransfer.files); }} onClick={() => !staged.length && inputRef.current?.click()} className={`m-5 grid min-h-[280px] place-items-center border-2 border-dashed p-6 text-center transition-colors sm:m-6 ${isDragging ? "border-[#8a7600] bg-[#eaffaa]" : "border-[#11120f]/20 bg-[#e5e4dc]"}`}>
            {staged.length ? <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">{staged.map((image, index) => <div key={image.id} className="group relative overflow-hidden border border-[#11120f]/15 bg-white"><img src={image.url} alt={`Staged package image ${index + 1}`} className="aspect-square w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#11120f]/90 px-2 py-1 text-[#f7f6f0]"><span className="truncate font-mono text-[9px] uppercase tracking-[0.08em]">{index + 1}. {image.file.name}</span><button onClick={event => { event.stopPropagation(); removeImage(image.id); }} aria-label="Remove image"><Trash2 className="h-3.5 w-3.5 text-[#ffd600]" /></button></div></div>)}{staged.length < 6 && <button onClick={event => { event.stopPropagation(); inputRef.current?.click(); }} className="grid aspect-square place-items-center border border-dashed border-[#11120f]/25 bg-[#f7f6f0] transition-colors hover:bg-[#eaffaa]"><ImagePlus className="h-6 w-6" /></button>}</div> : <div><div className="mx-auto grid h-14 w-14 place-items-center bg-[#ffd600] text-[#11120f]"><Upload className="h-5 w-5" /></div><h3 className="mt-5 font-display text-2xl font-semibold tracking-[-0.045em]">Drop label images here.</h3><p className="mx-auto mt-2 max-w-sm font-mono text-[11px] leading-relaxed text-[#62645b]">Front and back packaging works best. You can also capture a live camera frame. Images remain evidence attached to the inspection.</p><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#667600]">JPEG · PNG · WebP · HEIC · HEIF</p></div>}
          </div>
          <div className="border-t border-[#11120f]/15 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><label className="section-kicker">Opening notes <span className="normal-case tracking-normal">(optional)</span></label><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#9b9c92]">{notes.length} chars</span></div><Textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Initial inspection context, location, or observed issue…" className="mt-3 min-h-24 resize-y rounded-none border-[#11120f]/20 bg-white font-mono text-xs focus-visible:ring-[#b29a00]" /><button onClick={runAnalysis} disabled={!staged.length || mutation.isPending} className="signal-button mt-4 h-11 w-full disabled:cursor-not-allowed disabled:opacity-45">{mutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}{mutation.isPending ? "Gemini Vision is reading the label" : "Extract & inspect package"}<span className="ml-auto text-[9px] opacity-60">{staged.length}/6</span></button></div>
        </div>

        <aside className="scan-reveal ink-card motion-card relative overflow-hidden p-5 sm:p-7"><div className="pointer-events-none absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full border border-[#ffd600]/25" /><div className="relative"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center bg-[#ffd600] text-[#11120f]"><Video className="h-5 w-5" /></div><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#777970]">Protocol 07</span></div><p className="mt-10 section-kicker text-[#ffd600]">Evidence protocol</p><h2 className="mt-2 max-w-sm font-display text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#f7f6f0]">Make every declaration legible.</h2><ol className="mt-9 space-y-5">{["Photograph the front panel and the statutory declaration panel.", "Use focus and light to keep small text, dates, and MRP statements readable.", "Review red, amber, and green cards before committing official notes.", "Export or retain an official-style inspection report when complete."].map((text, index) => <li key={text} className="flex gap-3"><span className="grid h-5 w-5 shrink-0 place-items-center border border-[#ffd600]/70 font-mono text-[9px] text-[#ffd600]">0{index + 1}</span><p className="font-mono text-[11px] leading-relaxed text-[#c2c3b9]">{text}</p></li>)}</ol></div></aside>
      </section>

      {result && <div className="mt-9"><InspectionDetail record={result} onClose={() => setResult(null)} /></div>}
    </div>

    {cameraOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#11120f]/85 p-4"><div className="w-full max-w-3xl border border-white/20 bg-[#11120f] p-4 text-white shadow-[10px_10px_0_#ffd600]"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffd600]">Live camera capture</p><button onClick={closeCamera} aria-label="Close camera"><X className="h-5 w-5" /></button></div><video ref={node => { videoRef.current = node; if (node) bindCameraStream(node, streamRef.current); }} autoPlay muted playsInline onLoadedMetadata={() => { bindCameraStream(videoRef.current, streamRef.current); setCameraReady(hasRenderableCameraFrame(videoRef.current)); }} onCanPlay={() => { bindCameraStream(videoRef.current, streamRef.current); setCameraReady(hasRenderableCameraFrame(videoRef.current)); }} onPlaying={() => setCameraReady(true)} className="mt-4 aspect-video w-full bg-black object-cover" /><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">{cameraReady ? "Live preview ready" : "Starting live preview…"}</p><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={closeCamera} className="rounded-none border-white/30 bg-transparent font-mono text-[10px] uppercase tracking-[0.14em] text-white hover:bg-white hover:text-[#11120f]">Cancel</Button><Button onClick={captureFrame} className="rounded-none bg-[#ffd600] font-mono text-[10px] uppercase tracking-[0.14em] text-[#11120f]"><Camera className="mr-2 h-3.5 w-3.5" />Capture frame</Button></div></div></div>}
  </MetrologicShell>;
}
