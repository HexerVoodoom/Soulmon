const MUTED_KEY = 'digiapp-sound-muted';

export function isMuted(): boolean {
  return localStorage.getItem(MUTED_KEY) === 'true';
}

export function setMuted(v: boolean): void {
  localStorage.setItem(MUTED_KEY, v ? 'true' : 'false');
}

function play(fn: (ctx: AudioContext) => void): void {
  if (isMuted()) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    fn(ctx);
    setTimeout(() => ctx.close().catch(() => {}), 2000);
  } catch {
    // silently ignore — some browsers block AudioContext without user gesture
  }
}

function beep(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.12,
): void {
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + startOffset;
  vol.gain.setValueAtTime(0, t);
  vol.gain.linearRampToValueAtTime(gain, t + 0.005);
  vol.gain.setValueAtTime(gain, t + duration - 0.02);
  vol.gain.linearRampToValueAtTime(0, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

/** Short ascending 3-note arpeggio (C–E–G) */
export function playTaskComplete(): void {
  play(ctx => {
    beep(ctx, 523, 0,    0.08);
    beep(ctx, 659, 0.09, 0.08);
    beep(ctx, 784, 0.18, 0.15);
  });
}

/** Quick 2-note munch */
export function playFeed(): void {
  play(ctx => {
    beep(ctx, 440, 0,    0.06);
    beep(ctx, 330, 0.07, 0.09);
  });
}

/** Low sawtooth alarm for poop event appearing */
export function playPoopAlert(): void {
  play(ctx => {
    beep(ctx, 147, 0,    0.12, 'sawtooth', 0.10);
    beep(ctx, 98,  0.14, 0.12, 'sawtooth', 0.10);
    beep(ctx, 147, 0.28, 0.12, 'sawtooth', 0.10);
  });
}

/** Ascending frequency sweep — clean! */
export function playPoopClean(): void {
  play(ctx => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.type = 'square';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.25);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.1, t + 0.01);
    vol.gain.setValueAtTime(0.1, t + 0.22);
    vol.gain.linearRampToValueAtTime(0, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

/** Water-drip bursts */
export function playShower(): void {
  play(ctx => {
    const pitches = [600, 750, 520, 680, 580, 720];
    pitches.forEach((freq, i) => {
      beep(ctx, freq, i * 0.09, 0.06, 'sine', 0.07);
    });
  });
}

/** Dramatic power-up sweep + two high notes */
export function playDigivolve(): void {
  play(ctx => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.type = 'square';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.55);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.12, t + 0.01);
    vol.gain.setValueAtTime(0.12, t + 0.53);
    vol.gain.linearRampToValueAtTime(0, t + 0.56);
    osc.start(t);
    osc.stop(t + 0.56);

    beep(ctx, 1047, 0.58, 0.08);
    beep(ctx, 1319, 0.68, 0.15);
  });
}

/** Descending sad tones + low thud */
export function playDegenerate(): void {
  play(ctx => {
    beep(ctx, 440, 0,    0.12);
    beep(ctx, 349, 0.14, 0.12);
    beep(ctx, 262, 0.28, 0.15);
    beep(ctx, 147, 0.45, 0.25, 'square', 0.08);
  });
}

/** Tiny click for UI interactions */
export function playMenuOpen(): void {
  play(ctx => {
    beep(ctx, 800, 0, 0.04, 'square', 0.08);
  });
}

/** Soft descending lullaby notes */
export function playSleep(): void {
  play(ctx => {
    beep(ctx, 523, 0,    0.18, 'sine', 0.08);
    beep(ctx, 440, 0.21, 0.18, 'sine', 0.07);
    beep(ctx, 349, 0.44, 0.25, 'sine', 0.05);
  });
}
