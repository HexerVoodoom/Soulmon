// ---------------------------------------------------------------------------
// PR15b — o REGISTRO da jornada da ficha (`GameState.fichaJornada`).
//
// O que o jogador fez no estágio que TERMINA (a janela `attributesSinceLastEvolution`) é gravado UMA vez, na
// evolução manual, sob o estágio que NASCE. Depois disso o registro é IMUTÁVEL: degenerar e reevoluir ao mesmo
// estágio reusa o que está gravado (anti-reroll — não dá para rolar o elemento de novo caindo de propósito).
// Save sem o campo = nada muda até a próxima evolução; a ficha atual nunca é reescrita.
//
// Módulo LEVE de propósito (sem ficha, sem dado do class-system): o `App.tsx` o importa estático. Quem DERIVA
// plano/família do registro é `soulProfile/ficha/fromInput.ts` (`buildFichaESkills`), carregado por import
// dinâmico. `plano` e `familia` gravados aqui são o espelho do que a derivação dá (o PR15c os valida no
// servidor recalculando a partir de `galhos`); quem decide é sempre `galhos`.
// ---------------------------------------------------------------------------

import type { FichaStage } from './soulProfile/ficha/types';

export interface GalhosGravados { power: number; harmony: number; benevolence: number }

export interface EstagioJornada {
  /** A janela do estágio ANTERIOR, capturada na evolução. Fonte única da derivação. */
  galhos: GalhosGravados;
  /** Dia do jogador da evolução (`playerDayKey`). */
  at: string;
  /** Espelho derivado (preenchido uma vez, depois de calculado). */
  plano?: Record<string, number>;
  familia?: string;
}

export interface FichaJornada {
  v: 1;
  estagios: Partial<Record<FichaStage, EstagioJornada>>;
}

/** Só estes estágios têm anterior (o rookie nasce sem comportamento). */
export const ESTAGIOS_COM_JANELA: readonly FichaStage[] = ['champion', 'ultimate', 'mega', 'ultra'];

function n(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/** Higieniza o que vem do disco/nuvem. Qualquer coisa fora da forma = ausente (nada muda no save). */
export function sanitizeFichaJornada(raw: unknown): FichaJornada | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const est = (raw as { estagios?: unknown }).estagios;
  if (!est || typeof est !== 'object' || Array.isArray(est)) return undefined;
  const estagios: FichaJornada['estagios'] = {};
  for (const stage of ESTAGIOS_COM_JANELA) {
    const e = (est as Record<string, unknown>)[stage];
    if (!e || typeof e !== 'object' || Array.isArray(e)) continue;
    const r = e as Record<string, unknown>;
    const g = (r.galhos && typeof r.galhos === 'object' ? r.galhos : {}) as Record<string, unknown>;
    const out: EstagioJornada = {
      galhos: { power: n(g.power), harmony: n(g.harmony), benevolence: n(g.benevolence) },
      at: typeof r.at === 'string' ? r.at.slice(0, 32) : '',
    };
    if (r.plano && typeof r.plano === 'object' && !Array.isArray(r.plano)) {
      const p: Record<string, number> = {};
      for (const [k, v] of Object.entries(r.plano as Record<string, unknown>)) if (n(v) > 0 && k.length <= 32) p[k] = n(v);
      out.plano = p;
    }
    if (typeof r.familia === 'string' && r.familia.length <= 32) out.familia = r.familia;
    estagios[stage] = out;
  }
  return Object.keys(estagios).length > 0 ? { v: 1, estagios } : undefined;
}

/**
 * Grava a janela sob o estágio que nasce. IDEMPOTENTE e imutável: se o estágio já está gravado devolve a MESMA
 * referência (degenerar e reevoluir não reescreve). Rookie não grava (não há estágio anterior).
 */
export function registrarEstagio(
  atual: FichaJornada | undefined,
  stage: FichaStage,
  janela: Partial<GalhosGravados> | null | undefined,
  dia: string,
): FichaJornada | undefined {
  if (!ESTAGIOS_COM_JANELA.includes(stage)) return atual;
  if (atual?.estagios?.[stage]) return atual;
  const galhos = { power: n(janela?.power), harmony: n(janela?.harmony), benevolence: n(janela?.benevolence) };
  return { v: 1, estagios: { ...(atual?.estagios ?? {}), [stage]: { galhos, at: dia } } };
}

/** Preenche o espelho derivado, uma vez; devolve a mesma referência se nada muda. */
export function completarEstagios(
  atual: FichaJornada | undefined,
  derivado: Partial<Record<FichaStage, { plano: Record<string, number> | null; familia: string }>>,
): FichaJornada | undefined {
  if (!atual) return atual;
  let mudou = false;
  const estagios: FichaJornada['estagios'] = { ...atual.estagios };
  for (const stage of ESTAGIOS_COM_JANELA) {
    const e = estagios[stage]; const d = derivado[stage];
    if (!e || !d || e.familia) continue;
    estagios[stage] = { ...e, familia: d.familia, ...(d.plano ? { plano: d.plano } : {}) };
    mudou = true;
  }
  return mudou ? { v: 1, estagios } : atual;
}
