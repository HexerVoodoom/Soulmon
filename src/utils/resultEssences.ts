/**
 * Essências na tela de resultado (pedido do dono, 04/11/2026): tudo o que a atividade rendeu aparece no livro "Ganhou", ao lado do XP.
 * Puro: junta os drops da partida por id (somando) e os entrega ao `ResultScreen` como linhas `kind: 'essence'`.
 */
import { essenceName, type EssenceDrop } from './essences';
import { elementIcon } from './elementIconArt';
import { nightmareIcon, NIGHTMARE_ELEMENT } from './nightmareElement';

/** Soma por id (ordem da primeira aparição); qty < 1 e id vazio saem. */
export function tallyEssences(drops: readonly (EssenceDrop | undefined | null)[]): EssenceDrop[] {
  const by = new Map<string, number>();
  for (const d of drops) {
    if (!d || !d.id || !(d.qty >= 1)) continue;
    by.set(d.id, (by.get(d.id) ?? 0) + Math.floor(d.qty));
  }
  return [...by].map(([id, qty]) => ({ id, qty }));
}

/** Ícone da essência: o do elemento (o pesadelo tem o seu). */
export const essenceIconSrc = (id: string): string | undefined => (id === NIGHTMARE_ELEMENT ? nightmareIcon() : elementIcon(id));

export { essenceName };

/** Linhas do livro "Ganhou" para um punhado de drops. */
export function essenceLedgerRows(drops: readonly (EssenceDrop | undefined | null)[]): Array<{ key: string; kind: 'essence'; id: string; qty: number }> {
  return tallyEssences(drops).map(d => ({ key: `essence-${d.id}`, kind: 'essence' as const, id: d.id, qty: d.qty }));
}
