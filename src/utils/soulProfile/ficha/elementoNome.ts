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
