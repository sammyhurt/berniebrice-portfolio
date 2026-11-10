/**
 * After `vite build`: writes dist/<page>/index.html for every indexable page with its own title, description,
 * canonical, share tags, structured data and readable content, then writes sitemap.xml with today's date.
 * The app replaces the readable content as soon as it loads.
 */
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const dist = join(root, "dist");
const tmp = join(root, "node_modules/.prerender/seo.mjs");
await build({ entryPoints: [join(root, "src/site/seo.ts")], bundle: true, format: "esm", platform: "node", outfile: tmp, logLevel: "silent", alias: { "@": join(root, "src") } });
const { seoFor, staticBody, indexable, SITE } = await import(pathToFileURL(tmp).href);

const shell = readFileSync(join(dist, "index.html"), "utf8");
const attr = (t) => t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const setMeta = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`));

for (const path of indexable) {
  const s = seoFor(path);
  const url = SITE + (s.path === "/" ? "/" : s.path);
  const img = SITE + s.image;
  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(s.title)}</title>`);
  html = setMeta(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${attr(s.description)}" />`);
  html = setMeta(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  html = setMeta(html, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${s.type}" />`);
  html = setMeta(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${attr(s.title)}" />`);
  html = setMeta(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${attr(s.description)}" />`);
  html = setMeta(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  html = setMeta(html, /<meta property="og:image" [^>]*>/, `<meta property="og:image" content="${img}" />`);
  html = setMeta(html, /<meta property="og:image:alt"[^>]*>/, `<meta property="og:image:alt" content="${attr(s.imageAlt)}" />`);
  if (s.image !== "/og.jpg") html = html.replace(/\s*<meta property="og:image:width"[^>]*>\s*<meta property="og:image:height"[^>]*>/, "");
  html = setMeta(html, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${img}" />`);
  html = setMeta(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${attr(s.title)}" />`);
  html = setMeta(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${attr(s.description)}" />`);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, s.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n    "));
  html = html.replace('<div id="root"></div>', `<div id="root">${staticBody(path)}</div>`);
  // Netlify serves /work/x from work/x.html (Pretty URLs), so the address stays without a trailing slash.
  const out = path === "/" ? join(dist, "index.html") : join(dist, `${path.slice(1)}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
    .map((p) => `  <url><loc>${SITE}${p === "/" ? "/" : p}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${p === "/" ? "1.0" : p === "/resume" ? "0.9" : "0.7"}</priority></url>`)
    .join("\n")}\n  <url><loc>${SITE}/Bernie-Brice-Resume.pdf</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>\n</urlset>\n`,
);
rmSync(dirname(tmp), { recursive: true, force: true });
console.log(`prerendered ${indexable.length} pages`);
