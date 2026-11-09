import { useEffect, useState } from "react";

/**
 * Seasonal touches that switch on and off by date (visitor's local time).
 * Preview any time with ?season=thanksgiving, or turn off with ?season=off.
 */
export type Season = "thanksgiving" | null;

const WINDOWS: { season: Exclude<Season, null>; from: [number, number]; to: [number, number] }[] = [
  // month is 1-12; inclusive. Thanksgiving 2026 is Thu Nov 26.
  { season: "thanksgiving", from: [11, 20], to: [11, 30] },
];

export function currentSeason(now = new Date()): Season {
  try {
    const q = new URLSearchParams(location.search).get("season");
    if (q === "off") return null;
    if (q && WINDOWS.some((w) => w.season === q)) return q as Season;
  } catch {
    /* ignore */
  }
  const md = (now.getMonth() + 1) * 100 + now.getDate();
  const hit = WINDOWS.find((w) => md >= w.from[0] * 100 + w.from[1] && md <= w.to[0] * 100 + w.to[1]);
  return hit ? hit.season : null;
}

export const SEASON_TEXT: Record<Exclude<Season, null>, { bubble: string; banner: string }> = {
  thanksgiving: { bubble: "🍂 Happy Thanksgiving!", banner: "🍂 Happy Thanksgiving, thankful you stopped by." },
};

const BANNER_KEY = "bb-season-banner-hidden";
/** Thin strip at the very top. Pushes the floating header down while shown; the ✕ hides it for the visit. */
export function SeasonBanner() {
  const [season] = useState(currentSeason);
  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(BANNER_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const visible = !!season && show;
  useEffect(() => {
    document.documentElement.style.setProperty("--banner-h", visible ? "38px" : "0px");
    return () => document.documentElement.style.setProperty("--banner-h", "0px");
  }, [visible]);
  if (!visible || !season) return null;
  const hide = () => {
    try {
      sessionStorage.setItem(BANNER_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  return (
    <div role="note" className="no-print fixed inset-x-0 top-0 z-[45] flex h-[38px] items-center justify-center border-b-2 border-[#d96846] bg-[#2f3020] px-10 text-center text-xs font-medium text-[#f3f2f6] sm:text-sm">
      <span className="truncate">{SEASON_TEXT[season].banner}</span>
      <button type="button" onClick={hide} aria-label="Hide message" className="absolute right-2 flex size-8 items-center justify-center rounded-full text-[#cdcbd6] hover:text-white sm:right-4">
        ✕
      </button>
    </div>
  );
}

const LEAF_COLORS = ["#d96846", "#596235", "#8a8f4e", "#c98a5a", "#cdcbd6", "#e07a5a"];
const LEAF_PATH = "M12 2C7 6 4 10 4 14a8 8 0 0 0 7 7.9V24h2v-2.1A8 8 0 0 0 20 14c0-4-3-8-8-12Z";

/** A handful of leaves drift down once, then the layer removes itself. */
export function FallingLeaves({ count = 10 }: { count?: number }) {
  const [on, setOn] = useState(true);
  const [leaves] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: 4 + ((i * 97) % 92),
      size: 14 + ((i * 37) % 14),
      delay: ((i * 53) % 20) / 10,
      dur: 5.2 + ((i * 29) % 20) / 10,
      sway: (i % 2 ? 1 : -1) * (24 + ((i * 17) % 30)),
      spin: (i % 2 ? 1 : -1) * (180 + ((i * 41) % 200)),
      color: LEAF_COLORS[i % LEAF_COLORS.length],
    })),
  );
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(false);
      return;
    }
    const t = window.setTimeout(() => setOn(false), 9500);
    return () => window.clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div aria-hidden className="no-print pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {leaves.map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={l.size}
          height={l.size}
          className="bb-leaf absolute -top-8"
          style={{ left: `${l.left}%`, animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s`, ["--sway" as string]: `${l.sway}px`, ["--spin" as string]: `${l.spin}deg` }}
        >
          <path d={LEAF_PATH} fill={l.color} opacity="0.9" />
          <path d="M12 4v18" stroke="rgba(0,0,0,.25)" strokeWidth="1" fill="none" />
        </svg>
      ))}
    </div>
  );
}
