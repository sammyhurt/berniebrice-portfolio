import Copy from "@iconify-react/solar/copy-linear";
import Eye from "@iconify-react/solar/eye-linear";
import Lock from "@iconify-react/solar/lock-linear";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { studies } from "./data";
import { Outreach } from "./outreach";
import { Chip } from "./parts";

/** Private: tracked links per application and who opened them. Uses the same passcode as your Studios. */
const ADMIN_URL =
  "https://subletlyco.app.n8n.cloud/webhook/bernie-portfolio-admin";
const PASS_KEY = "bb-admin-pass";
const SITE = "https://berniebrice.com";

interface LinkRow {
  code: string;
  company: string;
  role: string;
  note: string;
  created_at: string;
  visits: number;
  last_visit: string;
  pages: string[];
}
interface Recent {
  code: string;
  company: string;
  page: string;
  device: string;
  at: string;
}
interface Win {
  visitors: number;
  views: number;
}
interface KN {
  k: string;
  n: number;
}
interface Session {
  start: string;
  last: string;
  source: string;
  device: string;
  company: string;
  pages: string[];
  events: string[];
}
interface Stats {
  today: Win;
  week: Win;
  month: Win;
  byDay: { day: string; visitors: number; views: number }[];
  sources: KN[];
  pages: KN[];
  events: KN[];
  recent: Session[];
  total_rows: number;
}
interface Data {
  ok: boolean;
  links: LinkRow[];
  recent: Recent[];
  stats?: Stats;
  error?: string;
}

const EVENT_LABEL: Record<string, string> = {
  intro: "Watched intro",
  demo: "Played demo",
  resume: "Opened resume",
  contact: "Sent a message",
  linkedin: "Clicked LinkedIn",
  email: "Clicked email",
  phone: "Clicked phone",
};
const SOURCE_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  yahoo: "Yahoo",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  github: "GitHub",
  indeed: "Indeed",
  email: "Email",
  direct: "Direct",
  other: "Other site",
  internal: "Internal",
  "tracked link": "Tracked link",
};
const pageLabel = (p: string) => {
  if (p === "/") return "Home";
  if (p === "/resume") return "Resume page";
  const w = p.match(/^\/work\/(.+)$/);
  if (w) return studies.find((x) => x.slug === w[1])?.title || w[1];
  const f = p.match(/^\/for\/(.+)$/);
  return f ? `Role view: ${f[1]}` : p.replace(/^\//, "");
};
const dayLabel = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

function StatsPanel({ st }: { st: Stats }) {
  const max = Math.max(1, ...st.byDay.map((d) => d.visitors));
  const card = "border-border bg-card rounded-2xl border p-5";
  const List = ({
    title,
    rows,
    fmt,
  }: {
    title: string;
    rows: KN[];
    fmt: (k: string) => string;
  }) => (
    <div className={card}>
      <h3 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
        {title}
      </h3>
      {rows.length ? (
        <ul className="mt-3 grid gap-1.5 text-sm">
          {rows.map((r) => (
            <li key={r.k} className="flex justify-between gap-3">
              <span className="truncate">{fmt(r.k)}</span>
              <span className="text-muted-foreground tabular-nums">{r.n}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">Nothing yet.</p>
      )}
    </div>
  );
  return (
    <section className="mt-6 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["Today", st.today],
            ["Last 7 days", st.week],
            ["Last 30 days", st.month],
          ] as const
        ).map(([t, w]) => (
          <div key={t} className={card}>
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
              {t}
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">
              {w.visitors}
            </p>
            <p className="text-muted-foreground text-sm">
              visitor{w.visitors === 1 ? "" : "s"} · {w.views} page view
              {w.views === 1 ? "" : "s"}
            </p>
          </div>
        ))}
      </div>
      <div className={card}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
            Visitors per day · last 30 days
          </h3>
          <span className="text-muted-foreground text-xs">New York time</span>
        </div>
        <div
          className="mt-4 flex h-32 items-end gap-[3px]"
          role="img"
          aria-label="Visitors per day for the last 30 days"
        >
          {st.byDay.map((d) => (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 items-end"
              title={`${dayLabel(d.day)}: ${d.visitors} visitor${d.visitors === 1 ? "" : "s"}, ${d.views} views`}
            >
              <div
                className="bg-primary/85 group-hover:bg-primary w-full rounded-t-[3px]"
                style={{
                  height: `${d.visitors ? Math.max(6, (d.visitors / max) * 100) : 2}%`,
                  opacity: d.visitors ? 1 : 0.25,
                }}
              />
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-1.5 flex justify-between text-[11px]">
          <span>{dayLabel(st.byDay[0]?.day || "")}</span>
          <span>Today</span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <List
          title="Where visitors came from"
          rows={st.sources}
          fmt={(k) => SOURCE_LABEL[k] || k}
        />
        <List title="Top pages" rows={st.pages} fmt={pageLabel} />
        <List
          title="What they did"
          rows={st.events}
          fmt={(k) => EVENT_LABEL[k] || k}
        />
      </div>
      <div className={card}>
        <h3 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
          Recent visits
        </h3>
        {st.recent.length ? (
          <ul className="mt-2 divide-y text-sm">
            {st.recent.map((v, i) => (
              <li key={i} className="grid gap-1 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium tabular-nums">
                    {when(v.start)}
                  </span>
                  <Chip>{SOURCE_LABEL[v.source] || v.source}</Chip>
                  {v.device ? (
                    <span className="text-muted-foreground">{v.device}</span>
                  ) : null}
                  {v.company ? <Chip tone="ok">{v.company}</Chip> : null}
                </div>
                <p className="text-muted-foreground">
                  {v.pages.length ? v.pages.map(pageLabel).join(" → ") : "—"}
                  {v.events.length ? (
                    <span className="text-foreground">
                      {" "}
                      · {v.events.map((e) => EVENT_LABEL[e] || e).join(", ")}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm">
            No visits yet. They'll show up here as people open your site.
          </p>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Bots and repeat refreshes are skipped. Your own visits aren't counted on
        any browser where you've opened this page. No names, emails, IP
        addresses or cookies are stored.
      </p>
    </section>
  );
}

const when = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

export default function Admin() {
  const [pass, setPass] = useState(() => {
    try {
      return localStorage.getItem(PASS_KEY) || "";
    } catch {
      return "";
    }
  });
  const [typed, setTyped] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ company: "", role: "", note: "" });
  const [made, setMade] = useState("");
  const [tab, setTab] = useState<"site" | "outreach">(() => {
    try {
      return localStorage.getItem("bb-admin-tab") === "outreach"
        ? "outreach"
        : "site";
    } catch {
      return "site";
    }
  });
  const pickTab = (t: "site" | "outreach") => {
    setTab(t);
    try {
      localStorage.setItem("bb-admin-tab", t);
    } catch {
      /* fine */
    }
  };
  const call = useCallback(
    async (body: Record<string, unknown>, p = pass): Promise<Data | null> => {
      setBusy(true);
      setErr("");
      try {
        const r = await fetch(ADMIN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Studio-Key": p },
          body: JSON.stringify(body),
        });
        if (r.status === 401 || r.status === 403)
          throw new Error("That passcode didn't work.");
        const d = (await r.json()) as Data;
        if (!d.ok) throw new Error(d.error || "Something went wrong.");
        return d;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [pass],
  );
  const load = useCallback(
    async (p = pass) => {
      const d = await call({ action: "list" }, p);
      if (d) setData(d);
      return d;
    },
    [call, pass],
  );
  useEffect(() => {
    if (pass) void load();
  }, [pass, load]);

  if (!pass || (err && !data)) {
    return (
      <main className="mx-auto grid max-w-sm gap-4 px-5 pt-32 pb-20">
        <div className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-2xl">
          <Lock className="size-6" />
        </div>
        <h1 className="text-center text-2xl font-semibold">Your admin</h1>
        <p className="text-muted-foreground text-center text-sm">
          Private. Enter the same passcode you use for your Studios.
        </p>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const d = await load(typed);
            if (d) {
              try {
                localStorage.setItem(PASS_KEY, typed);
              } catch {
                /* fine */
              }
              setPass(typed);
            }
          }}
        >
          <Input
            type="password"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Passcode"
            aria-label="Passcode"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            className="rounded-full"
            disabled={busy || !typed}
          >
            {busy ? "Checking…" : "Open"}
          </Button>
          {err ? (
            <p className="text-center text-sm text-rose-600">{err}</p>
          ) : null}
        </form>
      </main>
    );
  }

  const add = async () => {
    const d = await call({ action: "link_add", ...f });
    if (d) {
      const code = (d as unknown as { code: string }).code;
      setMade(`${SITE}/?for=${code}`);
      setF({ company: "", role: "", note: "" });
      await load();
    }
  };
  return (
    <main className="mx-auto max-w-5xl px-5 pt-28 pb-10 sm:px-8">
      <div
        className="mb-8 inline-flex rounded-full bg-muted p-1"
        role="tablist"
        aria-label="Admin sections"
      >
        {(["site", "outreach"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => pickTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "site" ? "Site and links" : "Outreach"}
          </button>
        ))}
      </div>
      {tab === "outreach" ? (
        <Outreach pass={pass} links={data?.links || []} />
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">Site visits</h1>
          {data?.stats ? (
            <StatsPanel st={data.stats} />
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">
              {data ? "" : "Loading…"}
            </p>
          )}
          <h2 className="mt-14 text-3xl font-semibold tracking-tight">
            Application links
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Make one link per application and paste it into the application or
            your email. When someone opens it, you see it here: which company,
            which pages, what they watched or clicked, and when.
          </p>
          <div className="border-border bg-card mt-6 grid gap-3 rounded-2xl border p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-sm">
                Company
                <Input
                  value={f.company}
                  onChange={(e) => setF({ ...f, company: e.target.value })}
                  placeholder="Acme Health"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Role
                <Input
                  value={f.role}
                  onChange={(e) => setF({ ...f, role: e.target.value })}
                  placeholder="Senior Infrastructure Engineer"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Note (only you see it)
                <Input
                  value={f.note}
                  onChange={(e) => setF({ ...f, note: e.target.value })}
                  placeholder="Applied via LinkedIn"
                />
              </label>
            </div>
            <Button
              className="justify-self-start rounded-full"
              disabled={busy || f.company.trim().length < 2}
              onClick={() => void add()}
            >
              Make link
            </Button>
            {made ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm">
                <code className="[overflow-wrap:anywhere]">{made}</code>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => void navigator.clipboard?.writeText(made)}
                >
                  <Copy className="size-4" /> Copy
                </Button>
              </div>
            ) : null}
          </div>
          {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : null}
          <h2 className="mt-10 text-xl font-semibold">Your links</h2>
          {data && data.links.length ? (
            <ul className="mt-4 grid gap-2">
              {data.links.map((l) => {
                const url = `${SITE}/?for=${l.code}`;
                return (
                  <li
                    key={l.code}
                    className="border-border bg-card grid gap-2 rounded-2xl border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{l.company}</span>
                      {l.role ? (
                        <span className="text-muted-foreground text-sm">
                          {l.role}
                        </span>
                      ) : null}
                      <span className="ml-auto">
                        {l.visits ? (
                          <Chip tone="ok">
                            Opened {l.visits} page{l.visits === 1 ? "" : "s"} ·
                            last {when(l.last_visit)}
                          </Chip>
                        ) : (
                          <Chip>Not opened yet</Chip>
                        )}
                      </span>
                    </div>
                    {l.pages.length ? (
                      <p className="text-muted-foreground text-xs">
                        Pages: {l.pages.join(", ")}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <code className="bg-muted rounded px-2 py-1 [overflow-wrap:anywhere]">
                        {url}
                      </code>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => void navigator.clipboard?.writeText(url)}
                      >
                        <Copy className="size-3.5" /> Copy
                      </Button>
                      {l.note ? (
                        <span className="text-muted-foreground">{l.note}</span>
                      ) : null}
                      <span className="text-muted-foreground">
                        Made {when(l.created_at)}
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="ml-auto rounded-full text-rose-600"
                        disabled={busy}
                        onClick={async () =>
                          (await call({
                            action: "link_remove",
                            code: l.code,
                          })) && (await load())
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">
              {data
                ? "No links yet. Make one above for your next application."
                : "Loading…"}
            </p>
          )}
          {data && data.recent.length ? (
            <>
              <h2 className="mt-10 flex items-center gap-2 text-xl font-semibold">
                <Eye className="size-5" /> Recent opens
              </h2>
              <ul className="border-border bg-card mt-4 divide-y rounded-2xl border text-sm">
                {data.recent.map((r, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2.5"
                  >
                    <span className="font-medium">{r.company || r.code}</span>
                    <span className="text-muted-foreground">{r.page}</span>
                    <span className="text-muted-foreground">{r.device}</span>
                    <span className="text-muted-foreground ml-auto tabular-nums">
                      {when(r.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
