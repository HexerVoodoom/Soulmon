/**
 * PRIORIDADES — o modelo ICE adaptado (12/11/2026, pedido do dono; substitui a matriz de Eisenhower).
 * Puro: sem React, sem storage, sem relógio.
 *
 * Cada tarefa recebe quatro notas de 1 a 5:
 *   tempo      1 = rápido ............ 5 = demorado
 *   esforco    1 = fácil ............. 5 = pesado
 *   recompensa 1 = pouca ............. 5 = muita
 *   urgencia   1 = sem pressa ........ 5 = vence logo
 *
 * PONTUAÇÃO = (recompensa × urgência) ÷ (esforço × tempo)
 * O que rende e vence logo e custa pouco sobe. Faixa: de 1/25 = 0,04 (pior) a 25 (melhor).
 * A pontuação NÃO é gravada: é recalculada das quatro notas, então mudar a fórmula um dia não deixa dado velho no save.
 *
 * Ordenação (`sortByIce`), estável e determinística:
 *   1. classificadas antes das não classificadas (as não classificadas ficam no FIM, na ordem de criação);
 *   2. maior pontuação primeiro;
 *   3. empate: maior urgência → maior recompensa → menor esforço → ordem de criação (posição na lista de entrada).
 */
export interface Ice { tempo: number; esforco: number; recompensa: number; urgencia: number }
export const ICE_FIELDS = ['tempo', 'esforco', 'recompensa', 'urgencia'] as const;
export type IceField = typeof ICE_FIELDS[number];
export const ICE_MIN = 1;
export const ICE_MAX = 5;

const nota = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= ICE_MIN && v <= ICE_MAX ? v : null);

/** Lixo, campo faltando ou nota fora de 1..5 → `undefined` (tarefa "não classificada"). Nunca lança. */
export function sanitizeIce(raw: unknown): Ice | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const tempo = nota(r.tempo), esforco = nota(r.esforco), recompensa = nota(r.recompensa), urgencia = nota(r.urgencia);
  return tempo && esforco && recompensa && urgencia ? { tempo, esforco, recompensa, urgencia } : undefined;
}

/** (recompensa × urgência) ÷ (esforço × tempo), decimal. Notas inválidas são presas em 1..5 (a função nunca devolve NaN/Infinity). */
export function iceScore(i: Ice): number {
  const c = (v: number) => Math.min(ICE_MAX, Math.max(ICE_MIN, Math.round(v) || ICE_MIN));
  return (c(i.recompensa) * c(i.urgencia)) / (c(i.esforco) * c(i.tempo));
}

/** Para exibir: uma casa decimal, vírgula em PT (`12,5`), ponto em EN (`12.5`); inteiro sem casa (`4`). */
export function formatIceScore(score: number, isPt: boolean): string {
  const s = Number.isInteger(score) ? String(score) : score.toFixed(score < 1 ? 2 : 1);
  return isPt ? s.replace('.', ',') : s;
}

/** Ordena preservando a ordem de entrada como "ordem de criação". Não muda o array recebido. */
export function sortByIce<T extends { ice?: Ice }>(items: readonly T[]): T[] {
  return items
    .map((t, i) => ({ t, i, ice: sanitizeIce(t.ice) }))
    .sort((a, b) => {
      if (!a.ice || !b.ice) return a.ice ? -1 : b.ice ? 1 : a.i - b.i;
      return iceScore(b.ice) - iceScore(a.ice)
        || b.ice.urgencia - a.ice.urgencia
        || b.ice.recompensa - a.ice.recompensa
        || a.ice.esforco - b.ice.esforco
        || a.i - b.i;
    })
    .map(x => x.t);
}
