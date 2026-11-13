/**
 * A real wall rack in 3D. The front is Bernie's own photo (public/media/rack-4.jpg, straightened into
 * rack3d-front.jpg) laid over a finely divided surface that is pushed in and out by a depth map
 * (rack3d-depth.png): patch cables stand off the faceplates, the empty shelf bay is a real cavity.
 * Around it is a simple steel wall cabinet. Loaded only when the section scrolls into view (see rack.tsx).
 */
import * as THREE from "three";

export type DeviceId = "patch" | "switch" | "router" | "ups";

export interface RackApi {
  select(id: DeviceId | null): void;
  zoom(step: number): void;
  reset(): void;
  dispose(): void;
}
export interface RackOptions {
  onSelect(id: DeviceId | null): void;
  onInteract(): void;
  onReady(): void;
  onError(): void;
  reducedMotion: boolean;
  background: string;
}

/* The straightened photo: 1442 x 1324 px, frame edge to frame edge. Rack unit 08 starts 138 px down; each unit is 129 px. */
const PX = { w: 1442, h: 1324, top: 138, unit: 129 };
const WW = 6; // width of the rack front in scene units
const HH = (WW * PX.h) / PX.w;
const DEPTH = 2.3; // how far the cabinet stands off the wall
const RELIEF = 2; // depth map: mid gray = frame front; white = 1 unit forward; black = 1 unit back
const sx = (px: number) => (px / PX.w - 0.5) * WW;
const sy = (py: number) => (0.5 - py / PX.h) * HH;
const unitY = (n: number) => sy(PX.top + (8.5 - n) * PX.unit); // middle of rack unit n (08 at the top, 01 at the bottom)
const UNIT = (PX.unit / PX.w) * WW;
const ROWS: Record<DeviceId, number[]> = { patch: [8, 6, 4], switch: [7, 5], router: [3], ups: [2] };

export function createRack(host: HTMLElement, opts: RackOptions): RackApi {
  const low = (navigator.hardwareConcurrency || 4) <= 4 || Math.min(innerWidth, innerHeight) < 500;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // keep the photo's own colors
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const el = renderer.domElement;
  el.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none";
  el.setAttribute("aria-hidden", "true");
  host.appendChild(el);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.background);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
  key.position.set(5, 8, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.5);
  fill.position.set(-7, 2, 6);
  scene.add(fill);

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const rack = new THREE.Group();
  scene.add(rack);

  /* ---------- the photo front, with real depth ---------- */
  const frontMat = track(new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.55, metalness: 0, displacementScale: RELIEF, displacementBias: -RELIEF / 2 }));
  const front = new THREE.Mesh(track(new THREE.PlaneGeometry(WW, HH, low ? 230 : 460, low ? 210 : 420)), frontMat);
  front.visible = false;
  rack.add(front);

  let dead = false;
  let dirty = true;
  let loaded = 0;
  const loader = new THREE.TextureLoader();
  const done = () => {
    if (dead || ++loaded < 2) return;
    front.visible = true;
    dirty = true;
    opts.onReady();
    kick();
  };
  const photo = track(
    loader.load(
      "/media/rack3d-front.jpg",
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        frontMat.emissiveMap = t;
        frontMat.needsUpdate = true;
        done();
      },
      undefined,
      () => !dead && opts.onError(),
    ),
  );
  const depth = track(
    loader.load(
      "/media/rack3d-depth.png",
      (t) => {
        frontMat.displacementMap = t;
        frontMat.needsUpdate = true;
        done();
      },
      undefined,
      () => !dead && opts.onError(),
    ),
  );
  void photo;
  void depth;

  /* ---------- the steel cabinet behind the photo ---------- */
  const steel = track(new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.55, metalness: 0.4 }));
  const slab = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), steel);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    rack.add(m);
    return m;
  };
  const T = 0.07;
  slab(T, HH, DEPTH, -WW / 2 + T / 2, 0, -DEPTH / 2 - 0.01);
  slab(T, HH, DEPTH, WW / 2 - T / 2, 0, -DEPTH / 2 - 0.01);
  slab(WW, T, DEPTH, 0, HH / 2 - T / 2, -DEPTH / 2 - 0.01);
  slab(WW, T, DEPTH, 0, -HH / 2 + T / 2, -DEPTH / 2 - 0.01);
  slab(WW, HH, T, 0, 0, -DEPTH);
  // slotted vents on both side panels
  {
    const dark = track(new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.9 }));
    const slot = track(new THREE.BoxGeometry(0.012, 0.05, 0.5));
    const n = 14 * 2 * 2;
    const slots = new THREE.InstancedMesh(slot, dark, n);
    const m = new THREE.Matrix4();
    let i = 0;
    for (const x of [-WW / 2 - 0.004, WW / 2 + 0.004]) for (const z of [-0.75, -1.55]) for (let k = 0; k < 14; k++) slots.setMatrixAt(i++, m.makeTranslation(x, 1.9 - k * 0.14, z));
    rack.add(slots);
  }
  // the wall: invisible except for the shadow the cabinet throws on it
  {
    const wall = new THREE.Mesh(track(new THREE.PlaneGeometry(40, 30)), track(new THREE.ShadowMaterial({ opacity: 0.42 })));
    wall.position.z = -DEPTH - 0.04;
    wall.receiveShadow = true;
    scene.add(wall);
  }

  /* ---------- lights that are really lit in the photo: UPS status lights and the three small screens ---------- */
  const glows: { mat: THREE.MeshBasicMaterial; base: number; speed: number; phase: number }[] = [];
  const glow = (px: number, py: number, z: number, r: number, color: number, base: number, speed: number) => {
    const mat = track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: base, blending: THREE.AdditiveBlending, depthWrite: false }));
    const m = new THREE.Mesh(track(new THREE.CircleGeometry(r, 24)), mat);
    m.position.set(sx(px), sy(py), z);
    rack.add(m);
    glows.push({ mat, base, speed, phase: px * 0.37 });
  };
  for (const [x, y] of [[964, 964], [1026, 965], [1058, 966]]) {
    glow(x, y, 0.185, 0.022, 0x9dffb0, 0.85, 0.9);
    glow(x, y, 0.18, 0.06, 0x35ff6a, 0.16, 0.9);
  }
  for (const y of [328, 590, 856]) glow(130, y, 0.07, 0.13, 0x3a6dff, 0.1, 0.5);

  /* ---------- clickable devices ---------- */
  const hit: THREE.Mesh[] = [];
  const outlines = new Map<DeviceId, THREE.LineSegments[]>();
  const mHit = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  const mOutline = track(new THREE.LineBasicMaterial({ color: 0xff8a4a }));
  (Object.keys(ROWS) as DeviceId[]).forEach((id) => {
    outlines.set(
      id,
      ROWS[id].map((n) => {
        const g = track(new THREE.BoxGeometry(WW - 0.12, UNIT - 0.03, 0.62));
        const m = new THREE.Mesh(g, mHit);
        m.position.set(0, unitY(n), 0.1);
        m.userData.id = id;
        rack.add(m);
        hit.push(m);
        const line = new THREE.LineSegments(track(new THREE.EdgesGeometry(g)), mOutline);
        line.position.copy(m.position);
        line.visible = false;
        rack.add(line);
        return line;
      }),
    );
  });

  /* ---------- camera rig: drag to rotate, buttons to zoom ---------- */
  const home = { az: 0.36, pol: 1.52, r: 15.5, ty: 0 };
  const cur = { ...home },
    goal = { ...home };
  let fit = 1;
  let selected: DeviceId | null = null;
  let hovered: DeviceId | null = null;
  let lastTouch = -1e9;
  const TZ = -DEPTH / 2;

  function place() {
    const r = cur.r * fit;
    const sp = Math.sin(cur.pol);
    camera.position.set(r * sp * Math.sin(cur.az), cur.ty + r * Math.cos(cur.pol), TZ + r * sp * Math.cos(cur.az));
    camera.lookAt(0, cur.ty, TZ);
  }
  function resize() {
    const w = host.clientWidth || 1,
      h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    fit = camera.aspect < 0.85 ? 0.9 / camera.aspect : camera.aspect < 1.2 ? 1.05 : 0.92;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(e: PointerEvent): DeviceId | null {
    const b = el.getBoundingClientRect();
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(hit, false)[0];
    return h ? (h.object.userData.id as DeviceId) : null;
  }
  function showOutline() {
    outlines.forEach((lines, id) => lines.forEach((l) => (l.visible = id === selected || id === hovered)));
    dirty = true;
  }
  function setSelected(id: DeviceId | null, notify: boolean) {
    selected = id;
    if (id) {
      const ys = ROWS[id].map(unitY);
      goal.ty = (ys.reduce((a, c) => a + c, 0) / ys.length) * 0.3;
      goal.r = Math.min(goal.r, 14.2);
    } else {
      goal.ty = home.ty;
      goal.r = Math.max(goal.r, home.r);
    }
    showOutline();
    if (notify) opts.onSelect(id);
  }

  let drag: { x: number; y: number; moved: number; id: number; touch: boolean } | null = null;
  let interacted = false;
  const touched = () => {
    lastTouch = performance.now();
    if (!interacted) {
      interacted = true;
      opts.onInteract();
    }
  };
  const down = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, touch: e.pointerType === "touch" };
    el.setPointerCapture?.(e.pointerId);
    el.style.cursor = "grabbing";
    touched();
    kick();
  };
  const move = (e: PointerEvent) => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      goal.az = THREE.MathUtils.clamp(goal.az - dx * 0.006, -0.7, 0.7);
      // on touch, up/down scrolls the page instead of tilting the rack
      if (!drag.touch) goal.pol = THREE.MathUtils.clamp(goal.pol - dy * 0.004, 1.15, 1.75);
      lastTouch = performance.now();
      kick();
      return;
    }
    if (e.pointerType === "mouse") {
      const id = pick(e);
      if (id !== hovered) {
        hovered = id;
        el.style.cursor = id ? "pointer" : "grab";
        showOutline();
        kick();
      }
    }
  };
  const up = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const click = drag.moved < 7;
    drag = null;
    el.style.cursor = hovered ? "pointer" : "grab";
    if (click) {
      const id = pick(e);
      setSelected(id === selected ? null : id, true);
      kick();
    }
  };
  const cancel = () => {
    drag = null;
    el.style.cursor = "grab";
  };
  const leave = () => {
    if (hovered) {
      hovered = null;
      showOutline();
      kick();
    }
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", cancel);
  el.addEventListener("pointerleave", leave);

  /* ---------- render loop: only runs while the rack is on screen (and, with reduced motion, only while something changes) ---------- */
  let raf = 0,
    last = 0,
    visible = false;
  function frame(now: number) {
    raf = 0;
    if (dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const t = now / 1000;
    if (!opts.reducedMotion) {
      // idle: a slow sway from side to side; stops while someone is using it
      if (!drag && !selected && now - lastTouch > 5000) goal.az = Math.sin(t * 0.22) * 0.42;
      glows.forEach((g) => (g.mat.opacity = g.base * (0.78 + 0.22 * Math.sin(t * g.speed * 3 + g.phase))));
      dirty = true;
    }
    const k = 1 - Math.exp(-dt * 6);
    let moving = false;
    for (const p of ["az", "pol", "r", "ty"] as const) {
      const d = goal[p] - cur[p];
      if (Math.abs(d) > 1e-4) {
        cur[p] += d * k;
        dirty = moving = true;
      }
    }
    if (dirty) {
      dirty = false;
      place();
      renderer.render(scene, camera);
    }
    if (visible && !document.hidden && (!opts.reducedMotion || moving)) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && visible && !document.hidden && !dead) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }
  const io = new IntersectionObserver(([e]) => ((visible = e.isIntersecting), (dirty = true), kick()), { rootMargin: "100px" });
  io.observe(host);
  document.addEventListener("visibilitychange", kick);
  place();

  return {
    select(id) {
      touched();
      setSelected(id, false);
      kick();
    },
    zoom(step) {
      touched();
      goal.r = THREE.MathUtils.clamp(goal.r - step * 2.5, 7.5, 21);
      kick();
    },
    reset() {
      Object.assign(goal, home);
      setSelected(null, true);
      lastTouch = -1e9;
      kick();
    },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", kick);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
      el.removeEventListener("pointerleave", leave);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      el.remove();
    },
  };
}
