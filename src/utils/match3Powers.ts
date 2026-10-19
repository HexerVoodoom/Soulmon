/**
 * COMBINA 3 — os PODERES por elemento (D-100, 19/10/2026): quando um combo fecha, do PONTO onde ele fechou sai um "poderzinho" do elemento
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
export function powerShots(step: Step, events: readonly M3Event[], closers: readonly Pos[] = []): PowerShot[] {
  const out: PowerShot[] = [];
  for (const e of events) {
    const from = comboOrigin(step, M3_TILE_ELEMENTS.indexOf(e.element), closers);
    if (from) out.push({ by: e.by, element: e.element, dmg: e.dmg, target: e.target, from });
  }
  return out;
}
