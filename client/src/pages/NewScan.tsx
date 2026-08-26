import { InspectionDetail } from "@/components/InspectionDetail";
import { MetrologicShell } from "@/components/MetrologicShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { bindCameraStream } from "@/lib/camera";
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch { toast.error("Camera access is unavailable. Use the image picker instead."); cameraInputRef.current?.click(); }
  };
  const closeCamera = () => { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; setCameraOpen(false); };
  const captureFrame = () => {
    const video = videoRef.current; if (!video) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => { if (!blob) return; const file = new File([blob], `field-capture-${Date.now()}.jpg`, { type: "image/jpeg" }); appendFiles([file]); closeCamera(); }, "image/jpeg", 0.92);
  };
  const runAnalysis = async () => {
    if (!staged.length) { toast.error("Capture or upload at least one label image."); return; }
    const images = await Promise.all(staged.map(async image => ({ name: image.file.name, contentType: image.file.type as "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif", data: image.data ?? await fileToBase64(image.file) })));
    mutation.mutate({ images, inspectorNotes: notes });
  };
  return <MetrologicShell eyebrow="Field capture station" title="New Scan" actions={<span className="hidden border border-[#11120f]/15 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6e7068] sm:block">{staged.length}/6 images</span>}>
    <section className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
      <div className="scan-reveal overflow-hidden border border-[#11120f]/15 bg-[#fbfaf6] shadow-[10px_10px_0_rgba(17,18,15,0.1)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#11120f]/15 p-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#697066]">Image intake</p><h2 className="mt-1 font-serif text-3xl">Capture package evidence.</h2></div><div className="flex gap-2"><Button onClick={openCamera} variant="outline" className="rounded-none border-[#11120f]/20 font-mono text-[10px] uppercase tracking-[0.13em]"><Camera className="mr-2 h-3.5 w-3.5" />Camera</Button><Button onClick={() => inputRef.current?.click()} className="rounded-none bg-[#11120f] font-mono text-[10px] uppercase tracking-[0.13em] text-[#c8ff00] hover:bg-[#2b2c25]"><Upload className="mr-2 h-3.5 w-3.5" />Upload</Button></div></div>
        <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={event => event.target.files && appendFiles(event.target.files)} />
        <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={event => event.target.files && appendFiles(event.target.files)} />
        <div role="button" tabIndex={0} aria-label="Upload package-label images" onKeyDown={event => { if (!staged.length && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); inputRef.current?.click(); } }} onDragOver={event => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={event => { event.preventDefault(); setIsDragging(false); appendFiles(event.dataTransfer.files); }} onClick={() => !staged.length && inputRef.current?.click()} className={`m-5 grid min-h-[280px] place-items-center border-2 border-dashed p-6 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7ca900] ${isDragging ? "border-[#7ca900] bg-[#efffd8]" : "border-[#11120f]/20 bg-[#f0efe9]"}`}>
          {staged.length ? <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">{staged.map((image, index) => <div key={image.id} className="group relative overflow-hidden border border-[#11120f]/15 bg-white"><img src={image.url} alt={`Staged package image ${index + 1}`} className="aspect-square w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#11120f]/85 px-2 py-1 text-[#f7f6f1]"><span className="truncate font-mono text-[9px] uppercase tracking-[0.08em]">{index + 1}. {image.file.name}</span><button onClick={event => { event.stopPropagation(); removeImage(image.id); }} aria-label="Remove image"><Trash2 className="h-3.5 w-3.5 text-[#c8ff00]" /></button></div></div>)}<button onClick={event => { event.stopPropagation(); inputRef.current?.click(); }} className="grid aspect-square place-items-center border border-dashed border-[#11120f]/25 bg-white hover:bg-[#e8ffd4]"><ImagePlus className="h-6 w-6" /></button></div> : <div><div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#11120f]/20 bg-[#fbfaf6]"><Upload className="h-5 w-5" /></div><h3 className="mt-4 font-serif text-2xl">Drop label images here</h3><p className="mt-2 max-w-sm font-mono text-[11px] leading-relaxed text-[#6c6e66]">Front and back packaging works best. You can also capture a live camera frame. Images remain evidence attached to the inspection.</p><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#668400]">JPEG · PNG · WebP · HEIC · HEIF</p></div>}
        </div>
        <div className="border-t border-[#11120f]/15 p-5"><label className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#6c6e66]">Opening notes <span className="normal-case tracking-normal">(optional)</span></label><Textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Initial inspection context, location, or observed issue…" className="mt-2 min-h-24 rounded-none border-[#11120f]/20 bg-white font-mono text-xs focus-visible:ring-[#8db800]" /><Button onClick={runAnalysis} disabled={!staged.length || mutation.isPending} className="mt-4 w-full rounded-none bg-[#c8ff00] font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#11120f] hover:bg-[#b7e800]">{mutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}{mutation.isPending ? "Gemini Vision is reading the label" : "Extract & inspect package"}</Button></div>
      </div>
      <aside className="scan-reveal border border-[#11120f]/15 bg-[#11120f] p-5 text-[#f3f2ec]"><Video className="h-5 w-5 text-[#c8ff00]" /><p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[#c8ff00]">Evidence protocol</p><h2 className="mt-2 font-serif text-3xl leading-none">Make every declaration legible.</h2><ol className="mt-7 space-y-5">{["Photograph the front panel and the statutory declaration panel.", "Use focus and light to keep small text, dates, and MRP statements readable.", "Review red, amber, and green cards before committing official notes.", "Export or retain an official-style inspection report when complete."].map((text, index) => <li key={text} className="flex gap-3"><span className="grid h-5 w-5 shrink-0 place-items-center border border-[#c8ff00]/60 font-mono text-[9px] text-[#c8ff00]">0{index + 1}</span><p className="font-mono text-[11px] leading-relaxed text-[#c7c9be]">{text}</p></li>)}</ol></aside>
    </section>
    {result && <div className="mt-9"><InspectionDetail record={result} onClose={() => setResult(null)} /></div>}
    {cameraOpen && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#11120f]/85 p-4"><div className="w-full max-w-3xl border border-white/20 bg-[#11120f] p-4 text-white shadow-[10px_10px_0_#c8ff00]"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#c8ff00]">Live camera capture</p><button onClick={closeCamera}><X className="h-5 w-5" /></button></div><video ref={videoRef} autoPlay muted playsInline onLoadedMetadata={() => bindCameraStream(videoRef.current, streamRef.current)} className="mt-4 aspect-video w-full bg-black object-cover" /><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={closeCamera} className="rounded-none border-white/30 bg-transparent font-mono text-[10px] uppercase tracking-[0.14em] text-white hover:bg-white hover:text-[#11120f]">Cancel</Button><Button onClick={captureFrame} className="rounded-none bg-[#c8ff00] font-mono text-[10px] uppercase tracking-[0.14em] text-[#11120f]"><Camera className="mr-2 h-3.5 w-3.5" />Capture frame</Button></div></div></div>}
  </MetrologicShell>;
}
