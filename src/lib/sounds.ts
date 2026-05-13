"use client";

// Sons sintéticos via Web Audio API — portado de few-glasses.

type SoundName = "drink" | "achievement" | "goalComplete" | "transition" | "tick";

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (Ctx) ctx = new Ctx();
  }
  return ctx;
}

function isEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("skatoday:sound") !== "off";
}

function tone(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  freqEnd?: number;
  volume?: number;
  delay?: number;
}) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t0 = c.currentTime + (opts.delay ?? 0);
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + opts.duration);
  }
  const vol = opts.volume ?? 0.18;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + opts.duration);
}

export function play(name: SoundName) {
  if (!isEnabled()) return;
  switch (name) {
    case "drink":
      tone({ freq: 800, freqEnd: 400, duration: 0.2 });
      break;
    case "achievement":
      [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, duration: 0.2, delay: i * 0.08 }));
      break;
    case "goalComplete":
      [659, 698, 784, 831].forEach((f, i) => tone({ freq: f, duration: 0.35, delay: i * 0.18, volume: 0.22 }));
      break;
    case "transition":
      tone({ freq: 2000, duration: 0.04, type: "square", volume: 0.08 });
      break;
    case "tick":
      tone({ freq: 1200, duration: 0.025, type: "square", volume: 0.06 });
      break;
  }
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("skatoday:sound", on ? "on" : "off");
}

export function getSoundEnabled() {
  return isEnabled();
}
