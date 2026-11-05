/**
 * O REGISTRO do elemento por estágio (`GameState.elementoJornada`, REGISTRO §232). Módulo LEVE: `petElementOf` lê daqui no caminho crítico da Home;
 * quem ESCREVE é `elementoCombinado.ts`. Save sem o campo = nada muda até a próxima evolução. Espelho: `functions/api/_elementoJornada.js`.
 */
import { getStageLevel } from '../types/progression';
import { elementoConhecidoLeve } from './soulProfile/ficha/elementoIds';
import type { FichaStage } from './soulProfile/ficha/types';

export interface ElementoDoEstagio {
  /** Elemento do Soulmon no estágio: base, par ou curado. */
  id: string;
  /** A base nº 1: é ela que decide a vantagem elemental. */
  base: string;
}
export interface ElementoJornada {
  v: 1;
  /** A sorte do Soulmon, em [0,1). Fixa. */
  u: number;
  estagios: Partial<Record<FichaStage, ElementoDoEstagio>>;
}

const ESTAGIOS: readonly FichaStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];

/** Higieniza o que vem do disco/nuvem. Fora da forma = ausente. */
export function sanitizeElementoJornada(raw: unknown): ElementoJornada | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { u?: unknown; estagios?: unknown };
  if (typeof r.u !== 'number' || !Number.isFinite(r.u) || r.u < 0 || r.u >= 1) return undefined;
  if (!r.estagios || typeof r.estagios !== 'object' || Array.isArray(r.estagios)) return undefined;
  const estagios: ElementoJornada['estagios'] = {};
  for (const st of ESTAGIOS) {
    const e = (r.estagios as Record<string, { id?: unknown; base?: unknown } | undefined>)[st];
    if (e && elementoConhecidoLeve(e.id) && elementoConhecidoLeve(e.base)) estagios[st] = { id: e.id, base: e.base };
  }
  return { v: 1, u: r.u, estagios };
}

/** O registro do estágio atual, se a regra já vale para ele. */
export function elementoDoEstagioAtual(jornada: ElementoJornada | null | undefined, evolutionStage: string | undefined): ElementoDoEstagio | undefined {
  if (!jornada?.estagios || !evolutionStage) return undefined;
  const e = jornada.estagios[getStageLevel(evolutionStage) as FichaStage];
  return e && elementoConhecidoLeve(e.id) && elementoConhecidoLeve(e.base) ? e : undefined;
}
