import ArrowLeft from "@iconify-react/solar/arrow-left-linear";
import ArrowRight from "@iconify-react/solar/arrow-right-linear";
import CheckCircle from "@iconify-react/solar/check-circle-linear";
import Download from "@iconify-react/solar/download-minimalistic-linear";
import Letter from "@iconify-react/solar/letter-linear";
import MapPoint from "@iconify-react/solar/map-point-linear";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { education, jobs, metrics, profile, skills, studies, tracks, type CaseStudy, type TrackSlug } from "./data";
import { A, Chip, FlowDiagram, LinkedInIcon, Section } from "./parts";
import { visitCode } from "./track";

const bySlug = (s: string) => studies.find((x) => x.slug === s);

function Hero({ track }: { track?: (typeof tracks)[number] }) {
  return (
    <section className="relative overflow-hidden">
      <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pt-12 pb-4 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="ok">
              <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" aria-hidden /> {profile.status}
            </Chip>
            {track ? <Chip tone="primary">Viewing as: {track.label}</Chip> : null}
          </div>
          <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">{profile.name}</h1>
          <p className="text-primary mt-1 text-lg font-semibold sm:text-xl">{profile.title}</p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed">{profile.pitch}</p>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">{profile.summary}</p>
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <MapPoint className="size-4" /> {profile.location}
            </span>
            <span>Open to: {profile.availability}</span>
          </div>
          <div className="no-print mt-6 flex flex-wrap gap-2">
            <Button asChild className="h-10 rounded-full px-5">
              <a href={profile.resumePdf} download>
                <Download className="size-4" /> Download resume
              </a>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full px-5">
              <A to="/#contact">
                <Letter className="size-4" /> Contact me
              </A>
            </Button>
            <Button asChild variant="ghost" className="h-10 rounded-full px-4">
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                <LinkedInIcon /> LinkedIn
              </a>
            </Button>
          </div>
        </div>
        <div className="hidden lg:block">
          {profile.headshot ? (
            <img src={profile.headshot} alt={`${profile.name}, headshot`} className="border-border size-56 rounded-3xl border object-cover shadow-sm" />
          ) : (
            <div className="bg-primary text-primary-foreground grid size-56 place-items-center rounded-3xl text-6xl font-semibold shadow-sm">{profile.initials}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function Results() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6" aria-label="Results">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <li key={m.label}>
            <A to={`/work/${m.study}`} className="border-border bg-card hover:border-primary/50 group grid h-full gap-1 rounded-2xl border p-4 transition-colors">
              <span className="text-primary text-3xl font-semibold tabular-nums">{m.value}</span>
              <span className="text-sm leading-snug">{m.label}</span>
              <span className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs">
                {m.source} <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </A>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TrackPicker({ current }: { current?: TrackSlug }) {
  return (
    <div className="no-print mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-2xl border p-3">
        <span className="px-1 text-sm font-medium">Hiring for:</span>
        {tracks.map((t) => (
          <A key={t.slug} to={current === t.slug ? "/" : `/for/${t.slug}`} className={cn("rounded-full border px-3 py-1 text-sm", current === t.slug ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
            {t.label}
          </A>
        ))}
      </div>
    </div>
  );
}

function StudyCard({ s }: { s: CaseStudy }) {
  return (
    <A to={`/work/${s.slug}`} className="border-border bg-card hover:border-primary/50 group flex h-full flex-col gap-2 rounded-2xl border p-5 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="primary">{s.tag}</Chip>
        {s.status ? <Chip>{s.status}</Chip> : null}
      </div>
      <h3 className="text-lg leading-snug font-semibold">{s.title}</h3>
      <p className="text-muted-foreground text-sm">
        {s.org} · {s.when}
      </p>
      <p className="text-sm leading-relaxed">{s.summary}</p>
      <span className="text-primary mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium">
        Read the case study <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </A>
  );
}

function Experience() {
  const [open, setOpen] = useState<string | null>(jobs[0].org);
  return (
    <Section id="experience" eyebrow="Experience" title="Where I've done it" lead="Healthcare, banking, hospitality and an enterprise server data center.">
      <ol className="border-border relative grid gap-3 border-l pl-5">
        {jobs.map((j) => {
          const on = open === j.org;
          return (
            <li key={j.org} className="relative">
              <span className={cn("absolute top-5 -left-[26.5px] size-3 rounded-full border-2", on ? "border-primary bg-primary" : "border-border bg-background")} aria-hidden />
              <div className="border-border bg-card rounded-2xl border">
                <button type="button" className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 p-4 text-left" onClick={() => setOpen(on ? null : j.org)} aria-expanded={on}>
                  <span className="font-semibold">{j.title}</span>
                  <span className="text-muted-foreground">{j.org}</span>
                  <span className="text-muted-foreground ml-auto text-sm tabular-nums">{j.dates}</span>
                </button>
                {on ? (
                  <div className="grid gap-3 px-4 pb-4">
                    <p className="text-muted-foreground -mt-2 text-sm">{j.location}</p>
                    <ul className="grid gap-1.5 text-sm leading-relaxed">
                      {j.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <CheckCircle className="text-primary mt-0.5 size-4 shrink-0" /> <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    {j.studies.length ? (
                      <div className="flex flex-wrap gap-2">
                        {j.studies.map((sl) => (
                          <A key={sl} to={`/work/${sl}`} className="text-primary text-sm font-medium hover:underline">
                            Case study: {bySlug(sl)?.title} →
                          </A>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function Skills({ focus }: { focus?: readonly string[] }) {
  const groups = focus ? [...skills].sort((a, b) => (focus.includes(b.name) ? 1 : 0) - (focus.includes(a.name) ? 1 : 0)) : skills;
  return (
    <Section id="skills" eyebrow="Skills" title="What I work with" lead="Skills that link to a case study have the proof behind them. Tap one to see it.">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.name} className={cn("border-border bg-card rounded-2xl border p-5", focus?.includes(g.name) && "border-primary/40")}>
            <h3 className="font-semibold">{g.name}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {g.items.map((i) => (
                <li key={i.skill}>
                  {i.studies?.length ? (
                    <A to={`/work/${i.studies[0]}`} className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm">
                      {i.skill} <ArrowRight className="size-3" />
                    </A>
                  ) : (
                    <span className="bg-muted inline-flex rounded-full px-3 py-1 text-sm">{i.skill}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Credentials() {
  return (
    <Section id="credentials" eyebrow="Credentials" title="Certifications, training and education">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="text-muted-foreground text-sm font-medium">Certification</h3>
          {education.certifications.map((c) => (
            <p key={c} className="mt-2 text-lg font-semibold">
              {c}
            </p>
          ))}
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="text-muted-foreground text-sm font-medium">Training</h3>
          <ul className="mt-2 grid gap-1.5">
            {education.training.map((t) => (
              <li key={t.name}>
                <span className="font-semibold">{t.name}</span> <span className="text-muted-foreground text-sm">· {t.by}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="text-muted-foreground text-sm font-medium">Education</h3>
          <p className="mt-2 font-semibold">{education.degree.detail}</p>
          <p className="text-muted-foreground text-sm">
            {education.degree.school} · {education.degree.year}
          </p>
        </div>
      </div>
    </Section>
  );
}

function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [f, setF] = useState({ name: "", email: "", company: "", role: "", message: "", company_website: "" });
  const send = async () => {
    setState("sending");
    try {
      const body = new URLSearchParams({ "form-name": "contact", ...f, came_from: visitCode() || "direct" });
      const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
      setState(r.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };
  const ok = f.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) && f.message.trim().length > 5;
  return (
    <Section id="contact" eyebrow="Contact" title="Let's talk" lead="Hiring for infrastructure, systems, network, endpoint or IT operations engineering? I'd like to hear about it.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid content-start gap-3">
          <a href={`mailto:${profile.email}`} className="border-border bg-card hover:border-primary/50 flex items-center gap-3 rounded-2xl border p-4">
            <Letter className="text-primary size-5" /> <span className="font-medium">{profile.email}</span>
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="border-border bg-card hover:border-primary/50 flex items-center gap-3 rounded-2xl border p-4">
            <LinkedInIcon className="text-primary size-5" /> <span className="font-medium">LinkedIn profile</span>
          </a>
          <a href={profile.resumePdf} download className="border-border bg-card hover:border-primary/50 flex items-center gap-3 rounded-2xl border p-4">
            <Download className="text-primary size-5" /> <span className="font-medium">Download resume (PDF)</span>
          </a>
        </div>
        <form
          className="border-border bg-card no-print grid gap-3 rounded-2xl border p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (ok) void send();
          }}
        >
          {state === "sent" ? (
            <p className="flex items-center gap-2 py-8 text-center font-medium">
              <CheckCircle className="size-5 text-emerald-600" /> Thanks, your message is on its way. I'll reply by email.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  Your name
                  <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required />
                </label>
                <label className="grid gap-1 text-sm">
                  Work email
                  <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required />
                </label>
                <label className="grid gap-1 text-sm">
                  Company
                  <Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} autoComplete="organization" />
                </label>
                <label className="grid gap-1 text-sm">
                  Role you're hiring for
                  <Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
                </label>
              </div>
              <label className="grid gap-1 text-sm">
                Message
                <Textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={4} required />
              </label>
              <label className="hidden" aria-hidden>
                Leave this empty
                <input tabIndex={-1} autoComplete="off" value={f.company_website} onChange={(e) => setF({ ...f, company_website: e.target.value })} />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="h-10 rounded-full px-5" disabled={!ok || state === "sending"}>
                  {state === "sending" ? "Sending…" : "Send message"}
                </Button>
                {state === "error" ? <span className="text-sm text-rose-600">That didn't send. Please email {profile.email} instead.</span> : null}
              </div>
            </>
          )}
        </form>
      </div>
    </Section>
  );
}

export function Home({ trackSlug }: { trackSlug?: TrackSlug }) {
  const track = tracks.find((t) => t.slug === trackSlug);
  const list = track ? (track.studies.map(bySlug).filter(Boolean) as CaseStudy[]).concat(studies.filter((s) => !(track.studies as readonly string[]).includes(s.slug))) : studies;
  return (
    <main>
      <Hero track={track} />
      <Results />
      <TrackPicker current={track?.slug} />
      <Section id="work" eyebrow="Case studies" title={track ? `Most relevant for ${track.label} roles` : "Selected work"} lead="Each one covers the problem, my role, what I did, the tools and the result.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <li key={s.slug}>
              <StudyCard s={s} />
            </li>
          ))}
        </ul>
      </Section>
      <Experience />
      <Skills focus={track?.focus} />
      <Credentials />
      <Contact />
    </main>
  );
}

export function StudyPage({ slug }: { slug: string }) {
  const s = bySlug(slug);
  if (!s) return <NotFound />;
  const i = studies.indexOf(s);
  const next = studies[(i + 1) % studies.length];
  const block = "border-border bg-card rounded-2xl border p-5";
  return (
    <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <A to="/#work" className="text-muted-foreground hover:text-foreground no-print inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" /> All case studies
      </A>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Chip tone="primary">{s.tag}</Chip>
        {s.status ? <Chip>{s.status}</Chip> : null}
      </div>
      <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{s.title}</h1>
      <p className="text-muted-foreground mt-2">
        {s.org} · {s.when}
      </p>
      <p className="mt-4 text-lg leading-relaxed">{s.summary}</p>
      {s.results.length ? (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {s.results.map((r) => (
            <li key={r} className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm font-medium">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> {r}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-8 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className={block}>
            <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">The problem</h2>
            <p className="mt-2 leading-relaxed">{s.problem}</p>
          </div>
          <div className={block}>
            <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">My role</h2>
            <p className="mt-2 leading-relaxed">{s.role}</p>
          </div>
        </div>
        <div className={block}>
          <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">What I did</h2>
          <ul className="mt-3 grid gap-2">
            {s.did.map((d) => (
              <li key={d} className="flex gap-2 leading-relaxed">
                <CheckCircle className="text-primary mt-1 size-4 shrink-0" /> <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <FlowDiagram flow={s.flow} />
        <div className={block}>
          <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">Tools</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {s.stack.map((t) => (
              <li key={t} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
        </div>
        {s.next ? (
          <div className={block}>
            <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">What's next</h2>
            <p className="mt-2 leading-relaxed">{s.next}</p>
          </div>
        ) : null}
      </div>
      <div className="no-print mt-10 flex flex-wrap items-center justify-between gap-3">
        <A to="/#contact" className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 font-medium">
          Talk to me about this
        </A>
        <A to={`/work/${next.slug}`} className="text-primary inline-flex items-center gap-1 font-medium">
          Next: {next.title} <ArrowRight className="size-4" />
        </A>
      </div>
    </main>
  );
}

export function ResumePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Resume</h1>
        <Button asChild className="h-10 rounded-full px-5">
          <a href={profile.resumePdf} download>
            <Download className="size-4" /> Download PDF
          </a>
        </Button>
      </div>
      <p className="text-muted-foreground mt-2">The same resume I send with applications. The case studies on this site go deeper on each role.</p>
      <object data={profile.resumePdf} type="application/pdf" className="border-border mt-6 hidden h-[80vh] w-full rounded-2xl border md:block" aria-label="Resume PDF">
        <a href={profile.resumePdf}>Open the resume PDF</a>
      </object>
      <a href={profile.resumePdf} className="border-border bg-card mt-6 flex items-center justify-center gap-2 rounded-2xl border p-6 font-medium md:hidden">
        <Download className="size-5" /> Open the resume (PDF)
      </a>
    </main>
  );
}

export function NotFound() {
  return (
    <main className="mx-auto grid max-w-xl gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">That page isn't here</h1>
      <A to="/" className="text-primary font-medium">
        Go to the home page →
      </A>
    </main>
  );
}
