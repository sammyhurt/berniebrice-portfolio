import Copy from "@iconify-react/solar/copy-linear";
import Eye from "@iconify-react/solar/eye-linear";
import Lock from "@iconify-react/solar/lock-linear";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Chip } from "./parts";

/** Private: tracked links per application and who opened them. Uses the same passcode as your Studios. */
const ADMIN_URL = "https://subletlyco.app.n8n.cloud/webhook/bernie-portfolio-admin";
const PASS_KEY = "bb-admin-pass";
const SITE = "https://berniebrice.com";

interface LinkRow { code: string; company: string; role: string; note: string; created_at: string; visits: number; last_visit: string; pages: string[] }
interface Recent { code: string; company: string; page: string; device: string; at: string }
interface Data { ok: boolean; links: LinkRow[]; recent: Recent[]; error?: string }

const when = (iso: string) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

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
  const call = useCallback(
    async (body: Record<string, unknown>, p = pass): Promise<Data | null> => {
      setBusy(true);
      setErr("");
      try {
        const r = await fetch(ADMIN_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Studio-Key": p }, body: JSON.stringify(body) });
        if (r.status === 401 || r.status === 403) throw new Error("That passcode didn't work.");
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
  const load = useCallback(async (p = pass) => {
    const d = await call({ action: "list" }, p);
    if (d) setData(d);
    return d;
  }, [call, pass]);
  useEffect(() => {
    if (pass) void load();
  }, [pass, load]);

  if (!pass || (err && !data)) {
    return (
      <main className="mx-auto grid max-w-sm gap-4 px-4 py-20">
        <div className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-2xl">
          <Lock className="size-6" />
        </div>
        <h1 className="text-center text-2xl font-semibold">Your application links</h1>
        <p className="text-muted-foreground text-center text-sm">Private. Enter the same passcode you use for your Studios.</p>
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
          <Input type="password" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Passcode" aria-label="Passcode" autoComplete="current-password" />
          <Button type="submit" className="rounded-full" disabled={busy || !typed}>
            {busy ? "Checking…" : "Open"}
          </Button>
          {err ? <p className="text-center text-sm text-rose-600">{err}</p> : null}
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
    <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Application links</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">Make one link per application and paste it into the application or your email. When someone opens it, you see it here: which company, which pages, and when. Only the link code, the page and the device type are recorded.</p>
      <div className="border-border bg-card mt-6 grid gap-3 rounded-2xl border p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            Company
            <Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} placeholder="Acme Health" />
          </label>
          <label className="grid gap-1 text-sm">
            Role
            <Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Senior Infrastructure Engineer" />
          </label>
          <label className="grid gap-1 text-sm">
            Note (only you see it)
            <Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Applied via LinkedIn" />
          </label>
        </div>
        <Button className="justify-self-start rounded-full" disabled={busy || f.company.trim().length < 2} onClick={() => void add()}>
          Make link
        </Button>
        {made ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm">
            <code className="[overflow-wrap:anywhere]">{made}</code>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => void navigator.clipboard?.writeText(made)}>
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
              <li key={l.code} className="border-border bg-card grid gap-2 rounded-2xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{l.company}</span>
                  {l.role ? <span className="text-muted-foreground text-sm">{l.role}</span> : null}
                  <span className="ml-auto">{l.visits ? <Chip tone="ok">Opened {l.visits} page{l.visits === 1 ? "" : "s"} · last {when(l.last_visit)}</Chip> : <Chip>Not opened yet</Chip>}</span>
                </div>
                {l.pages.length ? <p className="text-muted-foreground text-xs">Pages: {l.pages.join(", ")}</p> : null}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <code className="bg-muted rounded px-2 py-1 [overflow-wrap:anywhere]">{url}</code>
                  <Button size="xs" variant="ghost" className="rounded-full" onClick={() => void navigator.clipboard?.writeText(url)}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                  {l.note ? <span className="text-muted-foreground">{l.note}</span> : null}
                  <span className="text-muted-foreground">Made {when(l.created_at)}</span>
                  <Button size="xs" variant="ghost" className="ml-auto rounded-full text-rose-600" disabled={busy} onClick={async () => (await call({ action: "link_remove", code: l.code })) && (await load())}>
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">{data ? "No links yet. Make one above for your next application." : "Loading…"}</p>
      )}
      {data && data.recent.length ? (
        <>
          <h2 className="mt-10 flex items-center gap-2 text-xl font-semibold">
            <Eye className="size-5" /> Recent opens
          </h2>
          <ul className="border-border bg-card mt-4 divide-y rounded-2xl border text-sm">
            {data.recent.map((r, i) => (
              <li key={i} className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2.5">
                <span className="font-medium">{r.company || r.code}</span>
                <span className="text-muted-foreground">{r.page}</span>
                <span className="text-muted-foreground">{r.device}</span>
                <span className="text-muted-foreground ml-auto tabular-nums">{when(r.at)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}
