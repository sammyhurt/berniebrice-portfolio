import { useEffect } from "react";

import { tracks, type TrackSlug } from "./data";
import { glassPreview } from "./glass";
import { Footer, Header, usePath } from "./parts";
import { IntroBubble } from "./intro";
import { SeasonBanner } from "./season";
import { Home, NotFound, ResumePage, StudyPage } from "./pages";
import { SITE, seoFor } from "./seo";
import { logVisit, watchClicks } from "./track";
import { lazy, Suspense } from "react";

const Admin = lazy(() => import("./admin"));

let watching = false;
export default function App() {
  if (!watching && typeof document !== "undefined") {
    watching = true;
    watchClicks();
  }
  useEffect(() => {
    document.documentElement.classList.toggle("glass", glassPreview());
  }, []);
  const full = usePath();
  const path = full.split("#")[0].replace(/\/+$/, "") || "/";
  useEffect(() => {
    // Keep the tab title and share tags in step with the page (the build writes the same tags into each page's HTML).
    const known = path === "/" || path === "/resume" || /^\/work\/[a-z0-9-]+$/.test(path);
    const s = seoFor(known ? path : "/");
    const set = (sel: string, attr: string, val: string) => {
      let el = document.head.querySelector(sel) as HTMLMetaElement | HTMLLinkElement | null;
      if (!el) {
        const [tag, rest] = sel.split("[");
        el = document.createElement(tag) as HTMLMetaElement;
        const [k, v] = rest.replace("]", "").split("=");
        el.setAttribute(k, v.replace(/"/g, ""));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };
    document.title = path === "/admin" ? "Admin · Bernie Brice" : known || path.startsWith("/for/") ? s.title : "Page not found · Bernie Brice";
    set('meta[name="description"]', "content", s.description);
    set('link[rel="canonical"]', "href", SITE + s.path);
    set('meta[property="og:title"]', "content", s.title);
    set('meta[property="og:description"]', "content", s.description);
    set('meta[property="og:url"]', "content", SITE + s.path);
    set('meta[property="og:image"]', "content", SITE + s.image);
    set('meta[name="robots"]', "content", known ? "index, follow" : "noindex, follow");
  }, [path]);
  useEffect(() => {
    if (path !== "/admin") logVisit(path);
    const h = location.hash.slice(1);
    if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "start" }), 50);
  }, [path]);
  let page;
  const m = path.match(/^\/(work|for)\/([a-z0-9-]+)$/);
  if (path === "/") page = <Home />;
  else if (m && m[1] === "work") page = <StudyPage slug={m[2]} />;
  else if (m && m[1] === "for" && tracks.some((t) => t.slug === m[2])) page = <Home trackSlug={m[2] as TrackSlug} />;
  else if (path === "/resume") page = <ResumePage />;
  else if (path === "/admin")
    page = (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    );
  else page = <NotFound />;
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      {path !== "/admin" ? <SeasonBanner /> : null}
      <Header />
      {page}
      <Footer />
      {path !== "/admin" ? <IntroBubble /> : null}
    </div>
  );
}
