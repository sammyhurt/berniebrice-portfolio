import { useReducedMotion } from "framer-motion";
import { ArrowUpRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { A, Reveal } from "./parts";
import type { DeviceId, RackApi } from "./rack3d";

/**
 * "The rack": one of Bernie's real wall racks, shown in 3D. The front is his own photo (the same one in the
 * On site gallery) with real depth added, so the patch cables stand off the faceplates as you turn it.
 * The 3D code (rack3d.ts, Three.js) is downloaded only when this section is about to scroll into view.
 * Every device note below is taken from the resume.
 */
const PANEL = "#2f3020";
const DEVICES: { id: DeviceId; name: string; role: string; note: string; study: string; studyLabel: string }[] = [
  { id: "patch", name: "Patch panels", role: "Cabling · 72 ports", note: "Three 24-port panels where every wall jack lands, numbered and labeled. I handle network cabling, racking and patching during branch relocations and buildouts.", study: "branch-relocations", studyLabel: "Branch relocations and buildouts" },
  { id: "switch", name: "Switches", role: "Switching", note: "Two switches patched to the panels above and below them. I configure and support UniFi and Cisco switching, core switch uplinks and VLAN segmentation.", study: "multisite-healthcare-network", studyLabel: "Owning a multisite healthcare network" },
  { id: "router", name: "Router", role: "Site connectivity", note: "The edge of the site. I configure, troubleshoot and support routers, firewalls and site-to-site VPN tunnels that keep branches connected.", study: "multisite-healthcare-network", studyLabel: "Owning a multisite healthcare network" },
  { id: "ups", name: "UPS", role: "Power protection", note: "Battery backup under the network gear, so a power blip doesn't take the site offline.", study: "branch-relocations", studyLabel: "Branch relocations and buildouts" },
];

function webgl() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function RackSection() {
  const reduced = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef<RackApi | null>(null);
  const [state, setState] = useState<"waiting" | "loading" | "ready" | "unavailable">("waiting");
  const [sel, setSel] = useState<DeviceId | null>(null);

  // start downloading the 3D code a little before the section is on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || state !== "waiting") return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setState(webgl() ? "loading" : "unavailable"), { rootMargin: "500px" });
    io.observe(el);
    return () => io.disconnect();
  }, [state]);

  useEffect(() => {
    if (state !== "loading") return;
    let dead = false;
    import("./rack3d")
      .then(({ createRack }) => {
        if (dead || !hostRef.current) return;
        api.current = createRack(hostRef.current, {
          reducedMotion: reduced,
          background: PANEL,
          onSelect: setSel,
          onInteract: () => window.clarity?.("event", "rack_interacted"),
          onReady: () => !dead && setState("ready"),
          onError: () => !dead && setState("unavailable"),
        });
      })
      .catch(() => !dead && setState("unavailable"));
    return () => {
      dead = true;
    };
  }, [state, reduced]);
  useEffect(
    () => () => {
      api.current?.dispose();
      api.current = null;
    },
    [],
  );

  const pickDevice = (id: DeviceId | null) => {
    setSel(id);
    api.current?.select(id);
  };
  const d = DEVICES.find((x) => x.id === sel);
  const chip = "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors";
  const round = "grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20";

  return (
    <section ref={sectionRef} id="rack" aria-label="A wall rack in 3D" className="scroll-mt-20 px-5 pt-16 sm:px-8 lg:px-11">
      <Reveal>
        <div className="grid overflow-hidden rounded-[2rem] text-[#efeef3] shadow-sm lg:grid-cols-12" style={{ background: PANEL }}>
          <div className="p-6 pb-2 sm:p-9 sm:pb-2 lg:col-span-4 lg:pt-11">
            <div>
              <p className="font-mono text-xs tracking-[0.18em] text-[#ec9578] uppercase">Real rack · 3D</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">One of my wall racks, in 3D</h2>
              <p className="mt-4 max-w-md leading-relaxed text-white/75">
                Built from my own photo: 72 patch ports, two switches, a router and a UPS. Drag to turn it, or pick a device to see what I do with that kind of gear.
              </p>
            </div>
          </div>

          <div className="relative h-[400px] sm:h-[560px] lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:h-auto lg:min-h-[700px]">
            <div ref={hostRef} className="absolute inset-0" />
            {state !== "ready" ? (
              <div className="absolute inset-0 grid place-items-center p-8 text-center">
                <p className="max-w-xs text-sm text-white/60">{state === "unavailable" ? "The 3D view isn't available in this browser. The device notes on this panel still work." : "Loading the rack…"}</p>
              </div>
            ) : (
              <div className="absolute right-4 bottom-4 flex gap-2">
                <button type="button" aria-label="Zoom out" className={round} onClick={() => api.current?.zoom(-1)}>
                  <Minus className="size-4" />
                </button>
                <button type="button" aria-label="Zoom in" className={round} onClick={() => api.current?.zoom(1)}>
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Reset view"
                  className={round}
                  onClick={() => api.current?.reset()}
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 p-6 pt-4 sm:p-9 sm:pt-4 lg:col-span-4 lg:pb-11">
            <div>
              <p className="font-mono text-[11px] tracking-[0.14em] text-white/55 uppercase">Devices</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {DEVICES.map((x) => (
                  <button key={x.id} type="button" aria-pressed={sel === x.id} onClick={() => pickDevice(sel === x.id ? null : x.id)} className={cn(chip, sel === x.id ? "border-[#ec9578] bg-[#ec9578] text-[#2f3020]" : "border-white/20 bg-white/5 hover:bg-white/15")}>
                    {x.name}
                  </button>
                ))}
              </div>
            </div>

            <div aria-live="polite" className="lg:min-h-[15rem]">
              {d ? (
                <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[11px] tracking-[0.14em] text-[#ec9578] uppercase">{d.role}</p>
                      <h3 className="mt-1 text-xl font-semibold tracking-tight">{d.name}</h3>
                    </div>
                    <button type="button" aria-label="Close" onClick={() => pickDevice(null)} className="-mt-1 -mr-1 grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2 leading-relaxed text-white/85">{d.note}</p>
                  <A to={`/work/${d.study}`} className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[#ec9578] underline-offset-4 hover:underline">
                    {d.studyLabel} <ArrowUpRight className="size-4" />
                  </A>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-white/55">
                  Nothing selected. Tap a device on the rack or use the buttons above.
                </p>
              )}
            </div>

            <p className="mt-auto font-mono text-[11px] tracking-[0.14em] text-white/45 uppercase">My own photo, mapped onto a 3D model</p>
          </div>

        </div>
      </Reveal>
    </section>
  );
}
