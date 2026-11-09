import { Mail, Play, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { profile } from "./data";
import { PhoneFrame } from "./field";
import { go } from "./parts";
import { logVisit } from "./track";

/** Personal intro: a small corner bubble with a silent loop, opening a player with sound. */
const OPEN_EVENT = "bb-intro-open";
const HIDE_KEY = "bb-intro-hidden";
const m = (f: string) => `/media/${f}`;

export function openIntro() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function readHidden() {
  try {
    return sessionStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
}
function writeHidden() {
  try {
    sessionStorage.setItem(HIDE_KEY, "1");
  } catch {
    /* private mode: just hide for now */
  }
}

function Player({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    logVisit("/intro");
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = o;
      prev?.focus();
    };
  }, [onClose]);
  const replay = () => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    setEnded(false);
    void v.play();
  };
  const btn = "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-md transition-transform hover:scale-[1.03]";
  return (
    <div role="dialog" aria-modal="true" aria-label={`Intro video from ${profile.name}`} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2f3020]/92 p-4 backdrop-blur-sm" onClick={onClose}>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close intro" className="bg-background/90 text-foreground absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full shadow-md">
        <X className="size-5" />
      </button>
      <div className="flex max-h-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <PhoneFrame className="h-[min(80vh,780px)] w-auto [&>div]:h-full">
          <video
            ref={ref}
            src={m("intro.mp4")}
            poster={m("intro-poster.jpg")}
            autoPlay
            playsInline
            controls={!ended}
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onEnded={() => setEnded(true)}
            className="h-full w-full bg-black object-cover"
          />
          {ended ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#2f3020] p-6 text-center">
              <p className="text-xl font-semibold text-[#f3f2f6]">Thanks for watching!</p>
              <a href={`mailto:${profile.email}`} className={`${btn} bg-primary text-primary-foreground`}>
                <Mail className="size-4" /> Email me
              </a>
              <button type="button" onClick={() => (onClose(), go("/#work"))} className={`${btn} bg-background text-foreground`}>
                See my work
              </button>
              <button type="button" onClick={replay} className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#cdcbd6] underline-offset-4 hover:underline">
                <RotateCcw className="size-3.5" /> Watch again
              </button>
            </div>
          ) : null}
        </PhoneFrame>
        <p className="mt-3 text-center text-sm text-[#cdcbd6]">Sound on · 28 seconds</p>
      </div>
    </div>
  );
}

/** Floating bubble, bottom-left. Appears after 2 seconds; the ✕ hides it for this visit. */
export function IntroBubble() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  const loopRef = useRef<HTMLVideoElement>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    let t: number | undefined;
    if (!readHidden()) t = window.setTimeout(() => setShow(true), 2000);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      if (t) window.clearTimeout(t);
    };
  }, []);
  useEffect(() => {
    const v = loopRef.current;
    if (!v) return;
    if (open) v.pause();
    else v.play().catch(() => {});
  }, [open, show]);
  const close = useCallback(() => setOpen(false), []);
  const hide = () => {
    writeHidden();
    setShow(false);
  };

  return (
    <>
      {show ? (
        <div className="no-print animate-in fade-in slide-in-from-bottom-4 fixed bottom-3 left-3 z-50 flex items-center gap-2 duration-500 sm:bottom-6 sm:left-6">
          <button type="button" onClick={() => setOpen(true)} aria-label={`Play a 28-second intro from ${profile.name}`} className="group bg-background/95 flex items-center gap-2 rounded-full py-1 pr-3 pl-1 sm:gap-3 sm:py-1.5 sm:pr-4 sm:pl-1.5 shadow-[0_10px_30px_-10px_rgba(47,48,32,0.55)] ring-1 ring-black/10 backdrop-blur transition-transform hover:scale-[1.03] dark:ring-white/15">
            <span className="ring-primary relative block size-11 shrink-0 overflow-hidden rounded-full ring-2 sm:size-16">
              {reduced ? (
                <img src={m("intro-bubble.jpg")} alt="" className="h-full w-full object-cover" />
              ) : (
                <video ref={loopRef} src={m("intro-bubble.mp4")} poster={m("intro-bubble.jpg")} muted loop playsInline autoPlay preload="metadata" aria-hidden className="h-full w-full object-cover" />
              )}
              <span className="bg-primary text-primary-foreground absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full ring-2 ring-white">
                <Play className="size-2.5 fill-current" />
              </span>
            </span>
            <span className="text-left leading-tight">
              <span className="block text-xs font-semibold sm:text-sm">👋 Hi, I'm Bernie</span>
              <span className="text-muted-foreground hidden text-xs sm:block">Watch my intro · 28s</span>
            </span>
          </button>
          <button type="button" onClick={hide} aria-label="Hide intro" className="bg-background/95 text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-full shadow-md sm:size-8 ring-1 ring-black/10 dark:ring-white/15">
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      {open ? <Player onClose={close} /> : null}
    </>
  );
}
