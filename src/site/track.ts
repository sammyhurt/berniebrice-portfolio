/**
 * Visit log for berniebrice.com. Every page view and a few key actions (intro played, demo played, resume opened,
 * contact sent) are sent with: page, device type, where the visitor came from, a random per-visit session id and,
 * for tracked application links (?for=acme), the link code. No names, emails, IP addresses or cookies are stored.
 * Your own browser is skipped once you've opened /admin with your passcode.
 */
export const VISIT_URL = "https://subletlyco.app.n8n.cloud/webhook/bernie-portfolio-visit";
const KEY = "bb-for";
const SESSION_KEY = "bb-session";
const SOURCE_KEY = "bb-source";
const OWNER_KEY = "bb-admin-pass";

export function visitCode(): string {
  try {
    const q = new URLSearchParams(location.search).get("for");
    if (q) {
      const c = q.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
      if (c) sessionStorage.setItem(KEY, c);
    }
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

function session(): string {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return Math.random().toString(36).slice(2, 12);
  }
}

/** Where this visit came from, worked out once on landing. */
function source(): string {
  try {
    const saved = sessionStorage.getItem(SOURCE_KEY);
    if (saved) return saved;
    const utm = (new URLSearchParams(location.search).get("utm_source") || "").toLowerCase();
    let host = "";
    try {
      host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    } catch {
      host = "";
    }
    const pick = (h: string) =>
      /linkedin|lnkd\.in/.test(h) ? "linkedin" : /google\./.test(h) ? "google" : /bing\./.test(h) ? "bing" : /duckduckgo/.test(h) ? "duckduckgo" : /yahoo\./.test(h) ? "yahoo" :
      /facebook|fb\.com/.test(h) ? "facebook" : /instagram/.test(h) ? "instagram" : /(^|\.)x\.com|twitter|t\.co/.test(h) ? "x" : /github/.test(h) ? "github" : /indeed/.test(h) ? "indeed" :
      /mail\.|outlook|gmail/.test(h) ? "email" : "";
    let s = utm ? pick(utm) || (utm === "email" ? "email" : "other") : "";
    if (!s && host) s = host === location.hostname ? "internal" : pick(host) || "other";
    if (!s) s = "direct";
    sessionStorage.setItem(SOURCE_KEY, s);
    return s;
  } catch {
    return "direct";
  }
}

function isOwnerOrBot(): boolean {
  if (/bot|crawl|spider|preview|facebookexternalhit|slurp|headless|lighthouse/i.test(navigator.userAgent)) return true;
  try {
    return !!localStorage.getItem(OWNER_KEY);
  } catch {
    return false;
  }
}

const device = () => (/iPad|Tablet/i.test(navigator.userAgent) ? "tablet" : /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "phone" : "desktop");
const sent = new Set<string>();
const queue: { kind: "page" | "event"; page: string }[] = [];
let firstSent = false;
let flushing = false;

/**
 * To keep the number of calls low, the first page view of a visit is sent right away (so the visit always counts)
 * and everything after it (more pages, clicks, plays) is held and sent together when the visitor leaves or hides the tab.
 */
function send(kind: "page" | "event", page: string) {
  const key = kind + ":" + page;
  if (sent.has(key) || isOwnerOrBot()) return;
  sent.add(key);
  const item = { kind, page: page.slice(0, 80) };
  if (!firstSent) {
    firstSent = true;
    post([item]);
    return;
  }
  queue.push(item);
  if (!flushing) {
    flushing = true;
    const out = () => flush();
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && out());
    addEventListener("pagehide", out);
  }
  if (queue.length >= 12) flush();
}

function flush() {
  if (!queue.length) return;
  post(queue.splice(0, queue.length));
}

function post(items: { kind: string; page: string }[]) {
  const body = JSON.stringify({ items, code: visitCode(), session: session(), source: source(), device: device() });
  try {
    // keepalive lets the request finish even if the visitor is leaving the page
    void fetch(VISIT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch {
    /* tracking never blocks the page */
  }
}

/**
 * Run once the page is actually on screen. Tabs reopened in the background, browser preloading and
 * hidden tabs don't count until someone looks at them (and never count if nobody does).
 */
function whenSeen(fn: () => void) {
  const d = document as Document & { prerendering?: boolean };
  const seen = () => !d.prerendering && d.visibilityState === "visible";
  if (seen()) return fn();
  const check = () => {
    if (!seen()) return;
    document.removeEventListener("visibilitychange", check);
    document.removeEventListener("prerenderingchange", check);
    fn();
  };
  document.addEventListener("visibilitychange", check);
  document.addEventListener("prerenderingchange", check);
}

/** A page view, once per page per visit, counted only when the page is seen. */
export function logVisit(page: string) {
  source(); // fix the source on landing, before internal navigation changes the referrer
  whenSeen(() => send("page", page));
}

/** A key action, once per visit: intro, demo, resume, contact, linkedin, email, phone. */
export function trackEvent(name: "intro" | "demo" | "resume" | "contact" | "linkedin" | "email" | "phone") {
  send("event", name);
  tagClarity(name);
}

/** Readable Clarity event names. The four that mean a visitor took a next step also mark the session as converted. */
const CLARITY_EVENTS: Record<string, { event: string; converts: boolean }> = {
  resume: { event: "resume_download", converts: true },
  contact: { event: "contact_sent", converts: true },
  linkedin: { event: "linkedin_click", converts: true },
  email: { event: "email_click", converts: true },
  phone: { event: "phone_click", converts: true },
  intro: { event: "intro_video", converts: false },
  demo: { event: "demo_opened", converts: false },
};

/**
 * Tell Clarity about key actions so replays can be filtered: "converted = yes" sessions vs the rest.
 * Clarity only exists for real visitors (see clarity.ts), so this does nothing for the owner, bots or /admin.
 */
function tagClarity(name: string) {
  const c = typeof window !== "undefined" ? window.clarity : undefined;
  const e = CLARITY_EVENTS[name];
  if (!c || !e) return;
  try {
    c("event", e.event);
    if (e.converts) {
      c("set", "converted", "yes");
      c("upgrade", e.event); // keep this session's replay
    }
  } catch {
    /* tracking never blocks the page */
  }
}

/** Count clicks on the resume PDF, LinkedIn, email and phone links anywhere on the site. */
export function watchClicks() {
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const h = a.getAttribute("href") || "";
      if (/\.pdf($|\?)/i.test(h)) trackEvent("resume");
      else if (/linkedin\.com/i.test(h)) trackEvent("linkedin");
      else if (h.startsWith("mailto:")) trackEvent("email");
      else if (h.startsWith("tel:")) trackEvent("phone");
    },
    { capture: true },
  );
}
