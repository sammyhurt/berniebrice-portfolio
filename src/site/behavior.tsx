import { useEffect, useMemo, useState } from "react";

import { CLARITY_DASHBOARD } from "./clarity";

/**
 * "How visitors behave": Microsoft Clarity's summary numbers, pulled twice a day by the n8n workflow
 * "Bernie Jobs — Clarity insights (twice daily)" and kept as a daily history. Heat maps and replays stay in Clarity.
 */
const CLARITY_ADMIN_URL = "https://subletlyco.app.n8n.cloud/webhook/bernie-clarity-admin";

type Row = Record<string, number>;
type Metrics = Record<string, Record<string, Row>>;
interface Snap { day: string; fetched_at: string; status: string; by_page: Metrics; by_source: Metrics }
interface Resp { ok: boolean; latest: Snap | null; days: Snap[] }

const num = (r: Row | undefined, ...keys: string[]) => {
  if (!r) return undefined;
  for (const k of keys) if (typeof r[k] === "number") return r[k];
  return undefined;
};
const sessions = (m: Metrics, key: string) => num(m.Traffic?.[key], "totalSessionCount", "sessionsCount", "sessionCount");
const scroll = (m: Metrics, key: string) => num(m.ScrollDepth?.[key], "averageScrollDepth", "averageScrollDepthPercentage");
const active = (m: Metrics, key: string) => num(m.EngagementTime?.[key], "activeTime", "averageActiveTime");
const total = (m: Metrics, key: string) => num(m.EngagementTime?.[key], "totalTime", "averageTotalTime");
const share = (m: Metrics, metric: string, key: string) => num(m[metric]?.[key], "sessionsWithMetricPercentage");
const count = (m: Metrics, metric: string, key: string) => num(m[metric]?.[key], "subTotal", "pagesViews");

const pct = (v?: number) => (v === undefined ? "—" : `${Math.round(v)}%`);
const secs = (v?: number) => (v === undefined ? "—" : v >= 60 ? `${Math.floor(v / 60)}m ${Math.round(v % 60)}s` : `${Math.round(v)}s`);
const n = (v?: number) => (v === undefined ? "—" : Math.round(v).toLocaleString());
const when = (iso: string) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

export function Behavior({ pass, pageLabel, sourceLabel }: { pass: string; pageLabel: (p: string) => string; sourceLabel: (s: string) => string }) {
  const [d, setD] = useState<Resp | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let live = true;
    fetch(CLARITY_ADMIN_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Studio-Key": pass }, body: "{}" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Resp) => live && setD(j))
      .catch(() => live && setErr("Couldn't load Clarity numbers right now."));
    return () => {
      live = false;
    };
  }, [pass]);

  const snap = d?.latest;
  const m = snap?.by_page || {};
  const pages = useMemo(() => {
    const keys = new Set<string>();
    Object.values(m).forEach((rows) => Object.keys(rows).forEach((k) => k !== "all" && keys.add(k)));
    return [...keys]
      .map((k) => ({ k, s: sessions(m, k), sc: scroll(m, k), a: active(m, k), t: total(m, k), dead: share(m, "DeadClickCount", k), rage: share(m, "RageClickCount", k), quick: share(m, "QuickbackClick", k) }))
      .filter((p) => p.k.startsWith("/") && !p.k.startsWith("/admin"))
      .sort((a, b) => (b.s || 0) - (a.s || 0))
      .slice(0, 15);
  }, [m]);
  const sources = useMemo(() => {
    const t = snap?.by_source?.Traffic || {};
    return Object.keys(t)
      .map((k) => ({ k, s: num(t[k], "totalSessionCount", "sessionsCount") || 0 }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8);
  }, [snap]);
  const totals = useMemo(() => {
    const s = pages.reduce((a, p) => a + (p.s || 0), 0);
    const w = (f: (p: (typeof pages)[number]) => number | undefined) => {
      let sum = 0, wt = 0;
      pages.forEach((p) => {
        const v = f(p);
        if (v !== undefined) {
          sum += v * (p.s || 1);
          wt += p.s || 1;
        }
      });
      return wt ? sum / wt : undefined;
    };
    return { s, sc: w((p) => p.sc), a: w((p) => p.a), dead: w((p) => p.dead), rage: w((p) => p.rage), quick: w((p) => p.quick) };
  }, [pages]);
  const history = (d?.days || []).slice(0, 14).reverse();
  const hmax = Math.max(1, ...history.map((h) => Object.values(h.by_page.Traffic || {}).reduce((a, r) => a + (num(r, "totalSessionCount", "sessionsCount") || 0), 0)));

  const card = "border-border bg-card rounded-2xl border p-5";
  const label = "text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase";
  const empty = !pages.length;

  return (
    <section className="mt-10 grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">How visitors behave</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            From Microsoft Clarity · last 24 hours{snap?.fetched_at ? `, updated ${when(snap.fetched_at)}` : ""} · refreshes at 9:13 AM and 11:13 PM
          </p>
        </div>
        <a href={CLARITY_DASHBOARD} target="_blank" rel="noreferrer" className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold">
          Heat maps and replays ↗
        </a>
      </div>

      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {!d && !err ? <p className="text-muted-foreground text-sm">Loading…</p> : null}

      {d && empty ? (
        <div className={card}>
          <p className="font-semibold">No Clarity numbers yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Clarity started recording on Nov 11. Numbers show up here after real visitors come through (your own visits aren't counted). Heat maps get useful after about a dozen visits to a page.
          </p>
        </div>
      ) : null}

      {d && !empty ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ["Sessions", n(totals.s), "visits Clarity recorded"],
                ["Scroll depth", pct(totals.sc), "how far down the page, on average"],
                ["Active time", secs(totals.a), "time actually reading or clicking"],
                ["Dead clicks", pct(totals.dead), "of sessions clicked something that isn't a link"],
                ["Rage clicks", pct(totals.rage), "of sessions clicked one spot repeatedly"],
                ["Quick backs", pct(totals.quick), "of sessions left a page right after opening it"],
              ] as const
            ).map(([t, v, s]) => (
              <div key={t} className={card}>
                <p className={label}>{t}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">{v}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-snug">{s}</p>
              </div>
            ))}
          </div>

          <div className={card}>
            <h3 className={label}>By page</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-muted-foreground text-left text-xs">
                  <tr>
                    <th className="py-2 font-medium">Page</th>
                    <th className="py-2 text-right font-medium">Sessions</th>
                    <th className="py-2 text-right font-medium">Scroll</th>
                    <th className="py-2 text-right font-medium">Active time</th>
                    <th className="py-2 text-right font-medium">Dead</th>
                    <th className="py-2 text-right font-medium">Rage</th>
                    <th className="py-2 text-right font-medium">Quick back</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pages.map((p) => (
                    <tr key={p.k}>
                      <td className="py-2.5 pr-3">{pageLabel(p.k)}</td>
                      <td className="py-2.5 text-right tabular-nums">{n(p.s)}</td>
                      <td className="py-2.5 text-right tabular-nums">{pct(p.sc)}</td>
                      <td className="py-2.5 text-right tabular-nums">{secs(p.a)}</td>
                      <td className={`py-2.5 text-right tabular-nums ${(p.dead || 0) >= 20 ? "font-semibold text-amber-700" : ""}`}>{pct(p.dead)}</td>
                      <td className={`py-2.5 text-right tabular-nums ${(p.rage || 0) >= 5 ? "font-semibold text-amber-700" : ""}`}>{pct(p.rage)}</td>
                      <td className="py-2.5 text-right tabular-nums">{pct(p.quick)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">Amber means worth a look: open that page's heat map in Clarity to see what people tried to click.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={card}>
              <h3 className={label}>Where Clarity visits came from</h3>
              {sources.length ? (
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {sources.map((s) => (
                    <li key={s.k} className="flex justify-between gap-3">
                      <span className="truncate">{sourceLabel(s.k)}</span>
                      <span className="text-muted-foreground tabular-nums">{s.s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm">Nothing yet.</p>
              )}
            </div>
            <div className={card}>
              <h3 className={label}>Sessions per day · history</h3>
              {history.length > 1 ? (
                <div className="mt-4 flex h-24 items-end gap-1" role="img" aria-label="Clarity sessions per day">
                  {history.map((h) => {
                    const v = Object.values(h.by_page.Traffic || {}).reduce((a, r) => a + (num(r, "totalSessionCount", "sessionsCount") || 0), 0);
                    return <div key={h.day} title={`${h.day}: ${v}`} className="bg-foreground/80 flex-1 rounded-t-[3px]" style={{ height: `${Math.max(4, (v / hmax) * 100)}%` }} />;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm">History builds up one day at a time. A trend shows here after a couple of days.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
