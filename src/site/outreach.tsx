import {
  AlarmClock,
  Check,
  ClipboardPaste,
  Copy,
  ExternalLink,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { Chip, LinkedInIcon } from "./parts";

/**
 * Outreach: leads found twice a day (or pasted), with drafts Bernie sends himself.
 * Nothing here sends anything. LinkedIn = copy + open; email = opens a Gmail draft in his own account.
 */
const OUTREACH_URL =
  "https://subletlyco.app.n8n.cloud/webhook/bernie-outreach-admin";
const GMAIL_ACCOUNT = "bricebernie@gmail.com";
const NOTE_LIMIT = 200;

type Status =
  "new" | "sent" | "followed_up" | "replied" | "not_interested" | "skipped";
export interface Lead {
  lead_key: string;
  origin: string;
  status: Status;
  company: string;
  company_domain: string;
  job_title: string;
  job_url: string;
  job_location: string;
  work_setup: string;
  job_verified: boolean | string;
  reports_to: string;
  contact_name: string;
  contact_title: string;
  contact_type: string;
  contact_confidence: string;
  contact_source_url: string;
  contact_email: string;
  linkedin_url: string;
  linkedin_search_url: string;
  fit_reason: string;
  matched_skills: string[];
  gaps: string[];
  score: number | string;
  note_draft: string;
  message_draft: string;
  email_subject: string;
  email_draft: string;
  link_code: string;
  created_at: string;
  sent_at: string;
  sent_channel: string;
  follow_up_at: string;
  replied_at: string;
  notes: string;
  evidence?: { job_status?: number; location_ok?: boolean };
}
interface LinkStat {
  code: string;
  visits: number;
  last_visit: string;
  pages: string[];
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
const day = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
      })
    : "";
const truthy = (v: unknown) => v === true || v === "true";
const firstName = (l: Lead) =>
  (l.contact_name || "").trim().split(/\s+/)[0] || "there";
const followDue = (l: Lead) =>
  l.status === "sent" &&
  !!l.follow_up_at &&
  Date.parse(l.follow_up_at) <= Date.now();

const CONF: Record<string, { label: string; hint: string; tone: string }> = {
  confirmed: {
    label: "Confirmed",
    hint: "Name and title found on the company's own site.",
    tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  likely: {
    label: "Likely",
    hint: "From public search results. Check their profile before sending.",
    tone: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  added: {
    label: "Added by you",
    hint: "You added this contact.",
    tone: "bg-sky-500/12 text-sky-800 dark:text-sky-300",
  },
  title_only: {
    label: "Find on LinkedIn",
    hint: "No named person yet. Search LinkedIn for who owns this role.",
    tone: "bg-muted text-muted-foreground",
  },
};
/** Fit, 0 to 100: skills matched on the resume, posting and contact checks, with missing nice-to-haves capped so one long wish list doesn't sink a good lead. */
const fitScore = (l: Lead) =>
  Math.max(
    0,
    Math.min(
      100,
      50 +
        Math.min(l.matched_skills?.length || 0, 6) * 6 +
        (truthy(l.job_verified) ? 10 : 0) +
        (l.contact_confidence === "confirmed"
          ? 10
          : l.contact_confidence === "likely" ||
              l.contact_confidence === "added"
            ? 5
            : 0) -
        Math.min(l.gaps?.length || 0, 3) * 7 -
        (l.evidence?.location_ok === false ? 20 : 0),
    ),
  );

const FILTERS: { key: string; label: string; test: (l: Lead) => boolean }[] = [
  { key: "new", label: "To send", test: (l) => l.status === "new" },
  { key: "due", label: "Follow up due", test: followDue },
  {
    key: "sent",
    label: "Waiting",
    test: (l) =>
      (l.status === "sent" && !followDue(l)) || l.status === "followed_up",
  },
  { key: "replied", label: "Replied", test: (l) => l.status === "replied" },
  {
    key: "closed",
    label: "Closed",
    test: (l) => l.status === "not_interested" || l.status === "skipped",
  },
  { key: "all", label: "All", test: () => true },
];

function gmailUrl(to: string, subject: string, body: string) {
  const q = new URLSearchParams({
    view: "cm",
    fs: "1",
    authuser: GMAIL_ACCOUNT,
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${q.toString()}`;
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function LeadCard({
  lead,
  stat,
  busy,
  onSave,
}: {
  lead: Lead;
  stat?: LinkStat;
  busy: boolean;
  onSave: (patch: Record<string, string>) => Promise<boolean>;
}) {
  const [note, setNote] = useState(lead.note_draft);
  const [msg, setMsg] = useState(lead.message_draft);
  const [subj, setSubj] = useState(lead.email_subject);
  const [body, setBody] = useState(lead.email_draft);
  const [to, setTo] = useState(lead.contact_email);
  const [notes, setNotes] = useState(lead.notes);
  const [who, setWho] = useState("");
  const nameIt = (name: string) => {
    const n = name.trim().split(/\s+/)[0] || "";
    const from = (t: string) =>
      t.replace(/^(Hi|Hello) [^,\n]+,/, `$1 ${n || "there"},`);
    setWho(name);
    setNote(from(note));
    setMsg(from(msg));
    setBody(from(body));
  };
  const [open, setOpen] = useState<"" | "note" | "msg" | "email">(
    lead.status === "new" ? "note" : "",
  );
  const [flash, setFlash] = useState("");
  useEffect(() => {
    setNote(lead.note_draft);
    setMsg(lead.message_draft);
    setSubj(lead.email_subject);
    setBody(lead.email_draft);
    setTo(lead.contact_email);
    setNotes(lead.notes);
  }, [lead]);
  const dirty =
    note !== lead.note_draft ||
    msg !== lead.message_draft ||
    subj !== lead.email_subject ||
    body !== lead.email_draft ||
    to !== lead.contact_email ||
    notes !== lead.notes;
  const conf = CONF[lead.contact_confidence] || CONF.title_only;
  const profile = lead.linkedin_url || lead.linkedin_search_url;
  const say = (t: string) => {
    setFlash(t);
    window.setTimeout(() => setFlash(""), 2200);
  };
  const saveEdits = () =>
    onSave({
      note_draft: note,
      message_draft: msg,
      email_subject: subj,
      email_draft: body,
      contact_email: to,
      notes,
    });
  const setStatus = async (status: Status, channel?: string) => {
    const ok = await onSave({
      status,
      ...(channel ? { channel } : {}),
      ...(dirty
        ? {
            note_draft: note,
            message_draft: msg,
            email_subject: subj,
            email_draft: body,
            contact_email: to,
            notes,
          }
        : {}),
    });
    if (ok)
      say(
        status === "sent"
          ? "Marked sent. Follow-up reminder set for 6 days."
          : "Saved",
      );
  };
  const followUp = `Hi ${firstName(lead)}, following up on my note about the ${lead.job_title} role at ${lead.company}. I'm still very interested and happy to share more about my infrastructure work. Here's my portfolio if helpful: https://berniebrice.com/?for=${lead.link_code}\n\nBernie`;
  const score = fitScore(lead);
  const tab = (k: typeof open, label: string, extra?: string) => (
    <button
      type="button"
      onClick={() => setOpen(open === k ? "" : k)}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        open === k
          ? "bg-foreground text-background"
          : "bg-muted hover:bg-secondary",
      )}
    >
      {label}
      {extra ? <span className="ml-1.5 opacity-70">{extra}</span> : null}
    </button>
  );
  return (
    <li
      className={cn(
        "border-border bg-card grid gap-4 rounded-2xl border p-5",
        followDue(lead) && "ring-2 ring-amber-400/70",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-tight font-semibold">{lead.company}</p>
          <p className="mt-0.5">
            {lead.job_url ? (
              <a
                href={lead.job_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                {lead.job_title}{" "}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : (
              lead.job_title
            )}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {[lead.job_location, lead.work_setup].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {followDue(lead) ? (
            <Chip className="bg-amber-500/15 text-amber-800 dark:text-amber-300">
              <AlarmClock className="mr-1 size-3.5" /> Follow up due
            </Chip>
          ) : null}
          {lead.status !== "new" ? (
            <Chip tone={lead.status === "replied" ? "ok" : "muted"}>
              {lead.status === "sent"
                ? `Sent ${day(lead.sent_at)}${lead.sent_channel ? " · " + lead.sent_channel : ""}`
                : lead.status === "followed_up"
                  ? "Followed up"
                  : lead.status === "replied"
                    ? `Replied ${day(lead.replied_at)}`
                    : lead.status === "not_interested"
                      ? "Not interested"
                      : "Skipped"}
            </Chip>
          ) : null}
          {truthy(lead.job_verified) ? (
            <Chip tone="ok">
              <ShieldCheck className="mr-1 size-3.5" /> Posting checked
            </Chip>
          ) : lead.origin === "paste" ? (
            <Chip>Pasted</Chip>
          ) : lead.evidence?.job_status === 200 ? (
            <span title="The job link opens. The page loads its text by script, so open it once to confirm it's still posted.">
              <Chip>Link works</Chip>
            </span>
          ) : (
            <Chip className="bg-amber-500/15 text-amber-800 dark:text-amber-300">
              Check posting
            </Chip>
          )}
          <Chip tone={score >= 70 ? "primary" : "muted"}>Fit {score}</Chip>
        </div>
      </div>

      <div className="bg-muted/60 grid gap-2 rounded-xl p-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <p className="font-medium">
            {lead.contact_name
              ? `${lead.contact_name}${lead.contact_title ? ", " + lead.contact_title : ""}`
              : lead.reports_to
                ? `Reports to: ${lead.reports_to}`
                : "Hiring manager not named"}
            <span
              className={cn(
                "ml-2 inline-flex rounded-full px-2 py-0.5 align-middle text-[11px] font-medium",
                conf.tone,
              )}
              title={conf.hint}
            >
              {conf.label}
            </span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {conf.hint}
            {lead.contact_source_url &&
            !/linkedin\.com/.test(lead.contact_source_url) ? (
              <>
                {" "}
                <a
                  href={lead.contact_source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Source
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!lead.contact_name ? (
            <Input
              value={who}
              onChange={(e) => nameIt(e.target.value)}
              placeholder="Their first name"
              aria-label="Contact's first name, fills in the drafts"
              className="h-8 w-40 text-sm"
            />
          ) : null}
          {lead.linkedin_url ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              asChild
            >
              <a href={lead.linkedin_url} target="_blank" rel="noreferrer">
                <LinkedInIcon /> Profile
              </a>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="rounded-full" asChild>
            <a href={lead.linkedin_search_url} target="_blank" rel="noreferrer">
              <Search className="size-4" /> Search LinkedIn
            </a>
          </Button>
        </div>
      </div>

      {lead.fit_reason ? (
        <p className="text-sm leading-relaxed">{lead.fit_reason}</p>
      ) : null}
      {lead.matched_skills?.length || lead.gaps?.length ? (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {lead.matched_skills.map((s) => (
            <span
              key={s}
              className="bg-primary/10 text-primary rounded-full px-2 py-0.5"
            >
              {s}
            </span>
          ))}
          {lead.gaps.length ? (
            <span className="text-muted-foreground ml-1">
              Not on your resume: {lead.gaps.join(", ")}
            </span>
          ) : null}
        </div>
      ) : null}
      {stat?.visits ? (
        <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
          They opened your site: {stat.visits} page
          {stat.visits === 1 ? "" : "s"}, last {when(stat.last_visit)}
          {stat.pages.length ? ` · ${stat.pages.slice(0, 4).join(", ")}` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tab("note", "LinkedIn note", `${note.length}/${NOTE_LIMIT}`)}
        {tab("msg", "Message after they accept")}
        {tab("email", "Email")}
      </div>

      {open === "note" ? (
        <div className="grid gap-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            aria-label="LinkedIn connection note"
            className={cn(note.length > NOTE_LIMIT && "border-rose-500")}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="rounded-full"
              onClick={async () => {
                if (await copy(note))
                  say("Note copied. Paste it into “Add a note” on LinkedIn.");
                window.open(profile, "_blank", "noopener");
              }}
            >
              <Copy className="size-4" /> Copy note + open{" "}
              {lead.linkedin_url ? "profile" : "LinkedIn search"}
            </Button>
            {note.length > NOTE_LIMIT ? (
              <span className="text-xs text-rose-600">
                Over {NOTE_LIMIT} characters. LinkedIn may cut it off.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      {open === "msg" ? (
        <div className="grid gap-2">
          <Textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={7}
            aria-label="LinkedIn message"
          />
          <Button
            size="sm"
            variant="outline"
            className="justify-self-start rounded-full"
            onClick={async () => (await copy(msg)) && say("Message copied")}
          >
            <Copy className="size-4" /> Copy message
          </Button>
        </div>
      ) : null}
      {open === "email" ? (
        <div className="grid gap-2">
          <label className="grid gap-1 text-sm">
            To{" "}
            {lead.contact_email ? (
              <span className="text-muted-foreground text-xs">
                Published on their site
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                No public email found. Only add one they published themselves.
              </span>
            )}
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              placeholder="name@company.com"
              type="email"
            />
          </label>
          <Input
            value={subj}
            onChange={(e) => setSubj(e.target.value)}
            aria-label="Subject"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            aria-label="Email body"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={!to}
              onClick={() =>
                window.open(gmailUrl(to, subj, body), "_blank", "noopener")
              }
            >
              <Mail className="size-4" /> Open in Gmail
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={async () =>
                (await copy(`${subj}\n\n${body}`)) && say("Email copied")
              }
            >
              <Copy className="size-4" /> Copy email
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Opens a draft in {GMAIL_ACCOUNT}. Nothing sends until you press Send
            in Gmail.
          </p>
        </div>
      ) : null}

      {followDue(lead) ? (
        <div className="grid gap-2 rounded-xl bg-amber-500/10 p-3">
          <p className="text-sm font-medium">
            It's been 6 days. A short, polite follow-up:
          </p>
          <p className="text-sm whitespace-pre-line">{followUp}</p>
          <Button
            size="sm"
            variant="outline"
            className="justify-self-start rounded-full"
            onClick={async () =>
              (await copy(followUp)) && say("Follow-up copied")
            }
          >
            <Copy className="size-4" /> Copy follow-up
          </Button>
        </div>
      ) : null}

      <div className="border-border flex flex-wrap items-center gap-2 border-t pt-4">
        {lead.status === "new" ? (
          <>
            <Button
              size="sm"
              className="rounded-full"
              disabled={busy}
              onClick={() => void setStatus("sent", "linkedin")}
            >
              <Check className="size-4" /> Sent on LinkedIn
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={busy}
              onClick={() => void setStatus("sent", "email")}
            >
              <Check className="size-4" /> Sent by email
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              disabled={busy}
              onClick={() => void setStatus("skipped")}
            >
              Skip
            </Button>
          </>
        ) : lead.status === "sent" || lead.status === "followed_up" ? (
          <>
            <Button
              size="sm"
              className="rounded-full"
              disabled={busy}
              onClick={() => void setStatus("replied")}
            >
              They replied
            </Button>
            {lead.status === "sent" ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => void setStatus("followed_up")}
              >
                Followed up
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              disabled={busy}
              onClick={() => void setStatus("not_interested")}
            >
              Not interested
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            disabled={busy}
            onClick={() => void setStatus("new")}
          >
            Move back to “To send”
          </Button>
        )}
        {dirty ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={async () => (await saveEdits()) && say("Edits saved")}
          >
            Save edits
          </Button>
        ) : null}
        {flash ? (
          <span
            className="text-sm text-emerald-700 dark:text-emerald-300"
            role="status"
          >
            {flash}
          </span>
        ) : null}
        <span className="text-muted-foreground ml-auto text-xs">
          Found {day(lead.created_at)}
          {lead.origin === "paste" ? " · pasted" : ""}
        </span>
      </div>
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Private notes (only you see these)"
        aria-label="Private notes"
        className="text-sm"
      />
    </li>
  );
}

function PasteJob({
  busy,
  onPaste,
}: {
  busy: boolean;
  onPaste: (f: Record<string, string>) => Promise<boolean>;
}) {
  const empty = {
    text: "",
    job_url: "",
    contact_name: "",
    contact_title: "",
    linkedin_url: "",
    contact_type: "hiring_manager",
  };
  const [f, setF] = useState(empty);
  const [tried, setTried] = useState(false);
  const short = f.text.trim().length < 200;
  return (
    <form
      className="border-border bg-card grid gap-3 rounded-2xl border p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setTried(true);
        if (short) return;
        if (await onPaste(f)) {
          setF(empty);
          setTried(false);
        }
      }}
    >
      <p className="font-semibold">Paste a job you found</p>
      <p className="text-muted-foreground -mt-2 text-sm">
        Copy the whole job post (from LinkedIn or anywhere) and paste it here.
        Add the person from "Meet the hiring team" if you see one.
      </p>
      <Textarea
        value={f.text}
        onChange={(e) => setF({ ...f, text: e.target.value })}
        rows={6}
        placeholder="Paste the full job post…"
        aria-label="Job post"
        aria-invalid={tried && short}
      />
      {tried && short ? (
        <p className="-mt-1 text-sm text-rose-600">
          Paste the full job post (at least a few paragraphs).
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          value={f.job_url}
          onChange={(e) => setF({ ...f, job_url: e.target.value.trim() })}
          placeholder="Job link (optional)"
          aria-label="Job link"
        />
        <Input
          value={f.linkedin_url}
          onChange={(e) => setF({ ...f, linkedin_url: e.target.value.trim() })}
          placeholder="Their LinkedIn profile link (optional)"
          aria-label="LinkedIn profile link"
        />
        <Input
          value={f.contact_name}
          onChange={(e) => setF({ ...f, contact_name: e.target.value })}
          placeholder="Their name (optional)"
          aria-label="Contact name"
        />
        <Input
          value={f.contact_title}
          onChange={(e) => setF({ ...f, contact_title: e.target.value })}
          placeholder="Their title (optional)"
          aria-label="Contact title"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="ctype"
            checked={f.contact_type === "hiring_manager"}
            onChange={() => setF({ ...f, contact_type: "hiring_manager" })}
          />{" "}
          Hiring manager
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="ctype"
            checked={f.contact_type === "recruiter"}
            onChange={() => setF({ ...f, contact_type: "recruiter" })}
          />{" "}
          Recruiter
        </label>
        <Button type="submit" className="ml-auto rounded-full" disabled={busy}>
          <Sparkles className="size-4" />{" "}
          {busy ? "Drafting… about 30 seconds" : "Draft messages"}
        </Button>
      </div>
    </form>
  );
}

export function Outreach({ pass, links }: { pass: string; links: LinkStat[] }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("new");
  const [page, setPage] = useState(1);
  const listTop = useRef<HTMLDivElement>(null);
  const [pasting, setPasting] = useState(false);
  const call = useCallback(
    async (
      body: Record<string, unknown>,
    ): Promise<Record<string, unknown> | null> => {
      setBusy(true);
      setErr("");
      try {
        const r = await fetch(OUTREACH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Studio-Key": pass },
          body: JSON.stringify(body),
        });
        if (r.status === 401 || r.status === 403)
          throw new Error("That passcode didn't work.");
        const d = (await r.json().catch(() => ({
          ok: false,
          error: "Outreach isn't reachable right now. Try again in a minute.",
        }))) as Record<string, unknown>;
        if (!d.ok) throw new Error(String(d.error || "Something went wrong."));
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
  const load = useCallback(async () => {
    const d = await call({ action: "list" });
    if (d) setLeads(d.leads as Lead[]);
  }, [call]);
  useEffect(() => {
    void load();
  }, [load]);
  const stats = useMemo(
    () => Object.fromEntries(links.map((l) => [l.code, l])),
    [links],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, (leads || []).filter(f.test).length]),
      ),
    [leads],
  );
  const list = (leads || [])
    .filter((FILTERS.find((f) => f.key === filter) || FILTERS[0]).test)
    .sort((a, b) =>
      filter === "new"
        ? fitScore(b) - fitScore(a)
        : String(b.created_at).localeCompare(String(a.created_at)),
    );
  // 5 leads per page; if a lead leaves this filter and empties the last page, step back one page.
  const PER_PAGE = 5;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const pageList = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const nums: (number | "gap")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - cur) <= 2) nums.push(i);
    else if (nums[nums.length - 1] !== "gap") nums.push("gap");
  }
  const goPage = (n: number) => {
    setPage(Math.max(1, Math.min(pages, n)));
    const el = listTop.current;
    if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pagePill = (on: boolean) =>
    cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40", on ? "bg-foreground text-background" : "hover:bg-muted");
  const save = async (key: string, patch: Record<string, string>) => {
    const d = await call({ action: "update", lead_key: key, ...patch });
    if (d?.lead)
      setLeads((ls) =>
        (ls || []).map((l) =>
          l.lead_key === key
            ? {
                ...l,
                ...(d.lead as Partial<Lead>),
                matched_skills: l.matched_skills,
                gaps: l.gaps,
              }
            : l,
        ),
      );
    return !!d;
  };
  const paste = async (f: Record<string, string>) => {
    const d = await call({ action: "paste", ...f });
    if (d) {
      await load();
      setFilter("new");
      setPasting(false);
    }
    return !!d;
  };
  return (
    <section>
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-3xl font-semibold tracking-tight">Outreach</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            New leads arrive twice a day (6:47 AM and 1:47 PM). Each one has
            drafts written from your resume. You send everything yourself;
            nothing here sends a message.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setPasting((v) => !v)}
        >
          <ClipboardPaste className="size-4" /> Paste a job
        </Button>
        <Button
          variant="ghost"
          className="rounded-full"
          disabled={busy}
          onClick={() => void load()}
          aria-label="Refresh"
        >
          <RefreshCw className={cn("size-4", busy && "animate-spin")} />
        </Button>
      </div>
      {pasting ? (
        <div className="mt-5">
          <PasteJob busy={busy} onPaste={paste} />
        </div>
      ) : null}
      <div
        className="mt-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Lead filter"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-secondary",
              f.key === "due" && counts.due ? "ring-2 ring-amber-400/70" : "",
            )}
          >
            {f.label} <span className="opacity-70">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
      {leads === null ? (
        <p className="text-muted-foreground mt-6 text-sm">Loading…</p>
      ) : list.length ? (
        <div ref={listTop} className="scroll-mt-24">
          <ul className="mt-5 grid gap-4">
            {pageList.map((l) => (
              <LeadCard
                key={l.lead_key}
                lead={l}
                stat={stats[l.link_code]}
                busy={busy}
                onSave={(p) => save(l.lead_key, p)}
              />
            ))}
          </ul>
          <div className="border-border mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-muted-foreground text-sm tabular-nums">
              Showing {(cur - 1) * PER_PAGE + 1}–{Math.min(cur * PER_PAGE, list.length)} of {list.length} lead{list.length === 1 ? "" : "s"}
            </p>
            {pages > 1 ? (
              <nav className="flex flex-wrap items-center gap-1" aria-label="Lead pages">
                <button type="button" className={pagePill(false)} disabled={cur === 1} onClick={() => goPage(cur - 1)}>
                  ‹ Prev
                </button>
                {nums.map((n, i) =>
                  n === "gap" ? (
                    <span key={`g${i}`} className="text-muted-foreground px-1">
                      …
                    </span>
                  ) : (
                    <button key={n} type="button" className={cn(pagePill(n === cur), "min-w-9 tabular-nums")} aria-current={n === cur ? "page" : undefined} onClick={() => goPage(n)}>
                      {n}
                    </button>
                  ),
                )}
                <button type="button" className={pagePill(false)} disabled={cur === pages} onClick={() => goPage(cur + 1)}>
                  Next ›
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-6 text-sm">
          {filter === "new"
            ? "Nothing waiting. New leads arrive at 6:47 AM and 1:47 PM, or paste a job you found."
            : "Nothing here yet."}
        </p>
      )}
      <p className="text-muted-foreground mt-8 text-xs">
        Tip: about 10 to 15 personal notes a day keeps it genuine. Only use
        emails people published themselves.
      </p>
    </section>
  );
}
