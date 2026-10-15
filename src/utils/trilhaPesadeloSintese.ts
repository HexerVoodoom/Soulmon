/**
 * SÍNTESE da trilha de terror do Pesadelo (15/10/2026) — PURA: sem imports, sem DOM, sem relógio. Existe separada de
 * `trilhaPesadelo.ts` (a reprodução) para o Node renderizar o WAV do dono (`scripts/render-trilha-pesadelo.mjs`) sem Vite.
 * O desenho, a lista do que a compõe e o porquê do loop sem emenda estão no cabeçalho de `trilhaPesadelo.ts`.
 */

/** Duração do loop, em segundos (45 bpm × 24 s = 18 batidas inteiras). */
export const DURACAO_PESADELO_S = 24;
/** Taxa de síntese (o motor reamostra na reprodução): 12 kHz basta para drones, pad e sussurros (≤ 6 kHz) e mantém a conta barata. */
export const TAXA_PESADELO = 12000;
/** Semente padrão da trilha do jogo. Outra semente = outra noite (sussurros, stingers e fases mudam). */
export const SEMENTE_PESADELO = 0x0badd0;
/** Pico do buffer: o mesmo das camadas da trilha (−14,1 dBFS), para o ganho de reprodução valer igual. */
export const PICO_PESADELO = Math.pow(10, -14.1 / 20);

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

const TAU = Math.PI * 2;
/** Semitons acima de Ré1 (36,71 Hz). */
const D1 = 36.708;
const st = (n: number): number => D1 * Math.pow(2, n / 12);

export interface OpcoesDaTrilhaPesadelo {
  sampleRate?: number;
  duracaoS?: number;
  seed?: number;
}

/**
 * Gera UM loop da trilha de terror. Puro: mesma semente + mesmos parâmetros = mesmos números. O pico do resultado é
 * `PICO_PESADELO`. A última amostra continua na primeira (loop sem emenda).
 */
export function sintetizarTrilhaPesadelo(opcoes: OpcoesDaTrilhaPesadelo = {}): Float32Array<ArrayBuffer> {
  const sr = opcoes.sampleRate ?? TAXA_PESADELO;
  const T = opcoes.duracaoS ?? DURACAO_PESADELO_S;
  const rnd = mulberry32(opcoes.seed ?? SEMENTE_PESADELO);
  const n = Math.round(sr * T);
  const out = new Float32Array(new ArrayBuffer(n * 4));
  const wrap = (i: number): number => ((i % n) + n) % n;
  /** Ciclos INTEIROS por loop para a frequência `f` (múltiplo de 1/T): o oscilador fecha o loop sem emenda. */
  const cyc = (f: number): number => Math.max(1, Math.round(f * T));
  /** Tabela de seno de UM ciclo por loop: `sin(2π·k·i/n)` vira índice inteiro (`tab[(k·i + fase) % n]`) — exato e barato. */
  const tab = new Float32Array(n);
  for (let j = 0; j < n; j++) tab[j] = Math.sin((TAU * j) / n);
  const md = (x: number): number => ((x % n) + n) % n;

  // 1) DRONES — raiz, tritono, cluster de segundas; cada nota em par desafinado (batimento lento).
  const drones: Array<{ f: number; amp: number; lfo: number; ph: number }> = [
    { f: st(0), amp: 0.5, lfo: 1, ph: rnd() },
    { f: st(0) * 2, amp: 0.3, lfo: 2, ph: rnd() },
    { f: st(6), amp: 0.22, lfo: 1, ph: rnd() },       // tritono
    { f: st(13), amp: 0.14, lfo: 2, ph: rnd() },      // segunda menor sobre a oitava
    { f: st(14), amp: 0.12, lfo: 3, ph: rnd() },      // cluster
    { f: st(18), amp: 0.1, lfo: 1, ph: rnd() },       // tritono da oitava
  ];
  for (const d of drones) {
    const fase = Math.floor(d.ph * n);
    for (const det of [0, 0.13, -0.19]) { // o desafinado vira batimento (0,1–0,3 Hz), não afinação
      const k = cyc(d.f + det);
      // índices que avançam por soma inteira (sem módulo por amostra): o laço mais quente da trilha
      const k1 = md(k), k2 = md(2 * k), k3 = md(3 * k), kl = md(d.lfo);
      let a = md(fase), b = md(fase + 7), c = md(fase + 13), l = md(fase);
      const g = d.amp / 3;
      for (let i = 0; i < n; i++) {
        // dente de serra suavizado: três harmônicos com queda rápida (grave grosso, sem chiado)
        out[i] += g * (tab[a] + 0.4 * tab[b] + 0.16 * tab[c]) * (0.65 + 0.35 * tab[l]);
        a += k1; if (a >= n) a -= n;
        b += k2; if (b >= n) b -= n;
        c += k3; if (c >= n) c -= n;
        l += kl; if (l >= n) l -= n;
      }
    }
  }

  // 2) PAD — acorde cluster em três vozes desafinadas por nota, "coro que azeda".
  const pad = [st(24), st(25), st(30), st(35)];
  pad.forEach((base, kk) => {
    for (const det of [-0.31, 0, 0.27]) {
      const k = cyc(base + det * (1 + kk * 0.4));
      const fase = Math.floor(rnd() * n);
      const k1 = md(k), k2 = md(2 * k), kl = md(1 + kk);
      let a = fase, b = fase, l = fase;
      for (let i = 0; i < n; i++) {
        out[i] += 0.035 * (0.8 + 0.5 * tab[l]) * (tab[a] + 0.25 * tab[b]);
        a += k1; if (a >= n) a -= n;
        b += k2; if (b >= n) b -= n;
        l += kl; if (l >= n) l -= n;
      }
    }
  });

  // 3) INFRASSOM (18 Hz) + BATIDA DE CORAÇÃO (lub-dub, 45 bpm = 18 batidas em 24 s).
  const kInfra = cyc(18);
  { const ki = md(kInfra); let a = 0; for (let i = 0; i < n; i++) { out[i] += 0.16 * tab[a]; a += ki; if (a >= n) a -= n; } }
  const beats = Math.round((T * 45) / 60);
  const thump = (t0: number, amp: number): void => {
    const len = Math.round(sr * 0.5);
    const i0 = Math.round(t0 * sr);
    for (let j = 0; j < len; j++) {
      const t = j / sr;
      const f = 38 + 34 * Math.exp(-t * 28); // queda de afinação: soco no peito
      const env = Math.exp(-t * 9) * Math.min(1, t * 400);
      out[wrap(i0 + j)] += amp * env * Math.sin(TAU * f * t + 0.2);
    }
  };
  for (let b = 0; b < beats; b++) {
    const tb = (b * T) / beats;
    thump(tb, 0.62);
    thump(tb + 0.3, 0.4);
  }

  // 4) SUSSURROS — ruído passa-banda ressonante (SVF) em rajadas silábicas, em tempos sorteados pela semente.
  const sussurros = Math.max(2, Math.round(T / 4));
  for (let s = 0; s < sussurros; s++) {
    const t0 = rnd() * T;
    const dur = 1.1 + rnd() * 1.4;
    const f0 = 1500 + rnd() * 1700;
    const f1 = f0 * (0.6 + rnd() * 0.8);
    const sil = 4.5 + rnd() * 3;
    const amp = 0.05 + rnd() * 0.05;
    const len = Math.round(sr * dur);
    const i0 = Math.round(t0 * sr);
    let lo = 0;
    let bp = 0;
    for (let j = 0; j < len; j++) {
      const u = j / len;
      const fc = f0 + (f1 - f0) * u;
      const g = 2 * Math.sin((Math.PI * Math.min(fc, sr * 0.2)) / sr);
      const x = rnd() * 2 - 1;
      const hi = x - lo - 0.18 * bp; // ressonância alta (Q ~ 5): voz sem palavra
      bp += g * hi;
      lo += g * bp;
      const win = Math.sin(Math.PI * u) ** 2;
      const syl = 0.55 + 0.45 * Math.sin(TAU * sil * (j / sr));
      out[wrap(i0 + j)] += amp * win * syl * bp;
    }
  }

  // 5) STINGERS — sinos FM inarmônicos (tritono + segunda menor), ataque 20 ms, cauda de ~3 s, esparsos.
  const stingers = Math.max(1, Math.round(T / 11));
  for (let s = 0; s < stingers; s++) {
    const t0 = ((s + 0.25 + rnd() * 0.5) * T) / stingers;
    const base = st(30 + Math.floor(rnd() * 3) * 6 + (rnd() < 0.5 ? 0 : 1));
    const len = Math.round(sr * 3.2);
    const i0 = Math.round(t0 * sr);
    for (let j = 0; j < len; j++) {
      const t = j / sr;
      const env = Math.min(1, t / 0.02) * Math.exp(-t * 1.5);
      const mod = Math.sin(TAU * base * 1.4142 * t) * (2.6 * Math.exp(-t * 1.1));
      const v = Math.sin(TAU * base * t + mod) + 0.55 * Math.sin(TAU * base * 1.0595 * t + 0.4 * mod);
      out[wrap(i0 + j)] += 0.11 * env * v;
    }
  }

  // Remove DC, normaliza o pico e dá um soft-clip de segurança (sem estourar, sem emenda: ponto a ponto).
  let mean = 0;
  for (let i = 0; i < n; i++) mean += out[i];
  mean /= n;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    out[i] -= mean;
    peak = Math.max(peak, Math.abs(out[i]));
  }
  const k = peak > 0 ? PICO_PESADELO / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= k;
  return out;
}

/** Contas de pico/RMS, para o teste e para o relatório. */
export function medirTrilha(d: Float32Array): { pico: number; rms: number } {
  let pico = 0;
  let q = 0;
  for (let i = 0; i < d.length; i++) {
    pico = Math.max(pico, Math.abs(d[i]));
    q += d[i] * d[i];
  }
  return { pico, rms: Math.sqrt(q / Math.max(1, d.length)) };
}

/** WAV PCM 16 bits mono — para o dono ouvir a render fora do app (`scripts/render-trilha-pesadelo.*`). */
export function paraWav16(d: Float32Array, sampleRate: number): Uint8Array {
  const bytes = new Uint8Array(44 + d.length * 2);
  const v = new DataView(bytes.buffer);
  const txt = (o: number, s: string): void => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  txt(0, 'RIFF'); v.setUint32(4, 36 + d.length * 2, true); txt(8, 'WAVE'); txt(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  txt(36, 'data'); v.setUint32(40, d.length * 2, true);
  for (let i = 0; i < d.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
  return bytes;
}

