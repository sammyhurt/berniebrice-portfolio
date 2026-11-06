import ArrowRight from "@iconify-react/solar/arrow-right-linear";
import Moon from "@iconify-react/solar/moon-linear";
import Sun from "@iconify-react/solar/sun-2-linear";
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
  { to: "/#experience", label: "Experience" },
  { to: "/#skills", label: "Skills" },
  { to: "/resume", label: "Resume" },
];

export function Header() {
  return (
    <header className="no-print border-border/70 bg-background/85 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <A to="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="Bernie Brice, home">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-xs font-bold">{profile.initials}</span>
          <span className="hidden sm:inline">{profile.name}</span>
        </A>
        <nav className="ml-auto flex items-center gap-0.5 text-sm" aria-label="Main">
          {NAV.map((n) => (
            <A key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full px-2.5 py-1.5 sm:px-3">
              {n.label}
            </A>
          ))}
          <A to="/#contact" className="bg-primary text-primary-foreground ml-1 hidden rounded-full px-3.5 py-1.5 font-medium sm:inline-block">
            Contact
          </A>
        </nav>
        <ThemeButton />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="no-print border-border mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-8 text-sm sm:px-6">
        <span>
          {profile.name} · {profile.location}
        </span>
        <a className="hover:text-foreground" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <a className="hover:text-foreground inline-flex items-center gap-1.5" href={profile.linkedin} target="_blank" rel="noreferrer">
          <LinkedInIcon /> LinkedIn
        </a>
        <span className="ml-auto text-xs">Diagrams are simplified and generalized. No employer addresses, hostnames or data are shown.</span>
      </div>
    </footer>
  );
}

export function Section({ id, eyebrow, title, lead, children, className }: { id?: string; eyebrow: string; title: string; lead?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6", className)}>
      <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {lead ? <p className="text-muted-foreground mt-2 max-w-2xl">{lead}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** A simple left-to-right diagram (top-to-bottom on phones). Generic labels only. */
export function FlowDiagram({ flow, className }: { flow: FlowT; className?: string }) {
  return (
    <figure className={cn("border-border bg-card rounded-2xl border p-4 sm:p-5", className)}>
      <ol className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {flow.nodes.map((n, i) => (
          <li key={n} className="flex flex-col items-center gap-2 sm:flex-1 sm:flex-row">
            <span className="bg-secondary text-secondary-foreground w-full rounded-xl px-3 py-2.5 text-center text-sm font-medium sm:min-h-14 sm:place-content-center">{n}</span>
            {i < flow.nodes.length - 1 ? <ArrowRight className="text-muted-foreground size-4 shrink-0 rotate-90 sm:rotate-0" aria-hidden /> : null}
          </li>
        ))}
      </ol>
      <figcaption className="text-muted-foreground mt-3 text-xs">{flow.caption}</figcaption>
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
