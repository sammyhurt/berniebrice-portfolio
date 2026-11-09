import { useEffect } from "react";

import { tracks, type TrackSlug } from "./data";
import { Footer, Header, usePath } from "./parts";
import { IntroBubble } from "./intro";
import { SeasonBanner } from "./season";
import { Home, NotFound, ResumePage, StudyPage } from "./pages";
import { logVisit, watchClicks } from "./track";
import { lazy, Suspense } from "react";

const Admin = lazy(() => import("./admin"));

let watching = false;
export default function App() {
  if (!watching && typeof document !== "undefined") {
    watching = true;
    watchClicks();
  }
  const full = usePath();
  const path = full.split("#")[0].replace(/\/+$/, "") || "/";
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
