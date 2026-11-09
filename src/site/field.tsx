import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Reveal, Section } from "./parts";

/**
 * On-the-job clips and rack photos. Captions describe only what is visible.
 * All clips are silent. Third-party signage, device labels and location data were removed before upload.
 */
type Clip = { slug: string; title: string; caption: string };
const CLIPS: Clip[] = [
  { slug: "finished-rack", title: "Finished rack", caption: "Patch panels, switching, NVR and power, labeled and dressed." },
  { slug: "repatch", title: "Re-patching a busy rack", caption: "Tracing, re-patching and dressing cables in a crowded rack." },
  { slug: "patch-panel", title: "Patch panel install", caption: "Mounting and patching 24-port panels in a wall rack." },
  { slug: "wall-rack", title: "Wall rack build", caption: "Mounting gear and managing cable runs in a wall-mounted rack." },
  { slug: "firewall", title: "Firewall setup", caption: "Registering and configuring a SonicWall TZ470 from a laptop." },
  { slug: "server-room", title: "Server room walkthrough", caption: "Racks, servers, patching and power in an equipment room." },
];

type Photo = { slug: string; alt: string; wide?: boolean };
const PHOTOS: Photo[] = [
  { slug: "rack-4", alt: "Wall rack: 72 patch ports, two switches, UDM Pro router and UPS, with numbered rack units" },
  { slug: "rack-1", alt: "Open wall rack: NVR, 24-port patch panel, switch, UDM Pro router, UPS, modem and mini PC" },
  { slug: "rack-3", alt: "Wall rack: 96 patch ports across three labeled switches, UDM Pro router, PDU and fiber uplinks" },
  { slug: "rack-2", alt: "Wall cabinet: recorder, 48 patch ports, switch, UDM Pro router and UPS" },
  { slug: "rack-8", alt: "Patch panels and switch above a SonicWall firewall", wide: true },
  { slug: "rack-5", alt: "Rack enclosure: patch panels, switch, UDM Pro router, mini PC, cable modem, power center and NVR" },
  { slug: "rack-7", alt: "Open rack: patch panels, switch, UDM Pro router, mini PC, modem, NVR and PDU" },
  { slug: "rack-6", alt: "Corner wall rack: patch panels, switch, fiber uplink and PDU" },
];

const m = (f: string) => `/media/${f}`;

/** Plays a short silent loop only while the phone is on screen. */
function useLoop(ref: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = v.dataset.src || "";
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [ref]);
}

export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-[2.4rem] bg-[#1f2016] p-[7px] shadow-[0_18px_40px_-18px_rgba(47,48,32,0.55)] ring-1 ring-black/40 dark:ring-white/15", className)}>
      <span aria-hidden className="absolute top-[42%] -left-[3px] h-14 w-[3px] rounded-l bg-[#1f2016]" />
      <span aria-hidden className="absolute top-[28%] -right-[3px] h-10 w-[3px] rounded-r bg-[#1f2016]" />
      <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-black">
        {children}
        <span aria-hidden className="pointer-events-none absolute top-2.5 left-1/2 z-10 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}

function PhoneClip({ clip, onOpen }: { clip: Clip; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useLoop(ref);
  return (
    <figure className="w-[62vw] max-w-[260px] shrink-0 snap-center sm:w-[44vw] lg:w-auto lg:max-w-none">
      <button type="button" onClick={onOpen} className="group block w-full text-left" aria-label={`Play ${clip.title}`}>
        <PhoneFrame className="transition-transform duration-300 group-hover:-translate-y-1">
          <video ref={ref} data-src={m(`${clip.slug}-loop.mp4`)} poster={m(`${clip.slug}.jpg`)} muted loop playsInline preload="none" aria-hidden className="h-full w-full object-cover" />
          <span className="glass-light bg-background/90 text-foreground absolute right-3 bottom-3 z-10 flex size-9 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110">
            <Expand className="size-4" aria-hidden />
          </span>
        </PhoneFrame>
      </button>
      <figcaption className="mt-4 px-1">
        <p className="font-semibold tracking-tight">{clip.title}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-snug">{clip.caption}</p>
      </figcaption>
    </figure>
  );
}

type Item = { kind: "clip"; i: number } | { kind: "photo"; i: number };

function Viewer({ item, onClose, onStep }: { item: Item; onClose: () => void; onStep: (d: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", key);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = o;
      prev?.focus();
    };
  }, [onClose, onStep]);

  const clip = item.kind === "clip" ? CLIPS[item.i] : null;
  const photo = item.kind === "photo" ? PHOTOS[item.i] : null;
  const label = clip ? clip.title : photo!.alt;
  const nav = "glass-light bg-background/90 text-foreground flex size-11 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105";
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f3020]/92 p-4 backdrop-blur-sm" onClick={onClose}>
      <button ref={closeRef} type="button" onClick={onClose} className={cn(nav, "absolute top-4 right-4 z-10")} aria-label="Close">
        <X className="size-5" />
      </button>
      <button type="button" onClick={(e) => (e.stopPropagation(), onStep(-1))} className={cn(nav, "absolute left-3 z-10 sm:left-6")} aria-label="Previous">
        <ChevronLeft className="size-5" />
      </button>
      <button type="button" onClick={(e) => (e.stopPropagation(), onStep(1))} className={cn(nav, "absolute right-3 z-10 sm:right-6")} aria-label="Next">
        <ChevronRight className="size-5" />
      </button>
      <div className="flex max-h-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {clip ? (
          <>
            <PhoneFrame className="h-[min(78vh,760px)] w-auto [&>div]:h-full">
              <video key={clip.slug} src={m(`${clip.slug}.mp4`)} poster={m(`${clip.slug}.jpg`)} autoPlay muted playsInline controls controlsList="nodownload noplaybackrate" disablePictureInPicture className="h-full w-full bg-black object-cover" />
            </PhoneFrame>
            <p className="mt-4 text-center font-semibold text-[#f3f2f6]">{clip.title}</p>
            <p className="max-w-sm text-center text-sm text-[#cdcbd6]">{clip.caption}</p>
          </>
        ) : (
          <>
            <img key={photo!.slug} src={m(`${photo!.slug}.jpg`)} alt={photo!.alt} className="max-h-[80vh] max-w-[min(92vw,1100px)] rounded-2xl object-contain shadow-2xl" />
            <p className="mt-4 max-w-xl text-center text-sm text-[#cdcbd6]">{photo!.alt}</p>
          </>
        )}
      </div>
    </div>
  );
}

function useViewer() {
  const [item, setItem] = useState<Item | null>(null);
  const close = useCallback(() => setItem(null), []);
  const step = useCallback(
    (d: number) =>
      setItem((cur) => {
        if (!cur) return cur;
        const n = cur.kind === "clip" ? CLIPS.length : PHOTOS.length;
        return { ...cur, i: (cur.i + d + n) % n };
      }),
    [],
  );
  return { item, setItem, viewer: item ? <Viewer item={item} onClose={close} onStep={step} /> : null };
}

/** Clips and photos. "home" lays the phones out in a row on desktop; "study" keeps a swipeable strip inside the narrower case study column. */
function FieldMedia({ variant }: { variant: "home" | "study" }) {
  const { setItem, viewer } = useViewer();
  const home = variant === "home";
  return (
    <>
      <Reveal>
        <div
          className={cn(
            "-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden",
            home ? "lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0" : "lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0",
          )}
          style={{ scrollbarWidth: "none" }}
        >
          {CLIPS.map((c, i) => (
            <PhoneClip key={c.slug} clip={c} onOpen={() => setItem({ kind: "clip", i })} />
          ))}
        </div>
        <p className="text-muted-foreground mt-2 font-mono text-[11px] tracking-[0.14em] uppercase lg:hidden">Swipe for more · tap to play</p>
      </Reveal>

      <Reveal className={home ? "mt-20" : "mt-10"}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h3 className={cn("font-semibold tracking-tight", home ? "text-2xl" : "text-xl")}>Rack builds</h3>
          <p className="text-muted-foreground text-sm">Tap a photo to view it larger.</p>
        </div>
        <ul className={cn("columns-2 gap-4", home ? "md:columns-3 lg:columns-4" : "md:columns-3")}>
          {PHOTOS.map((p, i) => (
            <li key={p.slug} className="mb-4 break-inside-avoid">
              <button type="button" onClick={() => setItem({ kind: "photo", i })} className="group bg-card block w-full overflow-hidden rounded-[1.25rem] shadow-sm" aria-label={`View photo: ${p.alt}`}>
                <img src={m(`${p.slug}-sm.jpg`)} alt={p.alt} loading="lazy" decoding="async" width={p.wide ? 720 : 540} height={p.wide ? 584 : 720} className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]" />
              </button>
            </li>
          ))}
        </ul>
      </Reveal>
      {viewer}
    </>
  );
}

export function FieldWork() {
  return (
    <Section
      id="on-site"
      eyebrow="On the job · Marks branch work"
      title="Watch me work"
      className="overflow-hidden"
    >
      <FieldMedia variant="home" />
    </Section>
  );
}

/** The same media on the Marks case study pages. */
export function StudyMedia() {
  return (
    <section aria-label="From the job" className="mt-14">
      <p className="text-primary font-mono text-xs tracking-[0.18em] uppercase">From the job · Marks branch work</p>
      <h2 className="mt-3 mb-8 text-3xl font-semibold tracking-tight">Rack builds and installs</h2>
      <FieldMedia variant="study" />
    </section>
  );
}
