import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, MoveHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { profile } from "./data";
import { A } from "./parts";
import { currentSeason, FallingLeaves } from "./season";

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const INK = "#2f3020";
const PAPER = "#f4f3f7";

function Box({ x, y, w, h, label, sub, fill, stroke, text = PAPER }: { x: number; y: number; w: number; h: number; label: string; sub?: string; fill: string; stroke?: string; text?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={fill} stroke={stroke || "none"} strokeWidth={2} />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -4 : 6)} textAnchor="middle" fontSize={20} fontWeight={600} fill={text} fontFamily="Figtree, sans-serif">
        {label}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fontSize={14} fill={text} opacity={0.75} fontFamily="IBM Plex Mono, monospace">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

/** Before: everything on one flat network. Illustrative, not any employer's real network. */
function BeforeNet() {
  const grey = "#6d6e5c";
  const devices = ["Staff PCs", "Printers", "Phones", "Guest Wi-Fi", "Cameras", "Servers"];
  return (
    <svg viewBox="0 0 1200 640" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Before: one flat network where staff, guests, phones, printers and servers all share the same network">
      <rect width="1200" height="640" fill="#3a3b2e" />
      <Box x={520} y={40} w={160} h={64} label="Internet" fill={grey} />
      <line x1={600} y1={104} x2={600} y2={160} stroke={grey} strokeWidth={4} />
      <Box x={500} y={160} w={200} h={64} label="Basic router" fill={grey} />
      <line x1={600} y1={224} x2={600} y2={280} stroke={grey} strokeWidth={4} />
      <rect x={110} y={280} width={980} height={250} rx={24} fill="none" stroke={grey} strokeWidth={3} strokeDasharray="10 10" />
      <text x={600} y={318} textAnchor="middle" fontSize={18} fill={PAPER} opacity={0.8} fontFamily="IBM Plex Mono, monospace">
        ONE FLAT NETWORK · NO SEGMENTATION · ONE SITE AT A TIME
      </text>
      {devices.map((d, i) => {
        const x = 140 + i * 158;
        return (
          <g key={d}>
            <line x1={600} y1={280} x2={x + 65} y2={380} stroke={grey} strokeWidth={2} opacity={0.8} />
            <Box x={x} y={380} w={130} h={64} label={d} fill="#45463a" stroke={grey} />
          </g>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M ${205 + i * 158} 444 C ${260 + i * 158} 500, ${330 + i * 158} 500, ${363 + i * 158} 444`} stroke={grey} strokeWidth={2} fill="none" opacity={0.7} />
      ))}
    </svg>
  );
}

/** After: firewall, VLAN segmentation and site-to-site VPN to branches. Illustrative. */
function AfterNet() {
  const clay = "#d96846";
  const vlans = [
    { l: "Staff", c: "#596235" },
    { l: "Voice", c: "#d96846" },
    { l: "Printers", c: "#7d7a92" },
    { l: "Guest Wi-Fi", c: "#8a8f4e" },
  ];
  return (
    <svg viewBox="0 0 1200 640" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="After: a firewall with VLAN-segmented staff, voice, printer and guest networks, connected to branch offices over site-to-site VPN">
      <rect width="1200" height="640" fill="#2f3020" />
      <Box x={520} y={40} w={160} h={64} label="Internet" fill="#45473a" />
      <line x1={600} y1={104} x2={600} y2={150} stroke={PAPER} strokeWidth={4} opacity={0.6} />
      <Box x={480} y={150} w={240} h={76} label="Firewall" sub="policy · VPN" fill={clay} />
      <line x1={600} y1={226} x2={600} y2={276} stroke={PAPER} strokeWidth={4} opacity={0.6} />
      <Box x={480} y={276} w={240} h={70} label="Core switch" sub="VLAN trunk" fill="#45473a" />
      {vlans.map((v, i) => {
        const x = 300 + i * 160;
        return (
          <g key={v.l}>
            <line x1={600} y1={346} x2={x + 65} y2={420} stroke={v.c} strokeWidth={3} />
            <Box x={x} y={420} w={130} h={64} label={v.l} fill={v.c} />
          </g>
        );
      })}
      <text x={600} y={530} textAnchor="middle" fontSize={18} fill={PAPER} opacity={0.85} fontFamily="IBM Plex Mono, monospace">
        SEGMENTED · FIREWALLED · EVERY SITE CONNECTED
      </text>
      {[
        { x: 40, y: 160, l: "Branch A" },
        { x: 1000, y: 160, l: "Branch B" },
      ].map((b) => (
        <g key={b.l}>
          <path d={b.x < 600 ? `M 200 192 C 330 192, 380 188, 480 188` : `M 1000 192 C 880 192, 820 188, 720 188`} stroke={clay} strokeWidth={4} strokeDasharray="12 9" fill="none" />
          <Box x={b.x} y={b.y} w={160} h={64} label={b.l} sub="site-to-site VPN" fill="#45473a" stroke={clay} />
        </g>
      ))}
    </svg>
  );
}

/**
 * Scroll-driven before/after wipe (from the template): scrolling reveals the "after" network; once fully scrolled
 * the divider can be dragged. Reduced motion: a static "after" with a toggle.
 */
export function NetworkHero() {
  const reduced = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const unlockedRef = useRef(false);
  const dragging = useRef(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showAfter, setShowAfter] = useState(true);
  const [season] = useState(currentSeason);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const pos = useMotionValue(0);
  // On wide screens the diagram sits on the right, so the wipe travels only across it.
  const [lo, setLo] = useState(0);
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px)");
    const on = () => setLo(mq.matches ? 0.44 : 0);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduced) return;
    if (v >= 0.995) {
      if (!unlockedRef.current) {
        unlockedRef.current = true;
        setUnlocked(true);
        pos.set(1);
      }
      return;
    }
    if (unlockedRef.current) {
      unlockedRef.current = false;
      setUnlocked(false);
    }
    pos.set(v);
  });
  useEffect(() => {
    if (reduced) pos.set(showAfter ? 1 : 0);
  }, [reduced, showAfter, pos]);
  const clip = useTransform(pos, (p) => `inset(0 ${(1 - (lo + p * (1 - lo))) * 100}% 0 0)`);
  const dividerLeft = useTransform(pos, (p) => `${(lo + p * (1 - lo)) * 100}%`);
  const hintOpacity = useTransform(pos, [0, 0.08], [1, 0]);
  const beforeLabel = useTransform(pos, [0.9, 1], [1, 0.35]);
  const afterLabel = useTransform(pos, [0, 0.1], [0.35, 1]);
  const setFromPointer = (clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pos.set(clamp(((clientX - r.left) / r.width - lo) / (1 - lo)));
  };
  const interactive = unlocked || reduced;
  const intro = (delay: number) => (reduced ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const } });
  return (
    <section ref={sectionRef} id="top" className={reduced ? "relative h-dvh" : "relative h-[185vh]"} aria-label="Before and after: a flat network becomes a segmented multisite network">
      <div className="sticky top-0 h-dvh">
        <motion.div
          {...intro(0)}
          ref={stageRef}
          onPointerDown={(e) => {
            if (!unlocked) return;
            dragging.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setFromPointer(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && setFromPointer(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          className={`absolute inset-x-3 top-20 bottom-4 overflow-hidden rounded-[2rem] shadow-lg select-none sm:inset-x-5 lg:inset-x-8 lg:bottom-6 ${interactive ? "cursor-ew-resize touch-pan-y" : ""}`}
          style={{ background: "#3a3b2e" }}
        >
          <div className="hero-diagram absolute inset-x-2 top-12 h-[30%] sm:h-[44%] lg:inset-y-0 lg:top-0 lg:right-4 lg:left-[44%] lg:h-full lg:py-20">
            <BeforeNet />
          </div>
          <motion.div style={{ clipPath: clip, background: "#2f3020" }} className="absolute inset-0">
            <div className="hero-diagram absolute inset-x-2 top-12 h-[30%] sm:h-[44%] lg:inset-y-0 lg:top-0 lg:right-4 lg:left-[44%] lg:h-full lg:py-20">
              <AfterNet />
            </div>
          </motion.div>
          {season === "thanksgiving" ? <FallingLeaves /> : null}
          <motion.div style={{ left: dividerLeft }} className="hero-divider pointer-events-none absolute top-0 z-10 h-[calc(3rem+30%)] w-px -translate-x-1/2 bg-background/90 sm:h-[calc(3rem+44%)] lg:bottom-0 lg:h-auto">
            <button
              type="button"
              role="slider"
              aria-label="Before and after divider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos.get() * 100)}
              tabIndex={interactive ? 0 : -1}
              onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === "ArrowLeft") pos.set(clamp(pos.get() - 0.05));
                if (e.key === "ArrowRight") pos.set(clamp(pos.get() + 0.05));
              }}
              className={`pointer-events-auto absolute top-[58%] left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-foreground shadow-md lg:top-1/2 lg:h-12 lg:w-12 ${interactive ? "ring-2 ring-primary/60" : ""}`}
            >
              <MoveHorizontal className="h-5 w-5" aria-hidden />
            </button>
          </motion.div>
          <motion.span style={{ opacity: beforeLabel }} className="absolute top-5 left-5 rounded-full bg-foreground/80 px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-background uppercase backdrop-blur">
            Before
          </motion.span>
          <motion.span style={{ opacity: afterLabel }} className="absolute top-5 right-5 rounded-full bg-background/85 px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase backdrop-blur">
            After
          </motion.span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2f3020f2] via-[#2f3020d9] to-transparent px-5 pt-10 pb-6 sm:px-10 sm:pt-16 sm:pb-10 lg:inset-y-0 lg:right-auto lg:flex lg:w-[50%] lg:flex-col lg:justify-end lg:bg-gradient-to-r lg:pt-24 lg:pr-4 lg:pb-14 lg:pl-12">
            <motion.p {...intro(0.1)} className="glass-dark inline-flex items-center gap-2 self-start rounded-full bg-background/90 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-foreground uppercase">
              {profile.status}
            </motion.p>
            <motion.h1 {...intro(0.15)} className="hero-h1 mt-3 max-w-3xl text-[1.85rem] leading-[1.05] font-semibold tracking-tight text-balance sm:mt-4 sm:text-6xl lg:text-[4.2rem]" style={{ color: PAPER }}>
              <span className="sr-only">{profile.name}, {profile.title} in New York. </span>
              Multisite networks, kept secure and running.
            </motion.h1>
            <motion.p {...intro(0.3)} className="mt-3 max-w-2xl text-[15px] sm:mt-4 sm:text-lg" style={{ color: "#dedde5" }}>
              <span className="sm:hidden">{profile.title} · New York · 7+ years</span>
              <span className="hidden sm:inline">{profile.name} · {profile.title}, New York. 7+ years across healthcare, banking, hospitality and an enterprise server data center.</span>
            </motion.p>
            <motion.div {...intro(0.4)} className="no-print pointer-events-auto mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
              <a href={profile.resumePdf} download className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md sm:h-12 sm:px-6 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]">
                Download resume
              </a>
              <A to="/#work" className="glass-dark hero-second inline-flex h-11 items-center rounded-full bg-background/90 px-5 text-sm font-semibold text-foreground backdrop-blur sm:h-12 sm:px-6 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]">
                See the work
              </A>
              {reduced ? (
                <button type="button" onClick={() => setShowAfter((v) => !v)} className="inline-flex h-12 items-center rounded-full border border-background/60 px-5 font-mono text-xs tracking-[0.14em] uppercase" style={{ color: PAPER }}>
                  Show {showAfter ? "before" : "after"}
                </button>
              ) : null}
            </motion.div>
            <p className="mt-3 font-mono text-[10px] tracking-[0.14em] uppercase sm:mt-4" style={{ color: "#cdcbd6cc" }}>
              Illustration · not a real employer network
            </p>
          </div>
          {!reduced ? (
            <motion.div style={{ opacity: hintOpacity, color: INK }} className="glass-dark hero-hint pointer-events-none absolute top-[calc(3rem+30%)] left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-background/85 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em] whitespace-nowrap uppercase backdrop-blur sm:top-[calc(3rem+44%)] sm:px-4 sm:py-2 sm:text-[11px] lg:top-1/2 lg:left-[72%] lg:translate-y-12">
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" aria-hidden /> Scroll to reveal
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
