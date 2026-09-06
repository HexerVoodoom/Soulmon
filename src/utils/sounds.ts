import { readFlag, writeFlag } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

const MUTED_KEY = STORAGE_KEYS.SOUND_MUTED;

export function isMuted(): boolean {
  return readFlag(MUTED_KEY);
}

export function setMuted(v: boolean): void {
  // Preferência cosmética: se não persistir, o som volta na próxima sessão.
  // Não vale gastar o aviso único do usuário.
  writeFlag(MUTED_KEY, v, { silent: true });
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

/* ── WP3.5 — O SOM DE PRESENÇA (decisão D11) ─────────────────────────────
   Um sonzinho curto, de duas notas, que o pet faz ao ser TOCADO. É a única
   coisa do app que existe para dizer "tem alguém aqui" — todos os outros sons
   confirmam uma ação (comeu, limpou, evoluiu).

   A fronteira da D11 é o pacote inteiro, e ela está no CHAMADOR e aqui:
    · **só em resposta a gesto** — toque, chegada, carinho. NUNCA idle, nunca
      com `document.hidden`. Som que sai sozinho não é presença, é alarme, e
      foi o bipe que fez as escolas banirem o Tamagotchi.
    · **uma vez por sessão.** Repetido, vira ruído; e a coisa que ele
      comunica ("estou aqui") só precisa ser dita uma vez.
   O `presencaTocadaRef` do `CompanionHUD` é quem guarda a segunda regra. */
export function playPresence(): void {
  play(ctx => {
    beep(ctx, 587, 0, 0.07, 'sine', 0.05);
    beep(ctx, 880, 0.08, 0.12, 'sine', 0.045);
  });
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
export function playEvolve(): void {
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

/**
 * O CHIADO CURTO DA SINTONIA — o terceiro terço da sintonia do Visor
 * (spec §2.3.1: "scanline de 400 ms + fade de 120 ms reserva→próprio + o
 * chiado curto que a ocasião A já usa").
 *
 * ⚠️ DIVERGÊNCIA doc↔código nº 10 do projeto (a 9ª está registrada em
 * `spriteGen.contract.test.ts`). A spec afirma que a ocasião A **já usa** o
 * chiado. Não usava: até este commit não existia som de sintonia nenhum no
 * código, em call-site nenhum — a busca por `play*` nas duas telas da sintonia
 * (`EvolutionPath`, `CompanionHUD`) não devolvia nada, e o único som do
 * `CompanionHUD` era o `playShower`. Pior: a própria spec se contradiz — a
 * tabela do §2.1 dá "nada" na coluna de fora do visor para a ocasião A,
 * enquanto a prosa do §2.3 (linha 124) pede o chiado. Este arquivo é o lugar
 * onde a frase deixa de mentir: o chiado passa a existir, e nasce nos DOIS
 * call-sites de uma vez, não só no que a spec dizia já ter.
 *
 * **Por que ruído filtrado e não `beep`.** Os outros nove sons são osciladores
 * — a linguagem certa para nota, arpejo e sweep. Chiado não tem altura: é
 * banda de ruído. Um oscilador imitando estática só consegue soar como alarme,
 * e a sintonia é uma coisa BOA acontecendo (o Visor achou o rosto próprio do
 * bicho). Daí o desenho: ruído branco curto (180 ms) passando por um bandpass
 * que SOBE de 900 Hz para 2,4 kHz — a mesma curva de um rádio saindo do meio
 * da faixa e travando na estação —, envelope que abre em 8 ms e decai até o
 * silêncio, ganho de 0,05 (metade do som mais discreto do arquivo, o
 * `playMenuOpen`). Sem graves: grave curto é impacto, e impacto assusta.
 *
 * O gate de mudo e o AudioContext são os do `play()`; aqui não nasce plumbing
 * nenhum. O corte por movimento reduzido NÃO mora aqui — mora no call-site,
 * porque quem sabe se a varredura correspondente existiu é quem varre. Veja o
 * raciocínio em `EvolutionPath.tsx`/`CompanionHUD.tsx`.
 */
export function playVisorTune(): void {
  play(ctx => {
    const DUR = 0.18;
    const taxa = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.ceil(taxa * DUR), taxa);
    const canal = buffer.getChannelData(0);
    for (let i = 0; i < canal.length; i++) canal[i] = Math.random() * 2 - 1;

    const fonte = ctx.createBufferSource();
    fonte.buffer = buffer;

    // Bandpass estreito: é o que separa "estação sintonizando" de "chuvisco".
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 3;

    const vol = ctx.createGain();
    fonte.connect(filtro);
    filtro.connect(vol);
    vol.connect(ctx.destination);

    const t = ctx.currentTime;
    filtro.frequency.setValueAtTime(900, t);
    filtro.frequency.exponentialRampToValueAtTime(2400, t + DUR);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.05, t + 0.008);
    vol.gain.exponentialRampToValueAtTime(0.0001, t + DUR);

    fonte.start(t);
    fonte.stop(t + DUR);
  });
}
