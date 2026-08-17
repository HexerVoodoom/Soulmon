// ---------------------------------------------------------------------------
// Captura do companheiro inicial — a MECÂNICA REAL do class-system.
//
// Fórmula copiada de `class-system/src/engine/evocacao.ts` (`poderCaptura`/
// `avaliarCaptura`), sem o bônus do talento instinto_de_caca (gated por
// escola). É mecânica de verdade: a ficha só "pega" uma criatura se tiver
// afinidade elemental E Evocação suficientes — não é flavor sorteado.
//
// Regra copiada = teste de paridade obrigatório (footgun 9): o laboratório
// (`teste-personalidade/src/lib/classSystem/capture.ts`) carrega a mesma
// cópia, e as constantes abaixo têm que bater com as de lá e as do engine.
// ---------------------------------------------------------------------------

import { hashString, mulberry32, pick } from '../../oracle';
import type { CriaturaSnapshot, Ficha } from './types';
import { CLASS_DATA } from './buildSheet';

const CAPTURA_BASE = 8;
const CAPTURA_POR_NIVEL_ELEMENTO = 4;
const CAPTURA_POR_EVOCACAO = 3;

export function poderCaptura(ficha: Ficha, criatura: CriaturaSnapshot): number {
  const nivelAfinidade = Math.max(0, ...criatura.afinidades.map(e => ficha.elementos[e] ?? 0));
  if (nivelAfinidade <= 0) return 0;
  const evocacao = ficha.escolas.evocacao ?? 0;
  return CAPTURA_BASE + CAPTURA_POR_NIVEL_ELEMENTO * nivelAfinidade + CAPTURA_POR_EVOCACAO * evocacao;
}

export interface CapturaAvaliacao {
  id: string;
  criatura: CriaturaSnapshot;
  capturavel: boolean;
  poder: number;
}

export function avaliarCaptura(ficha: Ficha, id: string, criatura: CriaturaSnapshot): CapturaAvaliacao {
  if ((ficha.escolas.evocacao ?? 0) <= 0) return { id, criatura, capturavel: false, poder: 0 };
  const temAfinidade = criatura.afinidades.some(e => (ficha.elementos[e] ?? 0) > 0);
  if (!temAfinidade) return { id, criatura, capturavel: false, poder: 0 };
  const poder = poderCaptura(ficha, criatura);
  return { id, criatura, capturavel: poder >= criatura.poderBase, poder };
}

export function capturableCreatures(ficha: Ficha): CapturaAvaliacao[] {
  return Object.entries(CLASS_DATA.criaturas)
    .map(([id, cr]) => avaliarCaptura(ficha, id, cr))
    .filter(a => a.capturavel)
    .sort((a, b) => b.criatura.poderBase - a.criatura.poderBase);
}

/**
 * Companheiro inicial: sorteio semeado sobre TODO o conjunto capturável, não
 * sempre a captura mais forte — devolver sempre a mais forte fazia só 9 das
 * criaturas do registro aparecerem como companheiro de alguém (medido no
 * laboratório). Determinístico por `seedKey`.
 */
export function selectCompanion(ficha: Ficha, seedKey: string): CapturaAvaliacao | null {
  const catches = capturableCreatures(ficha);
  if (catches.length === 0) return null;
  const rng = mulberry32(hashString(`${seedKey}|companion`));
  return pick(rng, catches);
}
