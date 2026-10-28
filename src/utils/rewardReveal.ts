/**
 * REVELAÇÃO DE RECOMPENSA — o cronograma (função PURA, sem relógio, sem som, sem DOM).
 *
 * Pedido do dono (28/10/2026): cada linha de recompensa mostra o ícone ESTOURANDO na tela (nasce minúsculo, passa um
 * pouco do tamanho e assenta), uma depois da outra (~250 ms), e os Bits rolam de 0 ao valor como um odômetro de
 * caça-níquel, com um "ding" ao pousar. Quem monta o cronograma é esta função; `useRewardReveal` o executa e
 * `RewardPop`/`RollingCount` o desenham. Nenhuma regra de recompensa mora aqui: só QUANDO cada coisa aparece.
 *
 * ⚠️ O espaçamento entre QUALQUER par de eventos sonoros é >= `GAP_SONORO_MIN_MS`, que é MAIOR que a janela de
 * coincidência da R-EX (120 ms, `audioBus.ts`). Dois `play*` dentro dela são "o mesmo gesto" e o segundo seria
 * descartado — o teste desta função prova que o cronograma não depende disso.
 */

/** Intervalo entre ícones do livro (pedido do dono: ~250 ms). */
export const POP_STAGGER_MS = 250;
/** Intervalo entre as escadas da Fenda (o "plup, plup, plup" é mais rápido que o livro). */
export const STAIRS_STAGGER_MS = 200;
/** Duração do odômetro. */
export const ROLL_MS = 900;
/** Depois do ícone estourar, o contador espera isto para começar a rodar. */
export const ROLL_DELAY_MS = 160;
/** Passo do tique do caça-níquel (> janela da R-EX de 120 ms). */
export const ROLL_TICK_MS = 140;
/** Folga entre o último tique e o "ding" de pouso. */
export const LAND_GAP_MS = 160;
/** Folga sonora mínima entre dois eventos (a janela da R-EX é 120 ms). */
export const GAP_SONORO_MIN_MS = 130;
/** Quantas notas o "pop" sobe antes de parar (cada ícone novo sobe um semitom). */
export const PITCH_MAX_STEPS = 8;

export interface RevealStep {
  key: string;
  /** Linha com contador que ROLA (Bits). */
  roll?: boolean;
  /** Espera depois deste passo (padrão `POP_STAGGER_MS`). */
  after?: number;
  /** Passo mudo (não toca o "pop"): ex. um ícone que acompanha outro. */
  silent?: boolean;
}

export type RevealEvent =
  | { at: number; type: 'pop'; key: string; pitch: number; silent: boolean }
  | { at: number; type: 'roll'; key: string }
  | { at: number; type: 'tick'; key: string }
  | { at: number; type: 'land'; key: string };

export interface RevealTimeline {
  events: RevealEvent[];
  /** Quando cada passo estoura. */
  popAt: Record<string, number>;
  /** Fim de tudo (o último evento + o pouso). */
  totalMs: number;
}

/** Posição do semitom do N-ésimo "pop" (0-based), com teto: o som sobe e para. */
export const pitchStep = (n: number): number => Math.min(Math.max(0, n), PITCH_MAX_STEPS);

export function rewardTimeline(steps: readonly RevealStep[], startMs = 0): RevealTimeline {
  const events: RevealEvent[] = [];
  const popAt: Record<string, number> = {};
  let t = startMs;
  let n = 0;
  for (const s of steps) {
    popAt[s.key] = t;
    events.push({ at: t, type: 'pop', key: s.key, pitch: pitchStep(n), silent: !!s.silent });
    if (!s.silent) n++;
    if (s.roll) {
      const rollStart = t + ROLL_DELAY_MS;
      const land = rollStart + ROLL_MS;
      events.push({ at: rollStart, type: 'roll', key: s.key });
      for (let k = 0; rollStart + k * ROLL_TICK_MS <= land - LAND_GAP_MS; k++) events.push({ at: rollStart + k * ROLL_TICK_MS, type: 'tick', key: s.key });
      events.push({ at: land, type: 'land', key: s.key });
      t = land + (s.after ?? POP_STAGGER_MS);
    } else {
      t += s.after ?? POP_STAGGER_MS;
    }
  }
  const fim = events.length ? events[events.length - 1].at : startMs;
  return { events, popAt, totalMs: fim + 300 };
}

/** Dígitos do odômetro: o valor final, um por coluna. Valor negativo/NaN vira 0. */
export function odometerDigits(value: number): number[] {
  const v = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return String(v).split('').map(Number);
}

/**
 * Quantas voltas completas de 0-9 a coluna `idx` (de `total`) dá antes de parar: a coluna mais à direita (unidades)
 * gira mais, a mais à esquerda menos — o ritmo do odômetro/caça-níquel. Sempre >= 1.
 */
export function reelLoops(idx: number, total: number): number {
  return 1 + Math.max(0, total - 1 - idx);
}
