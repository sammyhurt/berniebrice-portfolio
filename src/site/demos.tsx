import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { A, Reveal, Section } from "./parts";

/** Screen recordings of working demos. Built with sample data only. */
type Demo = { slug: string; title: string; summary: string; points: string[]; stack: string[]; study?: string; length: string };
const DEMOS: Demo[] = [
  {
    slug: "triage-demo",
    title: "AI IT ticket triage",
    summary: "A support request comes in, AI classifies it and suggests first steps, and rule checks decide whether it routes automatically or waits for a person.",
    points: [
      "AI suggests category, priority and three troubleshooting steps",
      "Rule checks override the AI: security, patient data and access changes always need approval",
      "Every ticket is logged with team and status",
    ],
    stack: ["n8n", "LLM API", "Form trigger", "Rule engine (JS)", "Data tables"],
    study: "automation-platform",
    length: "0:45",
  },
];

const m = (f: string) => `/media/${f}`;

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#1f2016] shadow-[0_24px_50px_-24px_rgba(47,48,32,0.6)] ring-1 ring-black/40 dark:ring-white/15">
      <div aria-hidden className="flex items-center gap-1.5 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#d96846]" />
        <span className="size-2.5 rounded-full bg-[#cdcbd6]/60" />
        <span className="size-2.5 rounded-full bg-[#596235]" />
        <span className="ml-3 h-5 flex-1 rounded-full bg-white/8" />
      </div>
      <div className="relative aspect-video bg-black">{children}</div>
    </div>
  );
}

function LoopPreview({ demo }: { demo: Demo }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.src) v.src = v.dataset.src || "";
        v.play().catch(() => {});
      } else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} data-src={m(`${demo.slug}-loop.mp4`)} poster={m(`${demo.slug}.jpg`)} muted loop playsInline preload="none" aria-hidden className="h-full w-full object-cover" />;
}

function Player({ demo, onClose }: { demo: Demo; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = o;
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={demo.title} className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f3020]/92 p-3 backdrop-blur-sm sm:p-8" onClick={onClose}>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="bg-background/90 text-foreground absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full shadow-md">
        <X className="size-5" />
      </button>
      <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <BrowserFrame>
          <video src={m(`${demo.slug}.mp4`)} poster={m(`${demo.slug}.jpg`)} autoPlay muted playsInline controls controlsList="nodownload noplaybackrate" disablePictureInPicture className="h-full w-full bg-black" />
        </BrowserFrame>
        <p className="mt-4 text-center font-semibold text-[#f3f2f6]">{demo.title}</p>
      </div>
    </div>
  );
}

function DemoCard({ demo, compact }: { demo: Demo; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={compact ? "grid gap-6" : "grid items-center gap-8 lg:grid-cols-12 lg:gap-12"}>
      <Reveal className={compact ? "" : "lg:col-span-7"}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`Play ${demo.title} demo`} className="group block w-full text-left">
          <BrowserFrame>
            <LoopPreview demo={demo} />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg sm:gap-2 sm:px-5 sm:py-3 sm:text-sm transition-transform group-hover:scale-105">
                <Play className="size-3.5 fill-current sm:size-4" /> Watch demo · {demo.length}
              </span>
            </span>
          </BrowserFrame>
        </button>
      </Reveal>
      <Reveal delay={0.06} className={compact ? "" : "lg:col-span-5"}>
        {compact ? null : <h3 className="text-3xl font-semibold tracking-tight">{demo.title}</h3>}
        <p className={compact ? "leading-relaxed" : "mt-4 text-lg leading-relaxed"}>{demo.summary}</p>
        <ul className="mt-5 space-y-2.5">
          {demo.points.map((p) => (
            <li key={p} className="flex gap-3 leading-snug">
              <span aria-hidden className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
              {p}
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Built with">
          {demo.stack.map((s) => (
            <li key={s} className="bg-muted rounded-full px-3 py-1.5 text-sm font-medium">{s}</li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-5 text-sm">Built and recorded with sample data. No real tickets or credentials shown.</p>
        {!compact && demo.study ? (
          <A to={`/work/${demo.study}`} className="text-primary mt-4 inline-block font-semibold underline-offset-4 hover:underline">
            Related case study →
          </A>
        ) : null}
      </Reveal>
      {open ? <Player demo={demo} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

export function ScreenDemos() {
  return (
    <Section id="demos" eyebrow="Screen demos · AI automation" title="See it run">
      <div className="space-y-20">
        {DEMOS.map((d) => (
          <DemoCard key={d.slug} demo={d} />
        ))}
      </div>
    </Section>
  );
}

/** Demos linked to a case study. */
export function StudyDemos({ slug }: { slug: string }) {
  const list = DEMOS.filter((d) => d.study === slug);
  if (!list.length) return null;
  return (
    <section aria-label="Demo" className="mt-14">
      <p className="text-primary font-mono text-xs tracking-[0.18em] uppercase">Screen demo · sample data</p>
      <h2 className="mt-3 mb-8 text-3xl font-semibold tracking-tight">{list[0].title}</h2>
      {list.map((d) => (
        <DemoCard key={d.slug} demo={d} compact />
      ))}
    </section>
  );
}
