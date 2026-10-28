/**
 * OS TRÊS SONS DA REVELAÇÃO DE RECOMPENSA (dono, 28/10/2026) — a ESPECIFICAÇÃO, em dados.
 *
 * Mora fora de `sounds.ts` por um motivo só: o teste de loudness (`sonsRecompensa.loudness.test.ts`) renderiza EXATAMENTE
 * estes parciais em Node e mede o LUFS-M com o medidor K-weighting do repo — a calibração (`OFFSET_POR_SOM_DB`) sai de
 * medição, não de ouvido. `sounds.ts` toca a mesma lista no `AudioContext`. Uma fonte, dois consumidores.
 *
 * Todos `arcade` (R-CAT: o EVENTO é o fim de uma partida/minijogo e o tique repete bastante — é o degrau de baixo da escada).
 * Só osciladores `sine`/`triangle` (o replicador do teste não finge ruído). Envelope de todos os parciais: sobe linear em
 * `ATAQUE_S` até o ganho e cai EXPONENCIAL até `PISO` no fim (percussivo: nenhum corte seco, nenhum clique).
 */
export interface Parcial {
  type: 'sine' | 'triangle';
  /** Frequência inicial e final (Hz); se diferentes, varre exponencialmente ao longo da duração. */
  f0: number;
  f1: number;
  /** Início relativo ao começo do som (s). */
  t: number;
  /** Duração (s). */
  dur: number;
  /** Ganho NOMINAL (antes do offset de calibração). */
  gain: number;
}

export const ATAQUE_S = 0.005;
export const PISO = 0.0001;

/** Ganho nominal comum a todos os parciais; o offset de `loudness.ts` o leva ao alvo da categoria. */
export const GANHO_NOMINAL_RECOMPENSA = 0.12;

/** Frequência-base do "pop" e a razão do semitom. */
const POP_BASE_HZ = 620;
export const semitom = (n: number): number => Math.pow(2, n / 12);

/** O "pop" de bolha: um seno que sobe rápido de ~70% a 100% da nota; cada ícone sucessivo sobe `pitch` semitons. */
export function parciaisPop(pitch = 0): Parcial[] {
  const f = POP_BASE_HZ * semitom(pitch);
  return [
    { type: 'sine', f0: f * 0.7, f1: f, t: 0, dur: 0.11, gain: GANHO_NOMINAL_RECOMPENSA },
    // um harmônico fraquinho dá o "bloop" de bolha sem deixar o som agudo/agressivo
    { type: 'sine', f0: f * 1.4, f1: f * 2, t: 0, dur: 0.06, gain: GANHO_NOMINAL_RECOMPENSA * 0.35 },
  ];
}

/** Uma rajada de tiques de caça-níquel: quatro "tic" de triângulo curtinhos, 30 ms entre si (~120 ms). */
export function parciaisTique(): Parcial[] {
  return [0, 0.03, 0.06, 0.09].map((t, i) => ({
    type: 'triangle' as const, f0: 2100 + i * 90, f1: 1500 + i * 60, t, dur: 0.024, gain: GANHO_NOMINAL_RECOMPENSA,
  }));
}

/** O "ding" de pouso: sino de duas parciais (sol 6 + oitava abaixo em seno), queda de ~420 ms. */
export function parciaisDing(): Parcial[] {
  return [
    { type: 'sine', f0: 1568, f1: 1568, t: 0, dur: 0.42, gain: GANHO_NOMINAL_RECOMPENSA },
    { type: 'sine', f0: 3136, f1: 3136, t: 0, dur: 0.22, gain: GANHO_NOMINAL_RECOMPENSA * 0.3 },
    { type: 'sine', f0: 784, f1: 784, t: 0, dur: 0.3, gain: GANHO_NOMINAL_RECOMPENSA * 0.4 },
  ];
}

/** Duração total (s) de uma lista de parciais. */
export const duracaoDe = (ps: readonly Parcial[]): number => ps.reduce((m, p) => Math.max(m, p.t + p.dur), 0);
