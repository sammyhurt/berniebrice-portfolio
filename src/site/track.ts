/**
 * Tracked application links: berniebrice.com/?for=acme. The code is remembered for this visit, and each page view
 * sends only the code, the page and the device type. No names, emails, IP addresses or cookies are stored.
 */
export const VISIT_URL = "https://subletlyco.app.n8n.cloud/webhook/bernie-portfolio-visit";
const KEY = "bb-for";

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

const sent = new Set<string>();
export function logVisit(page: string) {
  const code = visitCode();
  if (!code || sent.has(page) || /bot|crawl|spider|preview|facebookexternalhit|slurp|headless/i.test(navigator.userAgent)) return;
  sent.add(page);
  const device = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "phone" : /iPad|Tablet/i.test(navigator.userAgent) ? "tablet" : "desktop";
  const body = JSON.stringify({ code, page: page.slice(0, 80), device });
  try {
    void fetch(VISIT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch {
    /* tracking never blocks the page */
  }
}
