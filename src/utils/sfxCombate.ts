/**
 * OS 7 EFEITOS SONOROS DO COMBATE — síntese procedural PRÓPRIA (pedido do dono, 19/10/2026, D-86..D-92).
 *
 * ⚠️ **Desde 20/10/2026 (§130) isto é o FALLBACK, não o padrão.** O dono não gostou do timbre e pediu um banco gratuito: o
 * padrão agora são os 7 samples CC0 de `SFX_DE_COMBATE_LIVRES` (`sonsAssets.ts`). Este módulo só toca quando o arquivo não
 * chegou ou não decodificou. Continua medido e testado (`sfxCombate.test.ts`) porque um fallback sem régua apodrece.
 *
 * Origem de todos: `procedural próprio` (código deste arquivo; nenhum arquivo de áudio, nenhuma IA, nenhum serviço pago,
 * nenhum jingle de terceiro). Licença: do próprio projeto. A decisão e a alternativa que perdeu estão em
 * `docs/REGISTRO-DE-DECISOES.md` (SFX de combate procedurais).
 *
 * **Por que um módulo PURO (sem `AudioContext`).** Cada efeito é uma função `(sampleRate) → Float32Array` determinística
 * (ruído com semente fixa): o MESMO sinal sai em toda máquina e em todo teste. Isso permite medir, em Node, o que o
 * gate de som exige — duração, pico (true peak) e loudness (LUFS-M, K-weighting) — sem navegador, e renderizar os 7
 * em WAV para o dono ouvir (`scripts/render-sfx-combate.mjs`). `sounds.ts` só toca o buffer pelo barramento
 * (`tocarNa`), então o gate de mudo, o gesto, a R-EX e o ducking continuam sendo os de sempre.
 *
 * **Nível.** Cada efeito nasce num nível NOMINAL (pico 0,8) e o `OFFSET_POR_SOM_DB` de `loudness.ts` (dono único dos
 * números) o leva ao alvo da categoria — `arcade`, porque o EVENTO é combate (R-CAT). O offset é medido por este mesmo
 * sinal (`sfxCombate.loudness.test.ts` re-mede e reprova se divergir além da tolerância).
 *
 * **Mapa evento → efeito** (quem dispara é `games/BattleStage.tsx`; a vitória/derrota, as 4 telas de luta):
 *   D-86 ataque FÍSICO (investida)      → `playAttack`        corte: sopro de lâmina + "shing" metálico + baque
 *   D-87 DEFESA (golpe bloqueado)       → `playDefend`        escudo: baque grave + tinido de metal
 *   D-88 ataque MÁGICO (projétil)       → `playAttackRanged`  poder mágico: glissando brilhante + sino FM + cintilar
 *   D-89 CARREGANDO o especial          → `playCharge`        energia subindo (crescendo)
 *   D-90 SOLTANDO o especial            → `playSpecial`       estouro: sub-grave + estalo + varredura + acorde brilhante
 *   D-91 VITÓRIA (curta)                → `playVictory`       corrida pentatônica + acorde que segura
 *   D-92 DERROTA (curta, neutra)        → `playDefeat`        três notas suaves descendo, sem dissonância nem escárnio
 */

export type NomeSfxCombate =
  | 'playAttack' | 'playDefend' | 'playAttackRanged' | 'playCharge' | 'playSpecial' | 'playVictory' | 'playDefeat';

export interface SfxDeCombate {
  /** O item do pedido do dono (`docs/.../2026-10-19-refino-ui-notificacoes-mercado-exploracao.md`, §11). */
  id: 'D-86' | 'D-87' | 'D-88' | 'D-89' | 'D-90' | 'D-91' | 'D-92';
  evento: string;
  /** Duração do sinal, em segundos (teto: efeitos ≤ 1,2 s; vitória/derrota ≤ 2 s). */
  duracaoS: number;
  /** Teto de duração do pedido para este efeito. */
  tetoS: number;
  origem: 'procedural próprio';
  licenca: 'projeto (código próprio)';
}

/** O manifesto/registro dos 7 efeitos. A categoria de cada um mora em `CATEGORIA_DO_SOM` (`loudness.ts`). */
export const SFX_DE_COMBATE: Record<NomeSfxCombate, SfxDeCombate> = {
  playAttack: { id: 'D-86', evento: 'ataque físico (corte)', duracaoS: 0.3, tetoS: 1.2, origem: 'procedural próprio', licenca: 'projeto (código próprio)' },
  playDefend: { id: 'D-87', evento: 'defesa / bloqueio', duracaoS: 0.4, tetoS: 1.2, origem: 'procedural próprio', licenca: 'projeto (código próprio)' },
  playAttackRanged: { id: 'D-88', evento: 'ataque mágico', duracaoS: 0.75, tetoS: 1.2, origem: 'procedural próprio', licenca: 'projeto (código próprio)' },
  playCharge: { id: 'D-89', evento: 'carregando o especial', duracaoS: 0.95, tetoS: 1.2, origem: 'procedural próprio', licenca: 'projeto (código próprio)' },
  playSpecial: { id: 'D-90', evento: 'soltando o especial', duracaoS: 1.05, tetoS: 1.2, origem: 'procedural próprio', licenca: 'projeto (código próprio)' },
  playVictory: { id: 'D-91', evento: 'vitória', duracaoS: 1.3, tetoS: 2, origem: 'procedural próprio', licenca: 'projeto (código próprio)' },
  playDefeat: { id: 'D-92', evento: 'derrota (tom neutro)', duracaoS: 1.3, tetoS: 2, origem: 'procedural próprio', licenca: 'projeto (código próprio)' },
};

export const NOMES_SFX_DE_COMBATE = Object.keys(SFX_DE_COMBATE) as NomeSfxCombate[];

/** Pico NOMINAL do sinal renderizado (−1,9 dBFS): o offset de `loudness.ts` o leva ao alvo da categoria. */
export const PICO_NOMINAL = 0.8;

/* ── primitivas ─────────────────────────────────────────────────────────── */

/** PRNG de semente fixa: o "ruído" é o mesmo em toda renderização (um som que é sorteio não é um asset). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Onda = 'sine' | 'tri' | 'saw' | 'square';
const TAU = Math.PI * 2;

/** Onda de fase `ph` ∈ [0,1) com harmônicos limitados pelo Nyquist (sem aliasing audível). */
function onda(tipo: Onda, ph: number, freq: number, sr: number): number {
  if (tipo === 'sine') return Math.sin(TAU * ph);
  const kMax = Math.max(1, Math.min(14, Math.floor((sr * 0.45) / Math.max(freq, 1))));
  let s = 0;
  if (tipo === 'saw') {
    for (let k = 1; k <= kMax; k++) s += Math.sin(TAU * k * ph) / k;
    return s * 0.6;
  }
  if (tipo === 'square') {
    for (let k = 1; k <= kMax; k += 2) s += Math.sin(TAU * k * ph) / k;
    return s * 0.8;
  }
  for (let k = 1; k <= kMax; k += 2) s += (((k - 1) / 2) % 2 === 0 ? 1 : -1) * Math.sin(TAU * k * ph) / (k * k); // tri
  return s * 0.8;
}

interface Voz {
  t0: number; dur: number; f0: number; f1?: number; onda: Onda; ganho: number;
  /** Ataque linear, s (padrão 4 ms). */
  ataque?: number;
  /** Constante de tempo do decaimento exponencial, s; ausente = sustenta até o release. */
  tau?: number;
  /** Release linear no fim, s (padrão 20 ms). */
  release?: number;
  /** Tremolo: frequência e profundidade (0..1). */
  trem?: { hz: number; prof: number };
  /** O envelope CRESCE do início ao fim (quadrático) em vez de decair. */
  crescendo?: boolean;
}

function envelope(t: number, dur: number, ataque: number, tau: number | undefined, release: number, crescendo: boolean): number {
  if (t < 0 || t >= dur) return 0;
  let e = crescendo ? 0.08 + 0.92 * Math.pow(t / dur, 2) : 1;
  if (t < ataque) e *= t / ataque;
  else if (!crescendo && tau) e *= Math.exp(-(t - ataque) / tau);
  const resto = dur - t;
  if (resto < release) e *= resto / release;
  return e;
}

function somarVoz(out: Float32Array, sr: number, v: Voz): void {
  const ini = Math.max(0, Math.floor(v.t0 * sr));
  const n = Math.floor(v.dur * sr);
  const f1 = v.f1 ?? v.f0;
  const razao = f1 / v.f0;
  let ph = 0;
  for (let i = 0; i < n && ini + i < out.length; i++) {
    const t = i / sr;
    const f = v.f0 * Math.pow(razao, t / v.dur);
    ph += f / sr;
    ph -= Math.floor(ph);
    let e = envelope(t, v.dur, v.ataque ?? 0.004, v.tau, v.release ?? 0.02, !!v.crescendo);
    if (v.trem) e *= 1 - v.trem.prof * 0.5 * (1 - Math.cos(TAU * v.trem.hz * t));
    out[ini + i] += v.ganho * e * onda(v.onda, ph, f, sr);
  }
}

interface Ruido {
  t0: number; dur: number; f0: number; f1?: number; q: number; ganho: number;
  ataque?: number; tau?: number; release?: number; crescendo?: boolean;
  trem?: { hz: number; prof: number };
  semente: number;
}

/** Ruído branco por um passa-faixa RBJ (ganho de pico 0 dB) cuja frequência central VARRE de `f0` a `f1`. */
function somarRuido(out: Float32Array, sr: number, r: Ruido): void {
  const rng = mulberry32(r.semente);
  const ini = Math.max(0, Math.floor(r.t0 * sr));
  const n = Math.floor(r.dur * sr);
  const f1 = r.f1 ?? r.f0;
  const razao = f1 / r.f0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let b0 = 0, b2 = 0, a1 = 0, a2 = 0;
  for (let i = 0; i < n && ini + i < out.length; i++) {
    const t = i / sr;
    if (i % 16 === 0) {
      const f = Math.min(r.f0 * Math.pow(razao, t / r.dur), sr * 0.45);
      const w = (TAU * f) / sr;
      const alfa = Math.sin(w) / (2 * r.q);
      const a0 = 1 + alfa;
      b0 = alfa / a0; b2 = -alfa / a0;
      a1 = (-2 * Math.cos(w)) / a0; a2 = (1 - alfa) / a0;
    }
    const x = rng() * 2 - 1;
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    let e = envelope(t, r.dur, r.ataque ?? 0.004, r.tau, r.release ?? 0.02, !!r.crescendo);
    if (r.trem) e *= 1 - r.trem.prof * 0.5 * (1 - Math.cos(TAU * r.trem.hz * t));
    out[ini + i] += r.ganho * e * y;
  }
}

/** Sino FM: portadora `fc`, moduladora `fc·razao`, índice que decai com `tauIndice`. */
function somarSino(
  out: Float32Array, sr: number,
  s: { t0: number; dur: number; fc: number; razao: number; indice: number; tauIndice: number; tau: number; ganho: number },
): void {
  const ini = Math.max(0, Math.floor(s.t0 * sr));
  const n = Math.floor(s.dur * sr);
  for (let i = 0; i < n && ini + i < out.length; i++) {
    const t = i / sr;
    const idx = s.indice * Math.exp(-t / s.tauIndice);
    const e = envelope(t, s.dur, 0.002, s.tau, 0.03, false);
    out[ini + i] += s.ganho * e * Math.sin(TAU * s.fc * t + idx * Math.sin(TAU * s.fc * s.razao * t));
  }
}

/** Ecos de realimentação curta: dá "ar" sem abrir um nó de delay no grafo. */
function eco(out: Float32Array, sr: number, atrasoS: number, fb: number, repeticoes: number): void {
  const d = Math.round(atrasoS * sr);
  for (let r = 0; r < repeticoes; r++) {
    for (let i = out.length - 1; i >= d; i--) out[i] += out[i - d] * fb;
  }
}

/** Fecha o sinal: sem clique (rampa de 1 ms na cabeça, 10 ms no fim) e pico = `PICO_NOMINAL`. */
function fechar(out: Float32Array, sr: number): Float32Array {
  const cabeca = Math.round(0.001 * sr), cauda = Math.round(0.01 * sr);
  for (let i = 0; i < cabeca && i < out.length; i++) out[i] *= i / cabeca;
  for (let i = 0; i < cauda && i < out.length; i++) out[out.length - 1 - i] *= i / cauda;
  let pico = 0;
  for (let i = 0; i < out.length; i++) pico = Math.max(pico, Math.abs(out[i]));
  if (pico > 0) for (let i = 0; i < out.length; i++) out[i] *= PICO_NOMINAL / pico;
  return out;
}

const buf = (s: number, sr: number): Float32Array => new Float32Array(Math.round(s * sr));

/* ── os 7 efeitos ───────────────────────────────────────────────────────── */

/** D-86 — CORTE: um sopro de lâmina (ruído que varre do agudo ao médio), o "shing" metálico por cima e um baque curto. */
function renderAtaque(sr: number): Float32Array {
  const o = buf(0.3, sr);
  somarVoz(o, sr, { t0: 0, dur: 0.07, f0: 150, f1: 55, onda: 'sine', ganho: 0.5, tau: 0.022 });
  somarRuido(o, sr, { t0: 0, dur: 0.24, f0: 7000, f1: 2200, q: 0.9, ganho: 1, ataque: 0.006, tau: 0.07, semente: 86 });
  [[1, 0.35], [2.32, 0.25], [3.7, 0.15]].forEach(([r, g]) => somarVoz(o, sr, { t0: 0.03, dur: 0.17, f0: 2300 * r, onda: 'sine', ganho: g, ataque: 0.002, tau: 0.045 }));
  return fechar(o, sr);
}

/** D-87 — DEFESA: um baque grave (o escudo recebendo) e um tinido de metal que ressoa — mais grave e mais longo que o corte. */
function renderDefesa(sr: number): Float32Array {
  const o = buf(0.4, sr);
  somarVoz(o, sr, { t0: 0, dur: 0.15, f0: 190, f1: 70, onda: 'sine', ganho: 0.9, tau: 0.04 });
  [[1, 0.6, 0.16], [2.76, 0.45, 0.12], [5.4, 0.3, 0.09], [8.93, 0.15, 0.06]].forEach(([r, g, tau]) =>
    somarVoz(o, sr, { t0: 0, dur: 0.38, f0: 520 * r, onda: 'sine', ganho: g, ataque: 0.002, tau }));
  somarRuido(o, sr, { t0: 0, dur: 0.025, f0: 3500, q: 1, ganho: 0.6, ataque: 0.001, tau: 0.008, semente: 87 });
  return fechar(o, sr);
}

/** D-88 — PODER MÁGICO: glissando brilhante subindo (duas vozes levemente desafinadas), um sino FM e cintilar agudo, com eco. */
function renderMagia(sr: number): Float32Array {
  const o = buf(0.75, sr);
  somarVoz(o, sr, { t0: 0, dur: 0.3, f0: 523, f1: 1568, onda: 'sine', ganho: 0.5, ataque: 0.02, tau: 0.5, trem: { hz: 14, prof: 0.25 } });
  somarVoz(o, sr, { t0: 0, dur: 0.3, f0: 527, f1: 1580, onda: 'tri', ganho: 0.35, ataque: 0.02, tau: 0.5, trem: { hz: 14, prof: 0.25 } });
  somarSino(o, sr, { t0: 0.26, dur: 0.42, fc: 1568, razao: 3.5, indice: 2.5, tauIndice: 0.25, tau: 0.22, ganho: 0.5 });
  somarRuido(o, sr, { t0: 0.08, dur: 0.5, f0: 7000, q: 4, ganho: 0.35, ataque: 0.1, tau: 0.2, trem: { hz: 28, prof: 0.6 }, semente: 88 });
  eco(o, sr, 0.11, 0.3, 2);
  return fechar(o, sr);
}

/** D-89 — CARREGANDO: energia que sobe de grave a agudo num crescendo, com pulsação cada vez mais rápida e um sopro que abre. */
function renderCarga(sr: number): Float32Array {
  const o = buf(0.95, sr);
  somarVoz(o, sr, { t0: 0, dur: 0.95, f0: 90, f1: 360, onda: 'saw', ganho: 0.6, crescendo: true, ataque: 0.01, trem: { hz: 12, prof: 0.35 } });
  somarVoz(o, sr, { t0: 0, dur: 0.95, f0: 180, f1: 720, onda: 'sine', ganho: 0.5, crescendo: true, ataque: 0.01, trem: { hz: 18, prof: 0.2 } });
  somarRuido(o, sr, { t0: 0, dur: 0.95, f0: 500, f1: 4500, q: 1.2, ganho: 0.35, crescendo: true, ataque: 0.01, semente: 89 });
  return fechar(o, sr);
}

/** D-90 — SOLTANDO: o estouro — sub-grave que cai, estalo de ruído, varredura brilhante descendo e um acorde que cintila. */
function renderEspecial(sr: number): Float32Array {
  const o = buf(1.05, sr);
  somarVoz(o, sr, { t0: 0, dur: 0.55, f0: 130, f1: 38, onda: 'sine', ganho: 1, tau: 0.16 });
  somarRuido(o, sr, { t0: 0, dur: 0.25, f0: 1800, q: 0.6, ganho: 1, ataque: 0.002, tau: 0.05, semente: 90 });
  somarVoz(o, sr, { t0: 0, dur: 0.4, f0: 2600, f1: 260, onda: 'saw', ganho: 0.45, tau: 0.12 });
  [[659, 0.35], [988, 0.28], [1319, 0.2]].forEach(([f, g]) => {
    somarVoz(o, sr, { t0: 0.05, dur: 0.95, f0: f, onda: 'sine', ganho: g, ataque: 0.01, tau: 0.3 });
    somarVoz(o, sr, { t0: 0.05, dur: 0.95, f0: f * 1.004, onda: 'sine', ganho: g * 0.6, ataque: 0.01, tau: 0.3 });
  });
  return fechar(o, sr);
}

/** D-91 — VITÓRIA: corrida pentatônica ascendente (G4–C5–E5–G5) que cai num acorde de dó maior que segura e se apaga. */
function renderVitoria(sr: number): Float32Array {
  const o = buf(1.3, sr);
  [[392, 0], [523, 0.11], [659, 0.22], [784, 0.33]].forEach(([f, t]) => {
    somarVoz(o, sr, { t0: t, dur: 0.2, f0: f, onda: 'tri', ganho: 0.6, ataque: 0.006, tau: 0.09 });
    somarVoz(o, sr, { t0: t, dur: 0.2, f0: f * 2, onda: 'sine', ganho: 0.18, ataque: 0.006, tau: 0.06 });
  });
  [523, 659, 784, 1047].forEach((f, i) => {
    somarVoz(o, sr, { t0: 0.46, dur: 0.8, f0: f, onda: 'tri', ganho: 0.45 - i * 0.04, ataque: 0.01, tau: 0.32 });
    somarVoz(o, sr, { t0: 0.46, dur: 0.8, f0: f * 2, onda: 'sine', ganho: 0.1, ataque: 0.01, tau: 0.2 });
  });
  eco(o, sr, 0.13, 0.22, 1);
  return fechar(o, sr);
}

/**
 * D-92 — DERROTA, tom NEUTRO. Três notas suaves e lentas descendo (lá–fá–ré), timbre de seno/triângulo, ataque macio,
 * resolvendo numa terça menor consonante com um pedal grave — sem dissonância, sem glissando "de trombone", sem
 * vibrato choroso. É um "fim de rodada", não um "você falhou" (a derrota do Soulmon nunca cobra: `CLAUDE.md`, C-6).
 */
function renderDerrota(sr: number): Float32Array {
  const o = buf(1.3, sr);
  [[440, 0, 0.4, 0.2], [349.2, 0.34, 0.4, 0.2], [293.7, 0.68, 0.62, 0.34]].forEach(([f, t, d, tau]) => {
    somarVoz(o, sr, { t0: t, dur: d, f0: f, onda: 'sine', ganho: 0.6, ataque: 0.03, tau });
    somarVoz(o, sr, { t0: t, dur: d, f0: f, onda: 'tri', ganho: 0.18, ataque: 0.03, tau });
  });
  somarVoz(o, sr, { t0: 0.68, dur: 0.62, f0: 146.8, onda: 'sine', ganho: 0.3, ataque: 0.05, tau: 0.34 });
  eco(o, sr, 0.16, 0.2, 1);
  return fechar(o, sr);
}

const RENDERIZADORES: Record<NomeSfxCombate, (sr: number) => Float32Array> = {
  playAttack: renderAtaque,
  playDefend: renderDefesa,
  playAttackRanged: renderMagia,
  playCharge: renderCarga,
  playSpecial: renderEspecial,
  playVictory: renderVitoria,
  playDefeat: renderDerrota,
};

/** O sinal NOMINAL (pico `PICO_NOMINAL`, sem offset) de um efeito, a `sr` Hz. Determinístico. */
export function renderizarSfx(nome: NomeSfxCombate, sr: number): Float32Array {
  return RENDERIZADORES[nome](sr);
}

const cache = new Map<string, Float32Array>();

/**
 * O sinal pronto para tocar: o nominal com o `offsetDb` de `loudness.ts` embutido (ganho = 10^(dB/20)), de modo que o
 * buffer entra no grafo já no alvo da categoria e toca a ganho 1 (footgun 9: o nível nunca é escrito à mão aqui).
 * Cacheado por (efeito, sr, offset).
 */
export function sfxNoAlvo(nome: NomeSfxCombate, sr: number, offsetDb: number): Float32Array {
  const chave = `${nome}@${sr}@${offsetDb}`;
  const pronto = cache.get(chave);
  if (pronto) return pronto;
  const g = Math.pow(10, offsetDb / 20);
  const sinal = renderizarSfx(nome, sr).map(x => x * g);
  cache.set(chave, sinal);
  return sinal;
}
