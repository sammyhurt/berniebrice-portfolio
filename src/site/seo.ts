/**
 * Search and share metadata for every page, built only from facts in data.ts.
 * Used in the browser (App sets the tags on navigation) and at build time (scripts/prerender.mjs writes
 * a finished HTML file per page so search engines and link previews see real content without running JS).
 */
import { education, jobs, profile, skills, studies, type CaseStudy } from "./data";

export const SITE = "https://berniebrice.com";
const ROLE_LINE = "Senior IT Infrastructure Engineer in New York";

export interface Seo {
  path: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  type: "profile" | "article" | "website";
  jsonld: object[];
}

const clip = (s: string, n = 158) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

/** A photo from the project when the site has one, else the share card. */
const STUDY_IMAGES: Record<string, string> = {
  "multisite-healthcare-network": "/media/firewall.jpg",
  "branch-relocations": "/media/finished-rack.jpg",
  "network-reliability": "/media/patch-panel.jpg",
  "server-validation": "/media/server-room.jpg",
  "home-lab": "/media/rack-1.jpg",
};

const person = {
  "@type": "Person",
  "@id": `${SITE}/#bernie`,
  name: profile.name,
  jobTitle: profile.title,
  description: profile.summary,
  url: `${SITE}/`,
  image: `${SITE}${profile.headshot}`,
  email: `mailto:${profile.email}`,
  address: { "@type": "PostalAddress", addressLocality: "New York", addressRegion: "NY", addressCountry: "US" },
  sameAs: [profile.linkedin],
  worksFor: { "@type": "Organization", name: profile.current.org },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Ramapo College of New Jersey" },
  hasCredential: { "@type": "EducationalOccupationalCredential", name: "CompTIA Security+", credentialCategory: "certification" },
  hasOccupation: {
    "@type": "Occupation",
    name: profile.title,
    occupationLocation: { "@type": "City", name: "New York, NY" },
    skills: skills.flatMap((g) => g.items.map((i) => i.skill)).join(", "),
  },
  knowsAbout: Array.from(new Set(studies.flatMap((s) => s.stack))).slice(0, 40),
};

const crumbs = (items: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE}${it.path}` })),
});

function studySeo(s: CaseStudy): Seo {
  const path = `/work/${s.slug}`;
  return {
    path,
    title: `${s.title} · Bernie Brice`,
    description: s.summary.length <= 118 ? `${s.summary} ${s.tag} case study by Bernie Brice, NYC.` : clip(s.summary, 165),
    image: STUDY_IMAGES[s.slug] || "/og.jpg",
    imageAlt: `${s.title}, a case study by Bernie Brice`,
    type: "article",
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: s.title,
        description: s.summary,
        about: s.tag,
        keywords: s.stack.join(", "),
        author: { "@id": `${SITE}/#bernie` },
        url: `${SITE}${path}`,
        image: `${SITE}${STUDY_IMAGES[s.slug] || "/og.jpg"}`,
        mainEntityOfPage: `${SITE}${path}`,
      },
      { "@context": "https://schema.org", ...crumbs([{ name: "Bernie Brice", path: "/" }, { name: "Case studies", path: "/#work" }, { name: s.title, path }]) },
    ],
  };
}

export function seoFor(rawPath: string): Seo {
  const path = rawPath.replace(/\/+$/, "") || "/";
  const m = path.match(/^\/work\/([a-z0-9-]+)$/);
  if (m) {
    const s = studies.find((x) => x.slug === m[1]);
    if (s) return studySeo(s);
  }
  if (path === "/resume") {
    return {
      path,
      title: "Resume · Bernie Brice, IT Infrastructure Engineer, NYC",
      description: "Resume of Bernie Brice: 7+ years in IT infrastructure at Marks Home Care Agency, The Mark Hotel, Santander Bank and Penn Medicine. Networking, Active Directory, VoIP, Security+.",
      image: "/og.jpg",
      imageAlt: "Bernie Brice, Senior IT Infrastructure Engineer. 7+ years, CompTIA Security+, New York.",
      type: "profile",
      jsonld: [
        { "@context": "https://schema.org", "@type": "ProfilePage", url: `${SITE}/resume`, name: "Bernie Brice resume", mainEntity: person },
        { "@context": "https://schema.org", ...crumbs([{ name: "Bernie Brice", path: "/" }, { name: "Resume", path: "/resume" }]) },
      ],
    };
  }
  return {
    path: "/",
    title: "Bernie Brice · Senior IT Infrastructure Engineer, New York",
    description: "Senior IT Infrastructure Engineer in New York with 7+ years across healthcare, banking, hospitality and data centers: SonicWall, VPN, VLANs, Windows Server, Active Directory.",
    image: "/og.jpg",
    imageAlt: "Bernie Brice, Senior IT Infrastructure Engineer. 7+ years, CompTIA Security+, New York.",
    type: "profile",
    jsonld: [
      { "@context": "https://schema.org", "@type": "ProfilePage", url: `${SITE}/`, name: "Bernie Brice", mainEntity: person, dateModified: new Date().toISOString().slice(0, 10) },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Case studies",
        itemListElement: studies.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/work/${s.slug}`, name: s.title })),
      },
    ],
  };
}

/** All pages that should be indexed. */
export const indexable = ["/", "/resume", ...studies.map((s) => `/work/${s.slug}`)];

/** Plain-HTML version of a page's content, placed in #root before the app loads (React replaces it). */
export function staticBody(rawPath: string): string {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const li = (xs: string[]) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const path = rawPath.replace(/\/+$/, "") || "/";
  const nav = `<nav aria-label="Pages"><a href="/">Home</a> · <a href="/resume">Resume</a> · <a href="${profile.resumePdf}">Resume (PDF)</a> · <a href="${profile.linkedin}">LinkedIn</a></nav>`;
  const m = path.match(/^\/work\/([a-z0-9-]+)$/);
  const s = m ? studies.find((x) => x.slug === m[1]) : undefined;
  let main: string;
  if (s) {
    main = `<article><p>${esc(s.tag)} · ${esc(s.org)} · ${esc(s.when)}</p><h1>${esc(s.title)}</h1><p>${esc(s.summary)}</p>
<h2>The problem</h2><p>${esc(s.problem)}</p><h2>My role</h2><p>${esc(s.role)}</p><h2>What I did</h2>${li(s.did)}
<h2>Tools and technologies</h2>${li(s.stack)}<h2>Results</h2>${li(s.results)}
<p>By <a href="/">Bernie Brice</a>, ${esc(ROLE_LINE)}.</p></article>`;
  } else if (path === "/resume") {
    main = `<h1>Bernie Brice · Resume</h1><p>${esc(profile.title)} · ${esc(profile.location)}</p><p>${esc(profile.summary)}</p>
<h2>Experience</h2>${jobs.map((j) => `<section><h3>${esc(j.title)}, ${esc(j.org)}</h3><p>${esc(j.location)} · ${esc(j.dates)}</p>${li(j.bullets)}</section>`).join("")}
<h2>Skills</h2>${skills.map((g) => `<h3>${esc(g.name)}</h3>${li(g.items.map((i) => i.skill))}`).join("")}
<h2>Education and certification</h2>${li([`${education.degree.detail}, ${education.degree.school} (${education.degree.year})`, ...education.certifications, ...education.training.map((t) => `${t.name}, ${t.by}`)])}`;
  } else {
    main = `<h1>Bernie Brice</h1><p>${esc(profile.title)} · ${esc(profile.location)}</p><p>${esc(profile.pitch)}</p><p>${esc(profile.about)}</p>
<h2>Case studies</h2><ul>${studies.map((x) => `<li><a href="/work/${x.slug}">${esc(x.title)}</a>: ${esc(x.summary)}</li>`).join("")}</ul>
<h2>Experience</h2><ul>${jobs.map((j) => `<li>${esc(j.title)}, ${esc(j.org)} (${esc(j.dates)})</li>`).join("")}</ul>
<h2>Skills</h2>${li(skills.flatMap((g) => g.items.map((i) => i.skill)))}`;
  }
  return `<div class="mx-auto max-w-3xl px-5 py-24">${nav}<main>${main}</main></div>`;
}
