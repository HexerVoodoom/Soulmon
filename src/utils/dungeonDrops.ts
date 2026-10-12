// 🎁 A fila do modalzinho de DROP da Masmorra (pedido do dono, 11/10/2026 — REGISTRO §36). Lógica PURA: a tela só desenha.
//
//  · Cada item que cai (coraçãozinho, o item do marco, fragmentos do Soulsmith) entra na fila com a quantidade.
//  · O mesmo item que cai de novo SOMA na entrada que já espera (não vira outro modal).
//  · Em 3× (avanço rápido) TUDO que está na fila vira UM modal só: a luta não pode virar uma fila de avisos.
//  · Bits não são "item": seguem no painel de resultado (`+N Bits`), não aqui.

import { GLITCHTAMA_EMOJI, SPECIAL_ITEMS } from './shop';

export type DropKind = 'heart' | 'glitchtama' | 'fragments';

export interface DropLine { kind: DropKind; qty: number }
/** Um modal: uma ou mais linhas (várias só quando coalescido). `id` muda a cada entrada nova (chave de React / reinício do relógio de fechar). */
export interface DropGroup { id: number; lines: DropLine[] }

/** Acrescenta `qty` de `kind` à fila. Puro: devolve uma fila nova. `speed` ≥ 3 funde tudo num único grupo. */
export function pushDrop(queue: readonly DropGroup[], kind: DropKind, qty: number, speed: number, nextId: number): DropGroup[] {
  const n = Math.floor(qty);
  if (!(n > 0)) return queue.slice();
  const add = (lines: readonly DropLine[]): DropLine[] => {
    const i = lines.findIndex(l => l.kind === kind);
    return i < 0 ? [...lines, { kind, qty: n }] : lines.map((l, j) => (j === i ? { ...l, qty: l.qty + n } : l));
  };
  if (speed >= 3) {
    // um modal só: o grupo existente (se houver) absorve; o id muda para o aviso reaparecer atualizado
    const head = queue[0];
    return [{ id: nextId, lines: add(head ? head.lines : []) }];
  }
  const at = queue.findIndex(g => g.lines.length === 1 && g.lines[0].kind === kind);
  if (at >= 0) return queue.map((g, j) => (j === at ? { ...g, lines: add(g.lines) } : g));
  return [...queue, { id: nextId, lines: [{ kind, qty: n }] }];
}

/** Fecha o modal da frente. */
export function popDrop(queue: readonly DropGroup[]): DropGroup[] {
  return queue.slice(1);
}

/** Nome do item, PT/EN (voz do app: fato, sem cobrança). */
export function dropName(kind: DropKind, isPt: boolean): string {
  switch (kind) {
    case 'heart': return isPt ? 'Coraçãozinho' : 'Little heart';
    case 'glitchtama': return isPt ? SPECIAL_ITEMS[GLITCHTAMA_EMOJI].namePt : SPECIAL_ITEMS[GLITCHTAMA_EMOJI].nameEn;
    case 'fragments': return isPt ? 'Fragmentos do Soulsmith' : 'Soulsmith fragments';
  }
}

/** Frase do modal para as linhas de um grupo. */
export function dropTitle(lines: readonly DropLine[], isPt: boolean): string {
  return lines.length === 1 ? (isPt ? 'Você achou' : 'You found') : (isPt ? 'Você achou várias coisas' : 'You found a few things');
}
