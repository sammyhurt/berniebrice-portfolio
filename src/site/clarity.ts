/**
 * Microsoft Clarity heat maps and session replays for berniebrice.com.
 * Loaded only for real visitors: never on /admin, never in a browser that has opened the admin, never for bots,
 * and not for visitors whose time zone is in Europe (Clarity needs consent there). Form fields are masked.
 * Visits from tracked application links are tagged with their code so they can be filtered in Clarity.
 */
import { visitCode } from "./track";

const PROJECT = "zbzx03fui2";
export const CLARITY_DASHBOARD = `https://clarity.microsoft.com/projects/view/${PROJECT}/dashboard`;

type ClarityFn = ((...a: unknown[]) => void) & { q?: unknown[][] };
declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

let started = false;

function allowed(path: string): boolean {
  if (path.startsWith("/admin")) return false;
  if (/bot|crawl|spider|preview|facebookexternalhit|slurp|headless|lighthouse/i.test(navigator.userAgent)) return false;
  try {
    if (localStorage.getItem("bb-admin-pass")) return false;
  } catch {
    /* storage blocked: treat as a visitor */
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/^(Europe|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe))\//.test(tz)) return false;
  } catch {
    /* unknown time zone: allow */
  }
  return true;
}

/** Call on every page change. Starts Clarity once for visitors; stops it if the admin is opened. */
export function clarityFor(path: string) {
  if (typeof window === "undefined") return;
  if (!allowed(path)) {
    if (started && window.clarity) window.clarity("stop");
    return;
  }
  if (!started) {
    started = true;
    const c: ClarityFn =
      window.clarity ||
      (function (...a: unknown[]) {
        (c.q = c.q || []).push(a);
      } as ClarityFn);
    window.clarity = c;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.clarity.ms/tag/${PROJECT}`;
    document.head.appendChild(s);
    const code = visitCode();
    if (code) c("set", "for", code);
  }
  window.clarity?.("set", "page", path);
}
