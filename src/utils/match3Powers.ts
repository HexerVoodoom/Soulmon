/**
 * ELEMENTAL FUSION — os PODERES por elemento (D-100, 19/10/2026): quando um combo fecha, do PONTO onde ele fechou sai um "poderzinho" do elemento
 * que viaja até o alvo e mostra o dano. Aqui só a conta PURA de "de onde sai, qual elemento, quanto": o dano NÃO é recalculado — vem dos
 * eventos que `match3Combat` já gravou (`M3Event.dmg`), então o número mostrado é exatamente o aplicado. Sem sorte, sem arte, sem tela.
 */
import { M3_TILE_ELEMENTS, type Pos, type Step } from './match3';
import type { M3Event, M3Target } from './match3Combat';

export interface PowerShot {
  by: 'player' | 'enemy';
  element: M3Event['element'];
  /** O dano que de fato tirou HP (o do evento; a sobra descartada não entra). */
  dmg: number;
  target: M3Target;
  /** A célula do tabuleiro de onde o poder sai. */
  from: Pos;
  /** D-102: o combo deixou uma especial desse elemento (linha de 4+ = rodada extra) → versão mais enfeitada. */
  big: boolean;
}

const sameCell = (a: Pos, b: Pos) => a.r === b.r && a.c === b.c;

/**
 * Onde o combo daquele tipo (`kind`) fechou neste passo: a célula da TROCA (`closers`) que entrou na combinação; sem ela (cascata), a célula
 * do meio (mediana em linha-coluna) das peças limpas daquele tipo. `null` se o passo não limpou peça desse tipo.
 */
export function comboOrigin(step: Step, kind: number, closers: readonly Pos[] = []): Pos | null {
  const cells = step.cleared.filter((_, i) => step.kinds[i] === kind);
  if (cells.length === 0) return null;
  const hit = closers.find(c => cells.some(p => sameCell(p, c)));
  if (hit) return { r: hit.r, c: hit.c };
  const sorted = [...cells].sort((a, b) => a.r - b.r || a.c - b.c);
  const mid = sorted[Math.floor((sorted.length - 1) / 2)];
  return { r: mid.r, c: mid.c };
}

/** Um poder por EVENTO de dano do passo (`events` = as entradas novas do log, na ordem), cada um com a origem do seu elemento. */
export function powerShots(step: Step, events: readonly M3Event[], closers: readonly Pos[] = [], elements: readonly string[] = M3_TILE_ELEMENTS): PowerShot[] {
  const out: PowerShot[] = [];
  for (const e of events) {
    const from = comboOrigin(step, elements.indexOf(e.element), closers);
    if (from) {
      const kind = elements.indexOf(e.element);
      out.push({ by: e.by, element: e.element, dmg: e.dmg, target: e.target, from, big: step.created.some(c => c.tile.k === kind) });
    }
  }
  return out;
}

// ── o ritmo do efeito (D-102, 20/10/2026): aura no atacante → poder maior que viaja → burst no alvo ──────────────────────────────

/**
 * Tempos e tamanhos (ms / px). ANTES (D-100): ícone de 24 px, viagem de 300 ms, número de 800 ms, sem aura nem burst.
 * AGORA: aura 450 ms no atacante, poder de 70 px (105 px se 4+; D-103: +25%) que viaja 950 ms em arco, burst de 420 ms e número de 800 ms no impacto.
 */
export const FX_AURA_MS = 450;
export const FX_TRAVEL_MS = 950;
export const FX_BURST_MS = 420;
export const FX_NUM_MS = 800;
/** D-103 (20/10/2026): ~25% maior que os 56/84 px de D-102 (o dono pediu UM foguinho, um pouco maior). */
export const FX_ORB_PX = 70;
export const FX_ORB_PX_BIG = 105;
/** No máximo 2 poderes (aura + poder em voo) ao mesmo tempo; os demais esperam uma pista livre ou saem na versão rápida. */
export const FX_LANES = 2;
/** Teto de duração dos efeitos de um lado da jogada (jogador OU inimigo): nada passa disso. */
export const FX_CAP_MS = 2500;
/** A versão rápida (cascata longa): só o burst e o número, sem aura nem viagem. */
export const FX_QUICK_MS = FX_NUM_MS;
/** Uma figura completa, do início da aura ao fim do número. */
export const FX_FULL_MS = FX_AURA_MS + FX_TRAVEL_MS + FX_NUM_MS;
/** Atraso entre dois poderes do mesmo passo. */
export const FX_STAGGER_MS = 90;

export interface FxSlot {
  /** `full` = aura + viagem + burst + número; `quick` = só burst + número (cascata longa). */
  mode: 'full' | 'quick';
  /** Quando começa, em ms absolutos (a mesma régua de `now`). */
  start: number;
  /** Quando acaba, na mesma régua. */
  end: number;
}

/**
 * Agenda `count` poderes. `lanes` = quando cada pista (2) fica livre; `windowStart` = o início da janela de 2,5 s do lado da jogada.
 * Pura: o mesmo pedido dá o mesmo plano; não toca relógio nenhum. A lógica do jogo NÃO espera por isto — é só decoração.
 */
export function planFx(count: number, lanes: readonly number[], now: number, windowStart: number): { slots: FxSlot[]; lanes: number[] } {
  const next = lanes.slice(0, FX_LANES);
  while (next.length < FX_LANES) next.push(now);
  const slots: FxSlot[] = [];
  for (let i = 0; i < count; i++) {
    const lane = next[0] <= next[1] ? 0 : 1;
    const start = Math.max(now + i * FX_STAGGER_MS, next[lane]);
    if (start + FX_FULL_MS <= windowStart + FX_CAP_MS) {
      slots.push({ mode: 'full', start, end: start + FX_FULL_MS });
      next[lane] = start + FX_AURA_MS + FX_TRAVEL_MS; // a pista fica livre quando o poder chega
    } else {
      const qs = Math.max(now, Math.min(start, windowStart + FX_CAP_MS - FX_QUICK_MS));
      slots.push({ mode: 'quick', start: qs, end: qs + FX_QUICK_MS });
    }
  }
  return { slots, lanes: next };
}
