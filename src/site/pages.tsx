import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Download } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { education, jobs, metrics, profile, skills, studies, tracks, type CaseStudy, type TrackSlug } from "./data";
import { NetworkHero } from "./hero";
import { A, FlowDiagram, LinkedInIcon, Reveal, Section } from "./parts";
import { visitCode } from "./track";

const bySlug = (s: string) => studies.find((x) => x.slug === s);
const pill = "inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]";

function Results() {
  return (
    <section aria-label="Results" className="px-5 pt-16 sm:px-8 lg:px-11">
      <Reveal className="mb-8 max-w-2xl">
        <p className="text-primary font-mono text-xs tracking-[0.18em] uppercase">Results</p>
        <p className="mt-3 text-xl leading-relaxed sm:text-2xl">{profile.pitch}</p>
      </Reveal>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.06}>
            <A to={`/work/${m.study}`} className="bg-card group grid h-full gap-2 rounded-[1.75rem] p-6 shadow-sm transition-shadow hover:shadow-md">
              <span className="text-primary text-5xl font-semibold tracking-tight tabular-nums">{m.value}</span>
              <span className="leading-snug">{m.label}</span>
              <span className="text-muted-foreground mt-2 inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.14em] uppercase">
                {m.source} <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </A>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* bento spans for up to 8 cards, following the template's grid */
const SPANS = ["md:col-span-3 md:row-span-2", "md:col-span-3", "md:col-span-3", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3"];
const TINTS = ["bg-primary text-primary-foreground", "bg-card", "bg-accent", "bg-card", "bg-secondary", "bg-card", "bg-secondary", "bg-card"];

function Work({ list, track }: { list: CaseStudy[]; track?: (typeof tracks)[number] }) {
  return (
    <Section id="work" eyebrow="Case studies" title={track ? `Most relevant for ${track.label} roles` : "Selected work"} lead="Real roles, real results. Each case study covers the problem, my role, what I did, the tools and the outcome.">
      <div className="no-print mb-6 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground mr-1 font-mono text-[11px] tracking-[0.14em] uppercase">Hiring for</span>
        {tracks.map((t) => (
          <A key={t.slug} to={track?.slug === t.slug ? "/#work" : `/for/${t.slug}#work`} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", track?.slug === t.slug ? "bg-foreground text-background" : "bg-muted hover:bg-secondary")}>
            {t.label}
          </A>
        ))}
      </div>
      <ul className="grid auto-rows-[220px] gap-4 md:auto-rows-[230px] md:grid-cols-6 lg:auto-rows-[250px]">
        {list.map((s, i) => {
          const dark = i === 0;
          return (
            <motion.li
              key={s.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={cn("group relative overflow-hidden rounded-[1.75rem] shadow-sm", SPANS[i] || "md:col-span-2", TINTS[i] || "bg-card")}
            >
              <A to={`/work/${s.slug}`} className="flex h-full w-full flex-col p-6" aria-label={`${s.title}: ${s.summary}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={cn("rounded-full px-3 py-1 font-mono text-[11px] tracking-[0.14em] uppercase", dark ? "bg-background/15" : "bg-background/70")}>{s.tag}</span>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110", dark ? "bg-background text-foreground" : "bg-foreground text-background")}>
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </div>
                <div className="mt-auto">
                  {s.stat ? <p className={cn("mb-2 font-semibold tracking-tight tabular-nums", i === 0 ? "text-4xl sm:text-5xl" : "text-3xl")}>{s.stat}</p> : null}
                  <h3 className={cn("font-semibold tracking-tight text-balance", i === 0 ? "text-3xl sm:text-4xl" : s.stat ? "text-lg leading-snug" : "text-2xl leading-tight")}>{s.title}</h3>
                  <p className={cn("mt-1 text-sm", dark ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {s.org} · {s.when}
                    {s.status ? ` · ${s.status}` : ""}
                  </p>
                  {i === 0 ? <p className="text-primary-foreground/90 mt-3 hidden max-w-md text-sm leading-relaxed md:block">{s.summary}</p> : null}
                </div>
              </A>
            </motion.li>
          );
        })}
      </ul>
    </Section>
  );
}

/** How I work: each step comes from what the resume shows I do. */
const STEPS = [
  { n: "01", title: "Assess", body: "Walk the site, map what's there and what depends on it: network, hardware, applications and people." },
  { n: "02", title: "Plan", body: "Migration plans with risk assessments and dependency mapping, so cutovers happen without surprises." },
  { n: "03", title: "Build", body: "Onsite execution: firewalls, site-to-site VPNs, switching, VLANs, endpoints and printers, then post-move support." },
  { n: "04", title: "Document", body: "Equipment layouts, site blueprints and runbooks that cut troubleshooting time and make the next project easier." },
];
function Process() {
  return (
    <section id="process" className="bg-secondary scroll-mt-20 px-5 py-20 sm:px-8 lg:px-11 lg:py-28">
      <Reveal className="mb-16 max-w-2xl">
        <p className="text-primary font-mono text-xs tracking-[0.18em] uppercase">How I work</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Four steps, documented, no surprises.</h2>
      </Reveal>
      <ol className="relative grid gap-12 md:grid-cols-4 md:gap-8">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1} className="relative">
            {i < STEPS.length - 1 ? <span aria-hidden className="bg-foreground/25 absolute top-5 left-14 hidden h-px w-[calc(100%-3rem)] md:block" /> : null}
            {i < STEPS.length - 1 ? <span aria-hidden className="bg-foreground/25 absolute top-12 left-5 h-[calc(100%-2rem)] w-px md:hidden" /> : null}
            <li className="flex gap-5 md:block">
              <span className="border-foreground/30 bg-secondary text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-sm">{s.n}</span>
              <div className="md:mt-6">
                <h3 className="text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="text-muted-foreground mt-2 max-w-xs">{s.body}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Experience() {
  const [open, setOpen] = useState<string | null>(jobs[0].org);
  return (
    <Section id="experience" eyebrow="Experience" title="Where I've done it" lead="Healthcare, banking, hospitality and an enterprise server data center.">
      <ol className="grid gap-3">
        {jobs.map((j, i) => {
          const on = open === j.org;
          return (
            <Reveal key={j.org} delay={Math.min(i, 3) * 0.05}>
              <li className="bg-card rounded-[1.5rem] shadow-sm">
                <button type="button" className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-5 text-left" onClick={() => setOpen(on ? null : j.org)} aria-expanded={on}>
                  <span className="text-lg font-semibold">{j.org}</span>
                  <span className="text-muted-foreground">{j.title}</span>
                  <span className="text-muted-foreground ml-auto font-mono text-xs tracking-[0.1em] tabular-nums">{j.dates}</span>
                </button>
                {on ? (
                  <div className="grid gap-4 px-6 pb-6">
                    <p className="text-muted-foreground -mt-2 text-sm">{j.location}</p>
                    <ul className="grid gap-2 leading-relaxed">
                      {j.bullets.map((b) => (
                        <li key={b} className="flex gap-3">
                          <Check className="text-primary mt-1 size-4 shrink-0" /> <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    {j.studies.length ? (
                      <div className="flex flex-wrap gap-2">
                        {j.studies.map((sl) => (
                          <A key={sl} to={`/work/${sl}`} className="bg-muted hover:bg-secondary inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium">
                            {bySlug(sl)?.title} <ArrowUpRight className="size-3.5" />
                          </A>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}

function Skills({ focus }: { focus?: readonly string[] }) {
  const groups = focus ? [...skills].sort((a, b) => (focus.includes(b.name) ? 1 : 0) - (focus.includes(a.name) ? 1 : 0)) : skills;
  return (
    <Section id="skills" eyebrow="Skills" title="What I work with" lead="Skills with an arrow link to a case study that shows them in practice." className="bg-secondary">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g, i) => (
          <Reveal key={g.name} delay={(i % 2) * 0.06}>
            <div className={cn("bg-card h-full rounded-[1.75rem] p-6 shadow-sm", focus?.includes(g.name) && "ring-primary/50 ring-2")}>
              <h3 className="text-lg font-semibold">{g.name}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <li key={it.skill}>
                    {it.studies?.length ? (
                      <A to={`/work/${it.studies[0]}`} className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium">
                        {it.skill} <ArrowUpRight className="size-3.5" />
                      </A>
                    ) : (
                      <span className="bg-muted inline-flex rounded-full px-3.5 py-1.5 text-sm">{it.skill}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Credentials() {
  const card = "bg-card h-full rounded-[1.75rem] p-6 shadow-sm";
  const label = "text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase";
  return (
    <Section id="credentials" eyebrow="Credentials" title="Certified, trained, educated">
      <div className="grid gap-4 md:grid-cols-3">
        <Reveal>
          <div className={card}>
            <p className={label}>Certification</p>
            {education.certifications.map((c) => (
              <p key={c} className="mt-3 text-2xl font-semibold tracking-tight">
                {c}
              </p>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className={card}>
            <p className={label}>Training</p>
            <ul className="mt-3 grid gap-2">
              {education.training.map((t) => (
                <li key={t.name}>
                  <span className="font-semibold">{t.name}</span> <span className="text-muted-foreground">· {t.by}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className={card}>
            <p className={label}>Education</p>
            <p className="mt-3 text-lg font-semibold">{education.degree.detail}</p>
            <p className="text-muted-foreground">
              {education.degree.school} · {education.degree.year}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

const field = "h-12 rounded-xl border-border bg-card px-4 text-base shadow-none";
function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [f, setF] = useState({ name: "", email: "", company: "", role: "", message: "", company_website: "" });
  const ok = f.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) && f.message.trim().length > 5;
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
  return (
    <section id="contact" className="bg-secondary scroll-mt-20 px-5 py-20 sm:px-8 lg:px-11 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
        <Reveal className="lg:col-span-2">
          <p className="text-primary font-mono text-xs tracking-[0.18em] uppercase">Contact</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Let's talk about the role.</h2>
          <p className="text-muted-foreground mt-5 max-w-md">Hiring for infrastructure, systems, network, endpoint or IT operations engineering? A few lines is plenty. I reply by email.</p>
          <dl className="mt-10 grid gap-4 text-sm">
            <div className="border-foreground/15 flex justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd>
                <a href={`mailto:${profile.email}`} className="underline-offset-4 hover:underline">
                  {profile.email}
                </a>
              </dd>
            </div>
            <div className="border-foreground/15 flex justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">LinkedIn</dt>
              <dd>
                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                  <LinkedInIcon /> Bernie Brice
                </a>
              </dd>
            </div>
            <div className="border-foreground/15 flex justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Location</dt>
              <dd>{profile.location}</dd>
            </div>
            <div className="border-foreground/15 flex justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">Resume</dt>
              <dd>
                <a href={profile.resumePdf} download className="underline-offset-4 hover:underline">
                  Download PDF
                </a>
              </dd>
            </div>
          </dl>
        </Reveal>
        <Reveal delay={0.1} className="no-print lg:col-span-3">
          {state === "sent" ? (
            <div className="bg-card grid place-items-center gap-3 rounded-[1.75rem] p-10 text-center shadow-sm">
              <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full">
                <Check className="size-6" />
              </span>
              <p className="text-xl font-semibold">Message sent</p>
              <p className="text-muted-foreground">Thanks. I'll reply by email.</p>
            </div>
          ) : (
            <form
              className="bg-card grid gap-4 rounded-[1.75rem] p-6 shadow-sm sm:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (ok) void send();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Your name
                  <Input className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Work email
                  <Input className={field} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Company
                  <Input className={field} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} autoComplete="organization" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Role you're hiring for
                  <Input className={field} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Message
                <Textarea className="border-border bg-card min-h-32 rounded-xl px-4 py-3 text-base shadow-none" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required />
              </label>
              <label className="hidden" aria-hidden>
                Leave this empty
                <input tabIndex={-1} autoComplete="off" value={f.company_website} onChange={(e) => setF({ ...f, company_website: e.target.value })} />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" disabled={!ok || state === "sending"} className={cn(pill, "bg-primary text-primary-foreground shadow-md disabled:opacity-50 disabled:hover:scale-100")}>
                  {state === "sending" ? "Sending…" : "Send message"}
                </button>
                {state === "error" ? <span className="text-sm text-rose-600">That didn't send. Please email {profile.email}.</span> : null}
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function Home({ trackSlug }: { trackSlug?: TrackSlug }) {
  const track = tracks.find((t) => t.slug === trackSlug);
  const list = track ? (track.studies.map(bySlug).filter(Boolean) as CaseStudy[]).concat(studies.filter((s) => !(track.studies as readonly string[]).includes(s.slug))) : studies;
  return (
    <main>
      <NetworkHero />
      <Results />
      <Work list={list} track={track} />
      <Process />
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
  const block = "bg-card rounded-[1.75rem] p-6 shadow-sm";
  const label = "text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase";
  return (
    <main className="px-5 pt-28 pb-10 sm:px-8 lg:px-11">
      <div className="mx-auto max-w-4xl">
        <A to="/#work" className="text-muted-foreground hover:text-foreground no-print inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="size-4" /> All case studies
        </A>
        <Reveal>
          <p className="text-primary mt-8 font-mono text-xs tracking-[0.18em] uppercase">
            {s.tag}
            {s.status ? ` · ${s.status}` : ""}
          </p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">{s.title}</h1>
          <p className="text-muted-foreground mt-3">
            {s.org} · {s.when}
          </p>
          <p className="mt-5 text-lg leading-relaxed sm:text-xl">{s.summary}</p>
        </Reveal>
        {s.results.length ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {s.results.map((r) => (
              <li key={r} className="bg-primary text-primary-foreground flex items-start gap-3 rounded-[1.25rem] p-4 font-medium">
                <Check className="mt-0.5 size-5 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Reveal className={block}>
              <h2 className={label}>The problem</h2>
              <p className="mt-3 leading-relaxed">{s.problem}</p>
            </Reveal>
            <Reveal delay={0.06} className={block}>
              <h2 className={label}>My role</h2>
              <p className="mt-3 leading-relaxed">{s.role}</p>
            </Reveal>
          </div>
          <Reveal className={block}>
            <h2 className={label}>What I did</h2>
            <ul className="mt-4 grid gap-3">
              {s.did.map((d) => (
                <li key={d} className="flex gap-3 leading-relaxed">
                  <Check className="text-primary mt-1 size-4 shrink-0" /> <span>{d}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <FlowDiagram flow={s.flow} />
          </Reveal>
          <Reveal className={block}>
            <h2 className={label}>Tools</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {s.stack.map((t) => (
                <li key={t} className="bg-secondary text-secondary-foreground rounded-full px-3.5 py-1.5 text-sm">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          {s.next ? (
            <Reveal className={block}>
              <h2 className={label}>What's next</h2>
              <p className="mt-3 leading-relaxed">{s.next}</p>
            </Reveal>
          ) : null}
        </div>
        <div className="no-print mt-10 flex flex-wrap items-center justify-between gap-3">
          <A to="/#contact" className={cn(pill, "bg-primary text-primary-foreground shadow-md")}>
            Talk to me about this
          </A>
          <A to={`/work/${next.slug}`} className="text-primary inline-flex items-center gap-1 font-semibold">
            Next: {next.title} <ArrowRight className="size-4" />
          </A>
        </div>
      </div>
    </main>
  );
}

export function ResumePage() {
  return (
    <main className="px-5 pt-28 pb-10 sm:px-8 lg:px-11">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-primary font-mono text-xs tracking-[0.18em] uppercase">Resume</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">The one-page version.</h1>
          </div>
          <a href={profile.resumePdf} download className={cn(pill, "bg-primary text-primary-foreground shadow-md")}>
            <Download className="size-4" /> Download PDF
          </a>
        </div>
        <p className="text-muted-foreground mt-4">The same resume I send with applications. The case studies go deeper on each role.</p>
        <object data={profile.resumePdf} type="application/pdf" className="bg-card mt-8 hidden h-[80vh] w-full rounded-[1.75rem] shadow-sm md:block" aria-label="Resume PDF">
          <a href={profile.resumePdf}>Open the resume PDF</a>
        </object>
        <a href={profile.resumePdf} className="bg-card mt-8 flex items-center justify-center gap-2 rounded-[1.75rem] p-8 font-semibold shadow-sm md:hidden">
          <Download className="size-5" /> Open the resume (PDF)
        </a>
      </div>
    </main>
  );
}

export function NotFound() {
  return (
    <main className="grid place-items-center gap-4 px-5 pt-40 pb-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">That page isn't here</h1>
      <A to="/" className="text-primary font-semibold">
        Go to the home page →
      </A>
    </main>
  );
}
