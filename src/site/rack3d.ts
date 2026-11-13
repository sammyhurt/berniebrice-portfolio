/**
 * The 3D network rack (illustration, not a real employer network). Everything is built in code with Three.js:
 * an open-frame rack, generic devices labeled by role, patch cables colored by network, blinking port lights.
 * Loaded only when the section scrolls into view (see rack.tsx).
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export type DeviceId = "ap" | "patch" | "core" | "access" | "firewall" | "router" | "ups";
export type Net = "staff" | "voice" | "printers" | "guest";
export const NET_COLORS: Record<Net, string> = { staff: "#7f9a2e", voice: "#e2531f", printers: "#7d6fd0", guest: "#e6b422" };

export interface RackApi {
  select(id: DeviceId | null): void;
  trace(net: Net | null): void;
  zoom(step: number): void;
  reset(): void;
  dispose(): void;
}
export interface RackOptions {
  onSelect(id: DeviceId | null): void;
  onInteract(): void;
  reducedMotion: boolean;
  background: string;
}

const U = 0.45; // one rack unit
const W = 4.83; // 19" faceplate width
const BASE = 0.4; // bottom of U1
const UNITS = 12;
const uY = (n: number, units = 1) => BASE + (n - 1) * U + (units * U) / 2; // vertical center of a device starting at U n

/* ---------- small helpers ---------- */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** A faceplate drawn on a canvas: brushed metal, vents, labels. cw maps to the 19" width. */
function faceTexture(h: number, base: string, draw: (c: CanvasRenderingContext2D, X: (x: number) => number, Y: (y: number) => number, S: number) => void) {
  const CW = 2048;
  const CH = Math.round((CW * h) / W);
  const cv = document.createElement("canvas");
  cv.width = CW;
  cv.height = CH;
  const c = cv.getContext("2d")!;
  c.fillStyle = base;
  c.fillRect(0, 0, CW, CH);
  // brushed look: faint horizontal streaks
  const r = rng(CH * 7 + base.length);
  for (let i = 0; i < 260; i++) {
    c.fillStyle = `rgba(255,255,255,${0.012 + r() * 0.03})`;
    c.fillRect(r() * CW, r() * CH, 80 + r() * 500, 1);
  }
  const g = c.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "rgba(255,255,255,0.09)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(0,0,0,0.22)");
  c.fillStyle = g;
  c.fillRect(0, 0, CW, CH);
  const S = CW / W;
  draw(c, (x) => (x + W / 2) * S, (y) => (h / 2 - y) * S, S);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const label = (c: CanvasRenderingContext2D, text: string, x: number, y: number, px: number, color = "rgba(235,235,225,0.9)", align: CanvasTextAlign = "left", weight = 600) => {
  c.font = `${weight} ${px}px ui-monospace, "IBM Plex Mono", Menlo, Consolas, monospace`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillText(text, x, y);
};
function vents(c: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, S: number) {
  c.fillStyle = "rgba(0,0,0,0.55)";
  const sw = 0.045 * S,
    sh = 0.02 * S;
  for (let y = y0; y < y0 + h - sh; y += sh * 2.1) for (let x = x0 + ((Math.round((y - y0) / sh) % 2) * sw) / 2; x < x0 + w - sw; x += sw * 1.35) {
    c.beginPath();
    c.roundRect(x, y, sw, sh, sh / 2);
    c.fill();
  }
}

/** x position of port i on a 24-port row (small gap every 6 ports, like real switches). */
const portX = (i: number) => -1.92 + i * 0.142 + Math.floor(i / 6) * 0.05;
const sfpX = (i: number) => 1.66 + i * 0.158;

export function createRack(host: HTMLElement, opts: RackOptions): RackApi {
  const low = (navigator.hardwareConcurrency || 4) <= 4 || Math.min(innerWidth, innerHeight) < 500;
  const rand = rng(20261112);

  /* ---------- renderer, scene, camera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = !low;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const el = renderer.domElement;
  el.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none";
  el.setAttribute("aria-hidden", "true");
  host.appendChild(el);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.8;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xfff1e0, 2.3);
  key.position.set(6, 11, 9);
  key.castShadow = !low;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -2;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb08a, low ? 0.18 : 0.45);
  rim.position.set(-9, 2.5, -7);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.7);
  fill.position.set(-6, 3, 9);
  scene.add(fill);

  const disposables: { dispose(): void }[] = [pmrem, envRT];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  /* ---------- floor ---------- */
  {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const c = cv.getContext("2d")!;
    const g = c.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.3, "#777");
    g.addColorStop(0.62, "#000");
    g.addColorStop(1, "#000");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
    const alpha = track(new THREE.CanvasTexture(cv));
    const mat = track(new THREE.MeshStandardMaterial({ color: 0x3b3c30, roughness: 0.7, metalness: 0.1, alphaMap: alpha, transparent: true, envMapIntensity: 0.3 }));
    const floor = new THREE.Mesh(track(new THREE.CircleGeometry(9, 64)), mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1.6);
    floor.receiveShadow = true;
    scene.add(floor);
  }

  /* ---------- shared materials ---------- */
  const mFrame = track(new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.5, metalness: 0.75 }));
  const mBody = track(new THREE.MeshStandardMaterial({ color: 0x1d1e22, roughness: 0.55, metalness: 0.7 }));
  const mDark = track(new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.8, metalness: 0.2 }));
  const mSteel = track(new THREE.MeshStandardMaterial({ color: 0x777a80, roughness: 0.45, metalness: 1 }));
  const mPlastic = track(new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.45, metalness: 0 }));
  const box = (w: number, h: number, d: number) => track(new THREE.BoxGeometry(w, h, d));
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  const rack = new THREE.Group();
  scene.add(rack);

  /* ---------- rack frame ---------- */
  const H = UNITS * U + 0.5;
  const postX = W / 2 + 0.17;
  const rearZ = -3.3;
  const yMid = BASE - 0.25 + H / 2;
  for (const x of [-postX, postX]) for (const z of [-0.11, rearZ]) add(rack, box(0.22, H, 0.22), mFrame, x, yMid, z);
  for (const x of [-postX, postX]) for (const y of [BASE - 0.25 + 0.11, BASE - 0.25 + H - 0.11]) add(rack, box(0.22, 0.22, Math.abs(rearZ) - 0.11), mFrame, x, y, (rearZ - 0.11) / 2);
  for (const y of [BASE - 0.25 + 0.11, BASE - 0.25 + H - 0.11]) add(rack, box(postX * 2, 0.22, 0.22), mFrame, 0, y, rearZ);
  add(rack, box(postX * 2 + 0.22, 0.06, 0.3), mFrame, 0, BASE - 0.25 + H + 0.03, -0.11);
  add(rack, box(postX * 2 + 0.22, 0.06, 0.3), mFrame, 0, BASE - 0.28, -0.11);
  for (const x of [-postX, postX]) for (const z of [-0.11, rearZ]) {
    const foot = add(rack, track(new THREE.CylinderGeometry(0.16, 0.2, 0.15, 20)), mFrame, x, 0.075, z);
    foot.castShadow = true;
  }
  // square mounting holes on the front rails, three per rack unit
  {
    const holes = new THREE.InstancedMesh(box(0.075, 0.075, 0.02), mDark, UNITS * 3 * 2);
    const m = new THREE.Matrix4();
    let i = 0;
    for (const x of [-postX + 0.01, postX - 0.01]) for (let u = 0; u < UNITS; u++) for (const f of [0.16, 0.5, 0.84]) holes.setMatrixAt(i++, m.makeTranslation(x, BASE + u * U + f * U, 0.005));
    rack.add(holes);
  }
  // vertical power strip on the rear right post
  add(rack, box(0.26, UNITS * U - 0.6, 0.2), mBody, postX - 0.3, yMid, rearZ + 0.22);

  /* ---------- lights on ports ---------- */
  const LED = { green: new THREE.Color(0.25, 2.6, 0.6), amber: new THREE.Color(2.6, 1.25, 0.12), blue: new THREE.Color(0.4, 1.3, 2.8), off: new THREE.Color(0.035, 0.04, 0.035) };
  const leds: { x: number; y: number; z: number; kind: "link" | "act" | "steady"; color: THREE.Color; next: number; on: boolean }[] = [];
  const led = (x: number, y: number, kind: "link" | "act" | "steady", color: THREE.Color, z = 0.03) => leds.push({ x, y, z, kind, color, next: rand() * 2, on: kind !== "act" });

  /* ---------- devices ---------- */
  const hit: THREE.Mesh[] = [];
  const outlines = new Map<DeviceId, THREE.LineSegments>();
  const focusY = new Map<DeviceId, number>();
  const mHit = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  const mOutline = track(new THREE.LineBasicMaterial({ color: new THREE.Color(3.2, 1.3, 0.6), toneMapped: false }));
  function register(id: DeviceId, w: number, h: number, d: number, x: number, y: number, z: number) {
    const g = box(w, h, d);
    const m = new THREE.Mesh(g, mHit);
    m.position.set(x, y, z);
    m.userData.id = id;
    rack.add(m);
    hit.push(m);
    if (!outlines.has(id)) focusY.set(id, y);
    const line = new THREE.LineSegments(track(new THREE.EdgesGeometry(g)), mOutline);
    line.position.copy(m.position);
    line.visible = false;
    line.userData.id = id;
    rack.add(line);
    // a device can have more than one box (two patch panels): keep them all under one id
    const prev = outlines.get(id);
    if (prev) prev.userData.more = [...(prev.userData.more || []), line];
    else outlines.set(id, line);
  }
  const screwGeo = track(new THREE.CylinderGeometry(0.036, 0.036, 0.025, 12));
  screwGeo.rotateX(Math.PI / 2);
  const ports = new Map<string, THREE.Vector3>(); // "core:3" -> socket position

  function device(id: DeviceId | null, u: number, units: number, depth: number, base: string, bodyMat: THREE.Material, draw: Parameters<typeof faceTexture>[2]) {
    const h = units * U - 0.02;
    const y = uY(u, units);
    const g = new THREE.Group();
    g.position.set(0, y, 0);
    rack.add(g);
    if (depth > 0) add(g, box(4.42, h - 0.02, depth), bodyMat, 0, 0, -depth / 2 - 0.02);
    add(g, box(W, h, 0.04), bodyMat, 0, 0, 0);
    const tex = track(faceTexture(h, base, draw));
    const face = add(g, track(new THREE.PlaneGeometry(W, h)), track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.55 })), 0, 0, 0.0205, false);
    face.receiveShadow = true;
    for (const sx of [-1, 1]) for (const sy of units > 1 ? [-1, 1] : [0]) add(g, screwGeo, mSteel, sx * (W / 2 - 0.12), sy * (h / 2 - 0.13), 0.03, false);
    if (id) register(id, W + 0.06, h + 0.04, Math.max(depth, 0.3) + 0.3, 0, y, -Math.max(depth, 0.3) / 2 + 0.12);
    return { g, y, h };
  }
  const portGeo = box(0.118, 0.1, 0.03);
  function socket(name: string, x: number, y: number) {
    add(rack, portGeo, mDark, x, y, 0.012, false);
    ports.set(name, new THREE.Vector3(x, y, 0.03));
  }

  // which patch-panel ports are wired, and to which network
  const plan = (spec: [Net, number[]][]) => {
    const m = new Map<number, Net>();
    spec.forEach(([n, list]) => list.forEach((i) => m.set(i, n)));
    return m;
  };
  const wiredA = plan([["staff", [0, 1, 2, 3, 4, 6, 7, 20, 21]], ["voice", [8, 9, 10, 11]], ["printers", [12, 13, 15]], ["guest", [16, 17, 18, 19]]]);
  const wiredB = plan([["staff", [0, 1, 2, 4, 5, 6, 7, 8, 9]], ["voice", [10, 11, 12, 13, 14, 15]], ["printers", [16, 17, 18]], ["guest", [19, 20]]]);

  function patchPanel(u: number, tag: string, wired: Map<number, Net>, name: string) {
    const d = device("patch", u, 1, 0.5, "#1b1c1f", mBody, (c, X, Y, S) => {
      label(c, name, X(2.16), Y(0.02), 0.06 * S, "rgba(235,235,225,0.75)", "right");
      label(c, tag === "pa" ? "FLOOR 1" : "FLOOR 2", X(2.16), Y(-0.09), 0.05 * S, "rgba(235,235,225,0.5)", "right", 400);
      for (let i = 0; i < 24; i++) {
        label(c, String(i + 1), X(portX(i)), Y(0.12), 0.06 * S, "rgba(235,235,225,0.8)", "center", 500);
        const n = wired.get(i);
        if (n) {
          c.fillStyle = NET_COLORS[n];
          c.fillRect(X(portX(i) - 0.05), Y(-0.165), 0.1 * S, 0.022 * S);
        }
      }
    });
    for (let i = 0; i < 24; i++) socket(`${tag}:${i}`, portX(i), d.y - 0.03);
  }
  function manager(u: number) {
    const d = device(null, u, 1, 0, "#141518", mFrame, () => undefined);
    const ring = track(new THREE.TorusGeometry(0.15, 0.022, 8, 24));
    ring.rotateY(Math.PI / 2);
    for (let i = 0; i < 6; i++) add(rack, ring, mFrame, -2 + i * 0.8, d.y, 0.18, true);
  }
  function switchUnit(id: DeviceId, u: number, tag: string, name: string, sub: string, wired: Set<number>, sfp: number[]) {
    const d = device(id, u, 1, 2.6, "#22242a", mBody, (c, X, Y, S) => {
      label(c, name, X(-2.3), Y(-0.03), 0.06 * S);
      void sub;
      for (let i = 0; i < 24; i++) label(c, String(i + 1), X(portX(i)), Y(-0.165), 0.05 * S, "rgba(235,235,225,0.6)", "center", 400);
      label(c, "SFP+", X(sfpX(1.5)), Y(-0.165), 0.05 * S, "rgba(235,235,225,0.6)", "center", 400);
    });
    for (let i = 0; i < 24; i++) {
      socket(`${tag}:${i}`, portX(i), d.y - 0.03);
      const on = wired.has(i);
      led(portX(i) - 0.032, d.y + 0.065, on ? "link" : "steady", on ? LED.green : LED.off);
      led(portX(i) + 0.032, d.y + 0.065, on ? "act" : "steady", on ? LED.amber : LED.off);
    }
    for (let i = 0; i < 4; i++) {
      socket(`${tag}:sfp${i}`, sfpX(i), d.y - 0.03);
      led(sfpX(i), d.y + 0.065, sfp.includes(i) ? "act" : "steady", sfp.includes(i) ? LED.blue : LED.off);
    }
    led(-2.24, d.y + 0.12, "steady", LED.green);
    return d;
  }

  // top to bottom
  patchPanel(12, "pa", wiredA, "PATCH A");
  manager(11);
  switchUnit("core", 10, "core", "CORE", "24 PORT GIGABIT  ·  4 SFP+  ·  VLAN TRUNK", new Set(wiredA.keys()), [0, 1]);
  patchPanel(9, "pb", wiredB, "PATCH B");
  manager(8);
  switchUnit("access", 7, "acc", "ACCESS", "24 PORT GIGABIT  ·  4 SFP+", new Set([...wiredB.keys(), 23]), [0, 1]);
  // brush panel: a slot with bristles for cables passing to the back
  device(null, 6, 1, 0, "#141518", mFrame, (c, X, Y, S) => {
    c.fillStyle = "#050506";
    c.fillRect(X(-2.1), Y(0.09), 4.2 * S, 0.18 * S);
    c.strokeStyle = "rgba(60,62,68,0.9)";
    c.lineWidth = 1.2;
    for (let x = -2.1; x < 2.1; x += 0.012) {
      c.beginPath();
      c.moveTo(X(x), Y(0.09));
      c.lineTo(X(x + 0.01), Y(-0.09));
      c.stroke();
    }
  });
  const fwX = (i: number) => -0.75 + i * 0.19;
  {
    const names = ["WAN", "LAN", "X2", "X3", "X4", "X5", "X6", "X7"];
    const d = device("firewall", 5, 1, 2.2, "#2a2420", track(new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: 0.5, metalness: 0.7 })), (c, X, Y, S) => {
      c.fillStyle = "#c2532f";
      c.fillRect(X(-2.415), Y(0.215), W * S, 0.035 * S);
      label(c, "FW-01", X(-2.3), Y(0.08), 0.085 * S);
      label(c, "FIREWALL  ·  POLICY  ·  SITE-TO-SITE VPN", X(-2.3), Y(-0.04), 0.05 * S, "rgba(235,235,225,0.5)", "left", 400);
      names.forEach((n, i) => label(c, n, X(fwX(i)), Y(-0.165), 0.05 * S, "rgba(235,235,225,0.65)", "center", 400));
      vents(c, X(1.05), Y(0.13), 1.15 * S, 0.3 * S, S);
    });
    names.forEach((_, i) => {
      socket(`fw:${i}`, fwX(i), d.y - 0.03);
      const on = i < 2;
      led(fwX(i) - 0.032, d.y + 0.065, on ? "link" : "steady", on ? LED.green : LED.off);
      led(fwX(i) + 0.032, d.y + 0.065, on ? "act" : "steady", on ? LED.amber : LED.off);
    });
    led(-1.35, d.y - 0.03, "steady", LED.green);
    led(-1.22, d.y - 0.03, "act", LED.blue);
  }
  const rtX = (i: number) => -0.6 + i * 0.19;
  {
    const names = ["WAN", "LAN1", "LAN2", "LAN3", "SFP"];
    const d = device("router", 4, 1, 2.2, "#1e2226", mBody, (c, X, Y, S) => {
      label(c, "RTR-01", X(-2.3), Y(0.08), 0.085 * S);
      label(c, "EDGE ROUTER  ·  ISP HANDOFF", X(-2.3), Y(-0.04), 0.05 * S, "rgba(235,235,225,0.5)", "left", 400);
      names.forEach((n, i) => label(c, n, X(rtX(i)), Y(-0.165), 0.05 * S, "rgba(235,235,225,0.65)", "center", 400));
      vents(c, X(0.75), Y(0.13), 1.45 * S, 0.3 * S, S);
    });
    names.forEach((_, i) => {
      socket(`rt:${i}`, rtX(i), d.y - 0.03);
      const on = i < 2;
      led(rtX(i) - 0.032, d.y + 0.065, on ? "link" : "steady", on ? LED.green : LED.off);
      led(rtX(i) + 0.032, d.y + 0.065, on ? "act" : "steady", on ? LED.amber : LED.off);
    });
    led(-1.2, d.y - 0.03, "steady", LED.green);
  }
  device(null, 3, 1, 0, "#141518", mFrame, (c, X, Y, S) => {
    vents(c, X(-2.05), Y(0.13), 4.1 * S, 0.28 * S, S);
  });
  {
    const d = device("ups", 1, 2, 3, "#18191c", mBody, (c, X, Y, S) => {
      label(c, "UPS-01", X(-2.3), Y(0.26), 0.09 * S);
      label(c, "BATTERY BACKUP  ·  LINE INTERACTIVE", X(-2.3), Y(0.13), 0.05 * S, "rgba(235,235,225,0.5)", "left", 400);
      vents(c, X(-2.3), Y(0.02), 2.3 * S, 0.36 * S, S);
      vents(c, X(1.35), Y(0.32), 0.95 * S, 0.66 * S, S);
      // power button
      c.strokeStyle = "rgba(235,235,225,0.7)";
      c.lineWidth = 0.012 * S;
      c.beginPath();
      c.arc(X(1.08), Y(-0.2), 0.07 * S, 0, Math.PI * 2);
      c.stroke();
    });
    // small lit display
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 256;
    const c = cv.getContext("2d")!;
    c.fillStyle = "#04140c";
    c.fillRect(0, 0, 512, 256);
    label(c, "ONLINE", 28, 52, 44, "#7dffb0");
    label(c, "LOAD", 28, 130, 30, "#3fbf7a", "left", 400);
    label(c, "BATT", 28, 200, 30, "#3fbf7a", "left", 400);
    c.fillStyle = "#3fbf7a";
    for (let i = 0; i < 10; i++) {
      c.globalAlpha = i < 4 ? 1 : 0.18;
      c.fillRect(140 + i * 34, 112, 26, 34);
      c.globalAlpha = i < 9 ? 1 : 0.18;
      c.fillRect(140 + i * 34, 182, 26, 34);
    }
    c.globalAlpha = 1;
    const tex = track(new THREE.CanvasTexture(cv));
    tex.colorSpace = THREE.SRGBColorSpace;
    const lcd = track(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    lcd.color.setScalar(1.25);
    add(rack, box(0.86, 0.46, 0.03), mDark, 0.5, d.y + 0.08, 0.022, false);
    add(rack, track(new THREE.PlaneGeometry(0.78, 0.39)), lcd, 0.5, d.y + 0.08, 0.04, false);
    led(1.08, d.y - 0.2, "steady", LED.green, 0.03);
  }

  /* ---------- access point above the rack ---------- */
  const apY = BASE - 0.25 + H + 1.5;
  const apPos = new THREE.Vector3(0, apY, -1.5);
  {
    add(rack, box(3.2, 0.07, 0.22), mFrame, 0, apY + 0.19, -1.5);
    add(rack, box(0.22, 0.07, 2.4), mFrame, 0, apY + 0.19, -1.5);
    const disc = add(rack, track(new THREE.CylinderGeometry(0.62, 0.66, 0.16, 48)), mPlastic, apPos.x, apPos.y + 0.05, apPos.z);
    disc.castShadow = true;
    const ringMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 1.7, 3.2), toneMapped: false }));
    const ring = add(rack, track(new THREE.TorusGeometry(0.34, 0.018, 8, 48)), ringMat, apPos.x, apPos.y - 0.035, apPos.z, false);
    ring.rotation.x = Math.PI / 2;
    register("ap", 1.5, 0.5, 1.5, apPos.x, apPos.y + 0.05, apPos.z);
  }

  /* ---------- cables ---------- */
  type Tag = Net | "trunk" | "power";
  const cables: { tag: Tag; nets: Net[] | "all"; mat: THREE.MeshStandardMaterial; color: THREE.Color }[] = [];
  const plugGeo = box(0.1, 0.085, 0.17);
  function cable(points: THREE.Vector3[], color: string, tag: Tag, nets: Net[] | "all", radius = 0.027, plugs: [boolean, boolean] = [true, true]) {
    const col = new THREE.Color(color);
    const mat = track(new THREE.MeshStandardMaterial({ color: col.clone(), roughness: 0.62, metalness: 0, emissive: col.clone(), emissiveIntensity: 0, envMapIntensity: 0.35 }));
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
    const tube = new THREE.Mesh(track(new THREE.TubeGeometry(curve, low ? 20 : 36, radius, low ? 5 : 8, false)), mat);
    tube.castShadow = !low;
    rack.add(tube);
    if (plugs[0]) add(rack, plugGeo, mat, points[0].x, points[0].y, points[0].z - 0.075, false);
    if (plugs[1]) add(rack, plugGeo, mat, points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z - 0.075, false);
    cables.push({ tag, nets, mat, color: col });
  }
  const P = (name: string) => ports.get(name)!.clone().add(new THREE.Vector3(0, 0, 0.16));
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  // patch panel -> switch, dipping through the cable manager between them
  function patch(panel: string, sw: string, wired: Map<number, Net>) {
    wired.forEach((net, i) => {
      const a = P(`${panel}:${i}`),
        b = P(`${sw}:${i}`);
      const bow = 0.36 + rand() * 0.16;
      cable([a, V(a.x, a.y - 0.06, a.z + 0.12), V(a.x + (rand() - 0.5) * 0.08, (a.y + b.y) / 2, bow), V(b.x, b.y + 0.06, b.z + 0.12), b], NET_COLORS[net], net, [net]);
    });
  }
  patch("pa", "core", wiredA);
  patch("pb", "acc", wiredB);
  // uplinks between the switches (two links, aqua), looping out on the right
  for (const i of [0, 1]) {
    const a = P(`core:sfp${i}`),
      b = P(`acc:sfp${i}`);
    const out = 2.02 + i * 0.16;
    cable([a, V(a.x + 0.1, a.y - 0.12, 0.42 + i * 0.08), V(out + 0.12, (a.y + b.y) / 2, 0.5 + i * 0.1), V(b.x + 0.1, b.y + 0.12, 0.42 + i * 0.08), b], "#35b8c8", "trunk", "all", 0.024);
  }
  {
    // access switch -> firewall LAN, firewall WAN -> router LAN, router WAN -> ISP (up and out the top)
    const a = P("acc:23"),
      b = P("fw:1");
    cable([a, V(a.x + 0.05, a.y - 0.2, 0.46), V((a.x + b.x) / 2 + 0.2, (a.y + b.y) / 2, 0.58), V(b.x, b.y + 0.18, 0.44), b], "#e9e9e4", "trunk", "all");
    const c = P("fw:0"),
      d = P("rt:1");
    cable([c, V(c.x - 0.05, c.y - 0.14, 0.42), V((c.x + d.x) / 2 - 0.12, (c.y + d.y) / 2, 0.5), V(d.x, d.y + 0.14, 0.42), d], "#e9e9e4", "trunk", "all");
    const w = P("rt:0");
    const top = BASE - 0.25 + H;
    cable([w, V(w.x - 0.3, w.y - 0.05, 0.5), V(-1.9, w.y + 0.05, 0.46), V(-postX - 0.3, w.y + 0.5, 0.2), V(-postX - 0.34, top * 0.55, -0.5), V(-postX - 0.3, top + 0.2, -1.2), V(-postX - 0.1, top + 2.6, -1.9)], "#7fb2e5", "trunk", "all", 0.03, [true, false]);
  }
  {
    // access point -> down the rear left post -> back of patch panel A (guest and staff Wi-Fi ride this drop)
    const pa = ports.get("pa:17")!;
    cable(
      [V(apPos.x, apPos.y + 0.13, apPos.z), V(apPos.x - 0.5, apPos.y + 0.27, apPos.z - 0.3), V(-postX + 0.25, apPos.y + 0.2, rearZ + 0.3), V(-postX + 0.3, pa.y + 0.9, rearZ + 0.34), V(-postX + 0.5, pa.y + 0.12, -1.6), V(pa.x, pa.y, -0.5)],
      NET_COLORS.guest,
      "guest",
      ["guest"],
      0.027,
      [false, false],
    );
  }
  // power cords from the back of each powered device to the power strip
  for (const [u, units] of [[10, 1], [7, 1], [5, 1], [4, 1], [1, 2]] as const) {
    const y = uY(u, units);
    cable([V(1.7, y, -2.25), V(2.0, y - 0.05, -2.75), V(postX - 0.32, y + 0.1, rearZ + 0.34)], "#0c0c0d", "power", "all", 0.035, [false, false]);
  }

  /* ---------- port lights as one instanced mesh ---------- */
  const ledMesh = new THREE.InstancedMesh(box(0.04, 0.026, 0.012), track(new THREE.MeshBasicMaterial({ toneMapped: false })), leds.length);
  {
    const m = new THREE.Matrix4();
    leds.forEach((l, i) => {
      ledMesh.setMatrixAt(i, m.makeTranslation(l.x, l.y, l.z));
      ledMesh.setColorAt(i, l.on ? l.color : LED.off);
    });
    ledMesh.instanceColor!.needsUpdate = true;
    rack.add(ledMesh);
  }

  /* ---------- post-processing glow ---------- */
  let composer: EffectComposer | null = null;
  if (!low) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.5, 1.35));
    composer.addPass(new OutputPass());
  }

  /* ---------- camera rig: drag to rotate, buttons to zoom ---------- */
  const CENTER_Y = BASE + (UNITS * U) / 2 + 0.55;
  const home = { az: 0.5, pol: 1.38, r: 15.5, ty: CENTER_Y };
  const cur = { ...home },
    goal = { ...home };
  let fit = 1; // extra distance on narrow screens
  let selected: DeviceId | null = null;
  let hovered: DeviceId | null = null;
  let traced: Net | null = null;
  let lastTouch = -1e9;
  let dirty = true;

  function place() {
    const r = cur.r * fit;
    const sp = Math.sin(cur.pol);
    camera.position.set(r * sp * Math.sin(cur.az), cur.ty + r * Math.cos(cur.pol), -1.4 + r * sp * Math.cos(cur.az));
    camera.lookAt(0, cur.ty, -1.4);
  }
  function resize() {
    const w = host.clientWidth || 1,
      h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    fit = camera.aspect < 0.8 ? 1.45 : camera.aspect < 1.25 ? 1.12 : 0.92;
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
    outlines.forEach((line, id) => {
      const on = id === selected || id === hovered;
      line.visible = on;
      (line.userData.more as THREE.LineSegments[] | undefined)?.forEach((l) => (l.visible = on));
    });
    dirty = true;
  }
  function setSelected(id: DeviceId | null, notify: boolean) {
    selected = id;
    if (id) {
      goal.ty = THREE.MathUtils.lerp(CENTER_Y, focusY.get(id) ?? CENTER_Y, 0.6);
      goal.r = Math.min(goal.r, 12.5);
    } else {
      goal.ty = home.ty;
      goal.r = Math.max(goal.r, home.r);
    }
    showOutline();
    if (notify) opts.onSelect(id);
  }
  function setTrace(net: Net | null) {
    traced = net;
    cables.forEach((c) => {
      const on = !net || c.nets === "all" || c.nets.includes(net);
      const live = on && c.tag !== "power";
      c.mat.color.copy(on ? c.color : new THREE.Color(0x1c1c1c));
      c.mat.emissive.copy(net && live ? c.color : new THREE.Color(0));
      c.mat.emissiveIntensity = net && live ? 0.9 : 0;
    });
    dirty = true;
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
  };
  const move = (e: PointerEvent) => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      goal.az = THREE.MathUtils.clamp(goal.az - dx * 0.0065, -1.25, 1.25);
      // on touch, up/down scrolls the page instead of tilting the rack
      if (!drag.touch) goal.pol = THREE.MathUtils.clamp(goal.pol - dy * 0.004, 0.95, 1.55);
      lastTouch = performance.now();
      return;
    }
    if (e.pointerType === "mouse") {
      const id = pick(e);
      if (id !== hovered) {
        hovered = id;
        el.style.cursor = id ? "pointer" : "grab";
        showOutline();
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
    }
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", cancel);
  el.addEventListener("pointerleave", leave);

  /* ---------- render loop: only runs while the rack is on screen ---------- */
  let raf = 0,
    last = 0,
    visible = false,
    dead = false;
  const tmp = new THREE.Color();
  function frame(now: number) {
    raf = 0;
    if (dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const t = now / 1000;
    if (!opts.reducedMotion) {
      // idle: a slow sway back and forth; stops while someone is using it
      if (!drag && !selected && now - lastTouch > 5000) goal.az = home.az + Math.sin(t * 0.16) * 0.36;
      let changed = false;
      leds.forEach((l, i) => {
        if (l.kind !== "act" || t < l.next) return;
        l.on = !l.on;
        l.next = t + (l.on ? 0.03 + rand() * 0.12 : 0.04 + rand() * rand() * 0.9);
        ledMesh.setColorAt(i, l.on ? l.color : tmp.copy(l.color).multiplyScalar(0.06));
        changed = true;
      });
      if (changed) ledMesh.instanceColor!.needsUpdate = true;
      if (traced) cables.forEach((c) => c.mat.emissiveIntensity > 0 && (c.mat.emissiveIntensity = 0.75 + Math.sin(t * 4) * 0.35));
      dirty = true;
    }
    const k = 1 - Math.exp(-dt * 6);
    for (const p of ["az", "pol", "r", "ty"] as const) {
      const d = goal[p] - cur[p];
      if (Math.abs(d) > 1e-4) {
        cur[p] += d * k;
        dirty = true;
      }
    }
    if (dirty) {
      dirty = false;
      place();
      if (composer) composer.render();
      else renderer.render(scene, camera);
    }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => {
    if (!raf && visible && !document.hidden && !dead) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  const io = new IntersectionObserver(([e]) => ((visible = e.isIntersecting), kick()), { rootMargin: "100px" });
  io.observe(host);
  document.addEventListener("visibilitychange", kick);
  place();

  return {
    select(id) {
      touched();
      setSelected(id, false);
      kick();
    },
    trace(net) {
      touched();
      setTrace(net);
      kick();
    },
    zoom(step) {
      touched();
      goal.r = THREE.MathUtils.clamp(goal.r - step * 2.5, 8, 22);
      kick();
    },
    reset() {
      Object.assign(goal, home);
      setSelected(null, true);
      setTrace(null);
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
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh || (o as THREE.LineSegments).isLineSegments) {
          const mat = m.material as THREE.Material & { map?: THREE.Texture | null };
          mat.map?.dispose();
        }
      });
      disposables.forEach((d) => d.dispose());
      composer?.dispose();
      renderer.dispose();
      el.remove();
    },
  };
}
