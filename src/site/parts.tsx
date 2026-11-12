import ArrowRight from "@iconify-react/solar/arrow-right-linear";
import Moon from "@iconify-react/solar/moon-linear";
import Sun from "@iconify-react/solar/sun-2-linear";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { profile, type Flow as FlowT } from "./data";

/* ---------- tiny router (history API; Netlify serves index.html for every path) ---------- */
export function usePath() {
  const [path, setPath] = useState(location.pathname + location.hash);
  useEffect(() => {
    const on = () => setPath(location.pathname + location.hash);
    addEventListener("popstate", on);
    return () => removeEventListener("popstate", on);
  }, []);
  return path;
}
export function go(to: string) {
  const [p, h] = to.split("#");
  const keep = location.search;
  if (p && p !== location.pathname) {
    history.pushState(null, "", p + keep + (h ? "#" + h : ""));
    dispatchEvent(new PopStateEvent("popstate"));
    if (!h) scrollTo({ top: 0 });
  } else if (h) history.replaceState(null, "", location.pathname + keep + "#" + h);
  if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
}
export function A({ to, className, children, ...rest }: { to: string; className?: string; children: ReactNode; "aria-label"?: string }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function ThemeButton() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  return (
    <button
      type="button"
      className="hover:bg-muted text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-full"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        const d = !dark;
        setDark(d);
        document.documentElement.classList.toggle("dark", d);
        try {
          localStorage.setItem("theme", d ? "dark" : "light");
        } catch {
          /* fine */
        }
      }}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

const NAV = [
  { to: "/#work", label: "Work" },
  { to: "/#on-site", label: "On site" },
  { to: "/#demos", label: "Demos" },
  { to: "/#experience", label: "Experience" },
  { to: "/#skills", label: "Skills" },
  { to: "/#about", label: "About" },
  { to: "/resume", label: "Resume" },
];

/** Floating pill header from the template. */
export function Header() {
  return (
    <header style={{ top: "var(--banner-h, 0px)" }} className="no-print fixed inset-x-0 z-40 transition-[top] duration-300 flex items-center justify-between gap-2 px-3 py-4 sm:px-8 lg:px-11">
      <A to="/" className="glass-light bg-background/85 rounded-full px-4 py-2 text-sm font-bold tracking-tight shadow-sm backdrop-blur" aria-label="Bernie Brice, home">
        {profile.name}
      </A>
      <nav aria-label="Primary" className="glass-light bg-background/85 hidden items-center gap-1 rounded-full p-1 shadow-sm backdrop-blur md:flex">
        {NAV.map((n) => (
          <A key={n.to} to={n.to} className="text-foreground/80 hover:bg-muted hover:text-foreground rounded-full px-4 py-1.5 text-sm font-medium transition-colors">
            {n.label}
          </A>
        ))}
      </nav>
      <div className="flex items-center gap-1.5">
        <div className="glass-light bg-background/85 rounded-full shadow-sm backdrop-blur">
          <ThemeButton />
        </div>
        <A to="/#contact" className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]">
          Contact
        </A>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="no-print">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-8 text-sm sm:px-8 lg:px-11">
        <span>
          {profile.name} · {profile.location}
        </span>
        <a className="hover:text-foreground inline-flex min-h-11 items-center" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <a className="hover:text-foreground inline-flex min-h-11 items-center gap-1.5" href={profile.linkedin} target="_blank" rel="noreferrer">
          <LinkedInIcon /> LinkedIn
        </a>
        <span className="ml-auto grid gap-1 text-xs sm:text-right">
          <span>Diagrams are simplified and generalized. No employer addresses, hostnames or data are shown.</span>
          <A to="/privacy" className="hover:text-foreground inline-flex min-h-11 items-center underline-offset-4 hover:underline sm:min-h-0 sm:justify-end">
            Privacy
          </A>
        </span>
      </div>
    </footer>
  );
}

/** Fade-up on scroll, as in the template. Respects reduced motion. */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export function Section({ id, eyebrow, title, lead, children, className }: { id?: string; eyebrow: string; title: string; lead?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-20 px-5 py-20 sm:px-8 lg:px-11 lg:py-28", className)}>
      <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-primary font-mono text-xs tracking-[0.18em] uppercase">{eyebrow}</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h2>
        </div>
        {lead ? <p className="text-muted-foreground max-w-sm">{lead}</p> : null}
      </Reveal>
      {children}
    </section>
  );
}

/** A simple left-to-right diagram (top-to-bottom on phones). Generic labels only. */
export function FlowDiagram({ flow, className }: { flow: FlowT; className?: string }) {
  return (
    <figure className={cn("bg-card rounded-[1.75rem] p-4 shadow-sm sm:p-6", className)}>
      <ol className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {flow.nodes.map((n, i) => (
          <li key={n} className="flex flex-col items-center gap-2 sm:flex-1 sm:flex-row">
            <span className="bg-secondary text-secondary-foreground grid w-full place-content-center rounded-2xl px-3 py-3 text-center text-sm font-medium sm:min-h-16">{n}</span>
            {i < flow.nodes.length - 1 ? <ArrowRight className="text-muted-foreground size-4 shrink-0 rotate-90 sm:rotate-0" aria-hidden /> : null}
          </li>
        ))}
      </ol>
      <figcaption className="text-muted-foreground mt-3 font-mono text-[11px] tracking-[0.12em] uppercase">{flow.caption}</figcaption>
    </figure>
  );
}

export function Chip({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "primary" | "ok"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "primary" ? "bg-primary/10 text-primary" : tone === "ok" ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
