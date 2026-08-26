import { cn } from "@/lib/utils";
import { History, LayoutDashboard, Menu, ScanLine, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation } from "wouter";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "New Scan", path: "/scan", icon: ScanLine },
  { label: "Scan History", path: "/history", icon: History },
];

function SignalLines({ reduced }: { reduced: boolean | null }) {
  return (
    <motion.svg aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden h-20 w-72 -translate-y-1/2 opacity-80 sm:block" viewBox="0 0 288 80" fill="none">
      <motion.path d="M8 54C48 54 52 22 96 22s46 32 88 32 42-32 96-32" stroke="#8bffb2" strokeWidth="1.4" strokeDasharray="5 9" initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: .9, ease: [0.16, 1, .3, 1] }} />
      <motion.path d="M8 66C50 66 62 36 104 36s44 30 86 30 42-30 90-30" stroke="#8f7cff" strokeWidth="1" strokeDasharray="2 7" initial={reduced ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: .7 }} transition={{ duration: 1.2, delay: .12, ease: [0.16, 1, .3, 1] }} />
    </motion.svg>
  );
}

export function MetrologicShell({ children, eyebrow, title, actions }: { children: ReactNode; eyebrow: string; title: string; actions?: ReactNode }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const move = (path: string) => { navigate(path); setOpen(false); };
  const transition = { type: "spring" as const, stiffness: 320, damping: 30, mass: .75 };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0d14] text-slate-100">
      <AnimatePresence>
        {open && <motion.button aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-slate-950/72 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />}
      </AnimatePresence>
      <motion.aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[#0c111a]/90 p-5 shadow-[16px_0_60px_rgba(0,0,0,.3)] backdrop-blur-xl lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}
        initial={reduced ? false : { x: -22, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={transition}>
        <motion.button onClick={() => move("/")} whileTap={reduced ? undefined : { scale: .98 }} className="group flex items-center gap-3 text-left" aria-label="Go to Dashboard">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#8bffb2] to-[#58dfff] text-[#071017] shadow-[0_0_30px_rgba(139,255,178,.25)]"><span className="font-serif text-lg font-black">M</span></div>
          <div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#8bffb2]">Field bureau</p><p className="font-serif text-xl font-semibold">Metrologic</p></div>
        </motion.button>
        <div className="mt-12 space-y-1.5">
          {navigation.map(item => {
            const active = location === item.path;
            return <motion.button key={item.path} onClick={() => move(item.path)} whileHover={reduced ? undefined : { x: 3 }} whileTap={reduced ? undefined : { scale: .985 }} className={cn("relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[.12em]", active ? "text-[#05120d]" : "text-slate-400 hover:text-slate-100")}>
              {active && <motion.span layoutId="active-navigation" className="absolute inset-0 rounded-xl bg-[#8bffb2]" transition={transition} />}
              <item.icon className="relative z-10 h-4 w-4" /> <span className="relative z-10">{item.label}</span>{active && <motion.span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-[#05120d]" initial={reduced ? false : { scale: 0 }} animate={{ scale: 1 }} />}
            </motion.button>;
          })}
        </div>
        <div className="mt-auto border-t border-white/10 pt-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">Legal metrology</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#8bffb2]">Inspector workspace / 01</p></div>
      </motion.aside>

      <div className="lg:pl-[280px]">
        <header className="relative sticky top-0 z-30 flex min-h-20 items-center justify-between overflow-hidden border-b border-white/10 bg-[#0a0d14]/72 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-10">
          <SignalLines reduced={reduced} />
          <div className="relative z-10 flex items-center gap-3"><motion.button onClick={() => setOpen(!open)} whileTap={reduced ? undefined : { scale: .92 }} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-100 lg:hidden" aria-label="Open navigation">{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</motion.button><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-slate-500">{eyebrow}</p><h1 className="font-serif text-2xl leading-none text-slate-50 sm:text-3xl">{title}</h1></div></div>
          {actions && <div className="relative z-10 flex items-center gap-2">{actions}</div>}
        </header>
        <AnimatePresence mode="wait" initial={false}>
          <motion.main key={location} className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10" initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduced ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }} transition={{ duration: .34, ease: [0.16, 1, .3, 1] }}>{children}</motion.main>
        </AnimatePresence>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[#0c111a]/92 px-2 py-2 backdrop-blur-xl lg:hidden">
        {navigation.map(item => { const active = location === item.path; return <motion.button key={item.path} onClick={() => move(item.path)} whileTap={reduced ? undefined : { scale: .95 }} className={cn("relative flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 font-mono text-[9px] uppercase tracking-[.08em]", active ? "text-[#8bffb2]" : "text-slate-500")}><item.icon className="h-4 w-4" />{item.label}{active && <motion.span layoutId="active-mobile-navigation" className="absolute -bottom-1 h-0.5 w-8 rounded-full bg-[#8bffb2]" transition={transition} />}</motion.button>; })}
      </nav>
    </div>
  );
}
