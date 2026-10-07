// O nome PT/EN de um elemento (base ou par derivado) — dono único (PR9b: saiu de `skills.ts` para o nome do especial
// do oponente no PvP resolver SEM puxar a ficha inteira). `skills.ts` re-exporta `elementoNomeDe`.
import { CLASS_ELEMENT_ORDER } from '../types';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import { essenceLabel, baseElementLabel } from '../essenceLabels';

export interface TextoPar { pt: string; en: string }

const PAR_NOME = new Map(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d]));
const BASES = new Set<string>(CLASS_ELEMENT_ORDER);

/** O id está na lista fechada de elementos (17 base + pares derivados)? */
export function elementoConhecido(id: unknown): id is string {
  return typeof id === 'string' && (BASES.has(id) || PAR_NOME.has(id));
}

export function elementoNomeDe(id: string): TextoPar {
  const par = PAR_NOME.get(id);
  if (par) {
    const candidate = { id: par.id, nome: par.nome, score: 0, componentes: par.componentes };
    return { pt: essenceLabel(candidate, true), en: essenceLabel(candidate, false) };
  }
  return { pt: baseElementLabel(id, true), en: baseElementLabel(id, false) };
}

/**
 * A BASE DOMINANTE de um elemento (PR17, §2.35) — a base que decide a VANTAGEM elemental (a tabela `COUNTERS` só
 * conhece as 17 bases). Base -> ela mesma. Par -> o componente de MAIOR peso na ficha (`pesos[id]`, pontos); no
 * empate (ou sem pesos) vale o PRIMEIRO componente da receita (ordem fixa de `DERIVED_ELEMENT_PAIRS`). Id
 * desconhecido -> ele mesmo. Dono unico: ninguem mais escolhe base de par.
 */
export function baseDominanteDoElemento(id: string, pesos?: Readonly<Record<string, number | undefined>>): string {
  const par = PAR_NOME.get(id);
  if (!par) return id;
  const [a, b] = par.componentes;
  return (pesos?.[b] ?? 0) > (pesos?.[a] ?? 0) ? b : a;
}
