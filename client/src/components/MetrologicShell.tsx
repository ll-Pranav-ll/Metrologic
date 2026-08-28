import { cn } from "@/lib/utils";
import { History, LayoutDashboard, Menu, ScanLine, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation } from "wouter";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, index: "01" },
  { label: "New scan", path: "/scan", icon: ScanLine, index: "02" },
  { label: "Scan history", path: "/history", icon: History, index: "03" },
];

function SignalMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={cn("relative block h-5 w-6", inverse ? "text-[#11120f]" : "text-[#ffd600]")} aria-hidden="true">
      <span className="absolute left-0 top-1 h-[3px] w-3 -skew-x-12 bg-current" />
      <span className="absolute left-2 top-2.5 h-[3px] w-4 -skew-x-12 bg-current" />
      <span className="absolute right-0 top-4 h-[3px] w-2 -skew-x-12 bg-current" />
    </span>
  );
}

function SignalLines({ reduced }: { reduced: boolean | null }) {
  return (
    <motion.svg aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden h-16 w-72 -translate-y-1/2 opacity-70 sm:block" viewBox="0 0 288 64" fill="none">
      <motion.path d="M4 44h34c22 0 24-24 48-24h26c22 0 28 24 52 24h20c26 0 31-24 58-24h42" stroke="#a58a00" strokeWidth="1.2" strokeDasharray="3 7" initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      <motion.path d="M4 54h40c17 0 24-17 47-17h20c24 0 30 17 54 17h17c22 0 28-17 51-17h38" stroke="#66705e" strokeWidth="1" strokeDasharray="2 8" initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.75 }} transition={{ duration: 1.05, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} />
    </motion.svg>
  );
}

export function MetrologicShell({ children, eyebrow, title, actions }: { children: ReactNode; eyebrow: string; title: string; actions?: ReactNode }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const move = (path: string) => { navigate(path); setOpen(false); };
  const transition = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.75 };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#ecebe4] text-[#171813]">
      <AnimatePresence>
        {open && <motion.button aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-[#11120f]/65 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />}
      </AnimatePresence>

      <motion.aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/10 bg-[#11120f] p-5 text-[#f5f4ed] shadow-[14px_0_48px_rgba(17,18,15,.16)] lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")} initial={reduced ? false : { x: -22, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={transition}>
        <motion.button onClick={() => move("/")} whileTap={reduced ? undefined : { scale: 0.98 }} className="group flex items-center gap-3 text-left" aria-label="Go to Dashboard">
          <div className="grid h-10 w-10 place-items-center bg-[#ffd600] text-[#11120f] shadow-[5px_5px_0_rgba(255,214,0,.18)]"><SignalMark inverse /></div>
          <div><p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#ffd600]">Field bureau</p><p className="font-display text-xl font-semibold tracking-[-0.04em]">Metrologic</p></div>
        </motion.button>

        <div className="mt-14">
          <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#6f7168]">Workspace</p>
          <div className="space-y-1">
            {navigation.map(item => {
              const active = location === item.path;
              return <motion.button key={item.path} onClick={() => move(item.path)} whileHover={reduced ? undefined : { x: 3 }} whileTap={reduced ? undefined : { scale: 0.985 }} className={cn("relative flex w-full items-center gap-3 overflow-hidden px-3 py-3 text-left font-mono text-[10px] uppercase tracking-[0.13em]", active ? "bg-[#ffd600] text-[#11120f]" : "text-[#a9aaa0] hover:bg-white/[0.06] hover:text-[#f5f4ed]")}>
                {active && <motion.span layoutId="active-navigation" className="absolute inset-y-0 right-0 w-1 bg-[#11120f]" transition={transition} />}
                <span className={cn("text-[9px]", active ? "text-[#11120f]/60" : "text-[#6f7168]")}>{item.index}</span>
                <item.icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{item.label}</span>
              </motion.button>;
            })}
          </div>
        </div>

        <div className="mt-auto border-t border-white/10 pt-5"><div className="flex items-center gap-2"><SignalMark /><p className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#ffd600]">Evidence first</p></div><p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6f7168]">Legal metrology / 01</p><p className="mt-1 max-w-[180px] font-mono text-[10px] leading-relaxed text-[#a9aaa0]">Capture. Examine. Retain.</p></div>
      </motion.aside>

      <div className="lg:pl-[264px]">
        <header className="relative sticky top-0 z-30 flex min-h-20 items-center justify-between overflow-hidden border-b border-[#11120f]/15 bg-[#ecebe4]/90 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-10">
          <SignalLines reduced={reduced} />
          <div className="relative z-10 flex items-center gap-3"><motion.button onClick={() => setOpen(!open)} whileTap={reduced ? undefined : { scale: 0.92 }} className="grid h-10 w-10 place-items-center border border-[#11120f]/15 bg-[#f7f6f0] text-[#171813] lg:hidden" aria-label="Open navigation">{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</motion.button><div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#777970]">{eyebrow}</p><h1 className="font-display text-2xl leading-none tracking-[-0.045em] sm:text-3xl">{title}</h1></div></div>
          {actions && <div className="relative z-10 flex items-center gap-2">{actions}</div>}
        </header>
        <AnimatePresence mode="wait" initial={false}>
          <motion.main key={location} className="paper-grid mx-auto min-h-[calc(100vh-5rem)] max-w-[1600px] px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>{children}</motion.main>
        </AnimatePresence>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[#11120f] px-2 py-2 lg:hidden">
        {navigation.map(item => { const active = location === item.path; return <motion.button key={item.path} onClick={() => move(item.path)} whileTap={reduced ? undefined : { scale: 0.95 }} className={cn("relative flex flex-col items-center gap-1 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em]", active ? "text-[#ffd600]" : "text-[#777970]")}><item.icon className="h-4 w-4" />{item.label}{active && <motion.span layoutId="active-mobile-navigation" className="absolute -top-2 h-0.5 w-8 bg-[#ffd600]" transition={transition} />}</motion.button>; })}
      </nav>
    </div>
  );
}
