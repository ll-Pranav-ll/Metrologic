import { cn } from "@/lib/utils";
import { History, LayoutDashboard, Menu, ScanLine, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { animate, stagger } from "animejs";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "New Scan", path: "/scan", icon: ScanLine },
  { label: "Scan History", path: "/history", icon: History },
];

function KineticLineMotif() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(".kinetic-line", { strokeDashoffset: [64, 0], delay: stagger(85), duration: 760, ease: "outExpo" });
  }, []);
  return <svg aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden h-16 w-56 -translate-y-1/2 opacity-45 sm:block" viewBox="0 0 224 64" fill="none"><path className="kinetic-line" d="M4 46C39 46 45 18 80 18S119 46 150 46 184 18 220 18" stroke="#81ad00" strokeWidth="1" strokeDasharray="8 8" /><path className="kinetic-line" d="M4 54C44 54 46 28 82 28s38 26 70 26 32-26 68-26" stroke="#12130f" strokeWidth="1" strokeDasharray="4 7" /></svg>;
}

export function MetrologicShell({ children, eyebrow, title, actions }: { children: ReactNode; eyebrow: string; title: string; actions?: ReactNode }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const move = (path: string) => { navigate(path); setOpen(false); };

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-[#12130f]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col bg-[#11120f] p-5 text-[#f3f2ed] transition-transform duration-300 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <button onClick={() => move("/")} className="group flex items-center gap-3 text-left" aria-label="Go to Dashboard">
          <div className="grid h-10 w-10 place-items-center bg-[#c8ff00] text-[#11120f] shadow-[5px_5px_0_#5c6f00] transition-transform duration-150 group-active:scale-[0.96]">
            <span className="font-mono text-lg font-black">M</span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#c8ff00]">Field bureau</p>
            <p className="font-serif text-xl tracking-tight">Metrologic</p>
          </div>
        </button>
        <div className="mt-12 space-y-1">
          {navigation.map(item => {
            const active = location === item.path;
            return <button key={item.path} onClick={() => move(item.path)} className={cn("group flex w-full items-center gap-3 px-3 py-3 text-left font-mono text-xs uppercase tracking-[0.15em] transition-colors", active ? "bg-[#c8ff00] text-[#11120f]" : "text-[#b9bab1] hover:bg-white/10 hover:text-white")}>
              <item.icon className="h-4 w-4" />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#11120f]" />}
            </button>;
          })}
        </div>
        <div className="mt-auto border-t border-white/15 pt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#8d8f84]">
          <p>Legal metrology</p>
          <p className="mt-1 text-[#c8ff00]">Inspector workspace / 01</p>
        </div>
      </aside>

      <div className="lg:pl-[286px]">
        <header className="relative sticky top-0 z-40 flex min-h-20 items-center justify-between overflow-hidden border-b border-[#161714]/15 bg-[#f3f2ed]/90 px-4 py-3 backdrop-blur-md sm:px-7 lg:px-10">
          <KineticLineMotif />
          <div className="relative z-10 flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center border border-[#12130f]/20 bg-[#f7f6f1] lg:hidden" aria-label="Open navigation">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6d7068]">{eyebrow}</p>
              <h1 className="font-serif text-2xl leading-none tracking-tight sm:text-3xl">{title}</h1>
            </div>
          </div>
          {actions && <div className="relative z-10 flex items-center gap-2">{actions}</div>}
        </header>
        <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#11120f]/15 bg-[#f7f6f1] px-2 py-2 lg:hidden">
        {navigation.map(item => {
          const active = location === item.path;
          return <button key={item.path} onClick={() => move(item.path)} className={cn("flex flex-col items-center gap-1 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em]", active ? "text-[#11120f]" : "text-[#7d8078]")}>
            <item.icon className={cn("h-4 w-4", active && "text-[#76a800]")} />
            {item.label}
          </button>;
        })}
      </nav>
    </div>
  );
}
