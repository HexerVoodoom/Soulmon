// ---------------------------------------------------------------------------
// Distribuição de pontos: os eixos do oráculo viram uma Ficha do class-system.
//
// Portado do laboratório (`teste-personalidade/src/lib/classSystem/
// buildSheet.ts`) com um upgrade central: os talentos deixam de ser só os 8
// sem pré-requisito. A alocação agora é CIENTE DE PRÉ-REQUISITO — um talento
// gated por `escola: evocacao, nivelMinimo: 8` fica elegível quando a ficha
// realmente tem evocação 8, o que acontece nos estágios altos. É isso que
// torna os 65 talentos do registro alcançáveis (verificado por simulação),
// em vez dos 8 de antes.
//
// O class-system não define orçamento inicial (é point-buy aberto); os
// orçamentos por estágio são CONVENÇÃO deste módulo, documentada, escalando
// rookie → ultra com curva acelerada — fundo o bastante nos estágios altos
// para alcançar o tier de pré-requisito `nivelMinimo: 10` do próprio
// registro de talentos.
// ---------------------------------------------------------------------------

import { hashString, mulberry32, pick } from '../../oracle';
import type { OracleAxes } from '../types';
import { CLASS_ELEMENT_ORDER } from '../types';
import type {
  ElementoBaseId, EscolaId, Ficha, FichaStage, ProfissaoId, RecursoId, TalentoSnapshot,
} from './types';
import snapshotJson from './classSystem.data.json';
import type { ClassSystemSnapshot } from './types';

export const CLASS_DATA = snapshotJson as unknown as ClassSystemSnapshot;

type RoleId = 'suporte' | 'tanque' | 'fisico' | 'magico' | 'alcance';

interface Budget {
  elementos: number;
  escolasDistribuidas: number;
  evocacaoFixo: number;
  recursos: number;
  talentoRanks: number;
  profissao: number;
}

export const ROOKIE_BUDGET: Budget = {
  elementos: 28,
  escolasDistribuidas: 14,
  evocacaoFixo: 4,
  recursos: 8,
  talentoRanks: 10,
  profissao: 6,
};

/** Curva acelerada de orçamento por estágio — o último salto é o maior,
 *  como as curvas de poder do gênero costumam ler. */
export const STAGE_MULTIPLIER: Record<FichaStage, number> = {
  rookie: 1, champion: 1.8, ultimate: 3, mega: 5, ultra: 8,
};

function budgetForStage(stage: FichaStage): Budget {
  const m = STAGE_MULTIPLIER[stage];
  return {
    elementos: Math.round(ROOKIE_BUDGET.elementos * m),
    escolasDistribuidas: Math.round(ROOKIE_BUDGET.escolasDistribuidas * m),
    evocacaoFixo: Math.round(ROOKIE_BUDGET.evocacaoFixo * m),
    recursos: Math.round(ROOKIE_BUDGET.recursos * m),
    talentoRanks: Math.round(ROOKIE_BUDGET.talentoRanks * m),
    profissao: Math.round(ROOKIE_BUDGET.profissao * m),
  };
}

const ROLE_TO_ESCOLA: Record<RoleId, EscolaId> = {
  fisico: 'combate_fisico',
  tanque: 'combate_fisico',
  alcance: 'longo_alcance',
  magico: 'conjuracao',
  // suporte racha entre benca/maldicao pelo alinhamento — ver abaixo. É o
  // que torna maldição alcançável (antes nunca recebia um ponto).
  suporte: 'benca',
};

/** tanque → soullink (paga com a própria vida para proteger — guardião), em
 *  vez de colidir com fisico em furia: os 5 recursos ficam alcançáveis. */
const ROLE_TO_RECURSO: Record<RoleId, RecursoId> = {
  fisico: 'furia', tanque: 'soullink', magico: 'mana', suporte: 'fe', alcance: 'ressonancia',
};

/** Dois talentos SEM pré-requisito por papel, temáticos, que preenchem
 *  primeiro — prioridade de sinergia real, não ruído. */
const ROLE_TO_TALENTOS: Record<RoleId, [string, string]> = {
  fisico: ['impacto_imediato', 'persistencia'],
  tanque: ['persistencia', 'economia_de_recurso'],
  magico: ['conjuracao_rapida', 'canalizacao_profunda'],
  alcance: ['alcance_estendido', 'dano_ao_longo_do_tempo'],
  suporte: ['economia_de_recurso', 'canalizacao_profunda'],
};

function sum(record: Partial<Record<string, number>>): number {
  return Object.values(record).reduce((a: number, b) => a + (b ?? 0), 0);
}

/** Maior resto: shares → inteiros somando exatamente `total`. */
function apportion<K extends string>(shares: Record<K, number>, order: K[], total: number): Record<K, number> {
  const shareTotal = order.reduce((sum, k) => sum + Math.max(0, shares[k]), 0);
  const raw = order.map(k => ({ key: k, exact: shareTotal > 0 ? (Math.max(0, shares[k]) / shareTotal) * total : total / order.length }));
  const floors = raw.map(r => ({ ...r, floor: Math.floor(r.exact), remainder: r.exact - Math.floor(r.exact) }));
  let assigned = floors.reduce((sum, r) => sum + r.floor, 0);
  const out = Object.fromEntries(floors.map(r => [r.key, r.floor])) as Record<K, number>;
  const byRemainder = [...floors].sort((a, b) => b.remainder - a.remainder);
  let i = 0;
  while (assigned < total && byRemainder.length > 0) {
    out[byRemainder[i % byRemainder.length].key] += 1;
    assigned++; i++;
  }
  return out;
}

/** Ficha de UM estágio a partir dos eixos. Determinística por `seedKey`. */
export function buildFicha(nome: string, oracle: OracleAxes, stage: FichaStage = 'rookie', seedKey: string = nome): Ficha {
  const budget = budgetForStage(stage);

  const elementoShares = Object.fromEntries(
    CLASS_ELEMENT_ORDER.map(id => [id, oracle.classElements[id]])
  ) as Record<ElementoBaseId, number>;
  const elementos = apportion(elementoShares, CLASS_ELEMENT_ORDER, budget.elementos);
  // Zero = "investiu e não ganhou nada" — o próprio investirElemento do
  // class-system proíbe; some do registro.
  for (const el of CLASS_ELEMENT_ORDER) if (elementos[el] === 0) delete elementos[el];

  const DISTRIBUTED_ESCOLAS = ['combate_fisico', 'longo_alcance', 'conjuracao', 'benca', 'maldicao'] as const;
  const roleEscolaShares = { combate_fisico: 0, longo_alcance: 0, conjuracao: 0, benca: 0, maldicao: 0 } as Record<(typeof DISTRIBUTED_ESCOLAS)[number], number>;
  const alignmentTotal = (Object.values(oracle.alignments) as number[]).reduce((a, b) => a + b, 0) || 1;
  const bencaFraction = (oracle.alignments.benevolencia + oracle.alignments.harmonia * 0.5) / alignmentTotal;
  const maldicaoFraction = (oracle.alignments.poder + oracle.alignments.harmonia * 0.5) / alignmentTotal;
  for (const role of Object.keys(oracle.roles) as RoleId[]) {
    const share = oracle.roles[role];
    if (role === 'suporte') {
      roleEscolaShares.benca += share * bencaFraction;
      roleEscolaShares.maldicao += share * maldicaoFraction;
      continue;
    }
    const escola = ROLE_TO_ESCOLA[role];
    if (escola !== 'evocacao') roleEscolaShares[escola as keyof typeof roleEscolaShares] += share;
  }
  const distributedEscolas = apportion(roleEscolaShares, [...DISTRIBUTED_ESCOLAS], budget.escolasDistribuidas);
  const escolas: Partial<Record<EscolaId, number>> = { evocacao: budget.evocacaoFixo };
  for (const [escola, pontos] of Object.entries(distributedEscolas)) {
    if (pontos > 0) escolas[escola as EscolaId] = pontos;
  }

  const dominantRole = oracle.dominantRole;
  const recursos: Partial<Record<RecursoId, number>> = {
    [ROLE_TO_RECURSO[dominantRole]]: budget.recursos,
  };

  const talentos = allocateTalentos(dominantRole, escolas, recursos, budget.talentoRanks, seedKey);

  // A profissão é traço estável: decidida UMA vez, na escala rookie, e
  // reusada em todo estágio — os insumos maiores dos estágios altos faziam a
  // profissão "re-rolar" em 35% dos perfis (medido no laboratório).
  const rookieBudget = stage === 'rookie' ? budget : budgetForStage('rookie');
  const rookieElementos = stage === 'rookie' ? elementos : apportion(elementoShares, CLASS_ELEMENT_ORDER, rookieBudget.elementos);
  const rookieDistributed = stage === 'rookie' ? distributedEscolas : apportion(roleEscolaShares, [...DISTRIBUTED_ESCOLAS], rookieBudget.escolasDistribuidas);
  const rookieEscolas: Partial<Record<EscolaId, number>> = { evocacao: rookieBudget.evocacaoFixo, ...rookieDistributed };
  const rookieRecursos: Partial<Record<RecursoId, number>> = { [ROLE_TO_RECURSO[dominantRole]]: rookieBudget.recursos };

  const profissoes: Partial<Record<ProfissaoId, number>> = {
    [pickProfissao(rookieElementos, rookieEscolas, rookieRecursos, seedKey)]: budget.profissao,
  };

  return {
    nome, elementos, escolas, recursos, talentos, profissoes,
    totals: {
      elementos: sum(elementos), escolas: sum(escolas), recursos: sum(recursos),
      talentos: sum(talentos), profissoes: sum(profissoes),
    },
  };
}

/**
 * Gasta ranks pelo registro INTEIRO de talentos, ciente de pré-requisito.
 *
 * Ordem de prioridade:
 *   1. os 2 talentos temáticos do papel (sinergia real, sempre primeiro);
 *   2. TODOS os demais elegíveis — gated já destravados E livres — num único
 *      embaralhamento pela seed. Já foi "gated primeiro, livres depois", e a
 *      simulação mostrou o custo: nos estágios altos os ~30 gated elegíveis
 *      consumiam o orçamento inteiro e 15 talentos LIVRES nunca apareciam na
 *      ficha de ninguém. Um pool único dá a todo talento elegível a mesma
 *      chance de entrar em alguma ficha.
 *
 * Respeita `ranksMaximos` e `exclusivoCom` (adquirir um talento bloqueia os
 * listados nos dois sentidos).
 */
function allocateTalentos(
  dominantRole: RoleId,
  escolas: Partial<Record<EscolaId, number>>,
  recursos: Partial<Record<RecursoId, number>>,
  budget: number,
  seedKey: string,
): Partial<Record<string, number>> {
  const meets = (t: TalentoSnapshot): boolean => {
    if (!t.requisito) return true;
    if (t.requisito.escola) return (escolas[t.requisito.escola] ?? 0) >= t.requisito.nivelMinimo;
    if (t.requisito.recurso) return (recursos[t.requisito.recurso] ?? 0) >= t.requisito.nivelMinimo;
    return true;
  };

  const rng = mulberry32(hashString(`${seedKey}|talentos`));
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const thematic = ROLE_TO_TALENTOS[dominantRole].filter(id => CLASS_DATA.talentos[id]);
  const rest = shuffle(Object.keys(CLASS_DATA.talentos).filter(
    id => !thematic.includes(id) && meets(CLASS_DATA.talentos[id])
  ));
  const priority = [...thematic, ...rest];

  const talentos: Partial<Record<string, number>> = {};
  const excluded = new Set<string>();
  let remaining = budget;

  for (const id of priority) {
    if (remaining <= 0) break;
    if (excluded.has(id)) continue;
    const def = CLASS_DATA.talentos[id];
    if (!meets(def)) continue;
    const ranks = Math.min(def.ranksMaximos, remaining);
    if (ranks <= 0) continue;
    talentos[id] = ranks;
    remaining -= ranks;
    for (const ex of def.exclusivoCom ?? []) excluded.add(ex);
  }

  return talentos;
}

/**
 * Sinergias temáticas profissão↔recurso (uma por recurso; curtidor, sem
 * recurso próprio, sinergiza com o talento persistencia via escola) — vindas
 * do laboratório, onde o argmax puro fazia ferreiro vencer ~80% dos perfis.
 * As 5 profissões novas (encantador/escriba/cozinheiro/luthier/cartografo)
 * apoiam-se nos elementos recém-ancorados pela constelação (arcano, tempo,
 * som, espaço, gravidade…), então o fator elemental já as discrimina; a
 * simulação de cobertura é quem confirma que as 11 são alcançáveis.
 */
const RECURSO_SYNERGY: Partial<Record<ProfissaoId, RecursoId>> = {
  ferreiro: 'furia',
  tecelao: 'fe',
  artesao: 'mana',
  joalheiro: 'ressonancia',
  alquimista: 'soullink',
};
const SYNERGY_BONUS = 20;

function pickProfissao(
  elementos: Partial<Record<ElementoBaseId, number>>,
  escolas: Partial<Record<EscolaId, number>>,
  recursos: Partial<Record<RecursoId, number>>,
  seedKey: string,
): ProfissaoId {
  const scored = (Object.entries(CLASS_DATA.profissoes) as Array<[ProfissaoId, ClassSystemSnapshot['profissoes'][ProfissaoId]]>).map(([id, def]) => {
    let score = 0;
    for (const [el, peso] of Object.entries(def.fatoresElementos)) {
      score += (elementos[el as ElementoBaseId] ?? 0) * (peso ?? 0) * 0.55;
    }
    for (const [esc, peso] of Object.entries(def.fatoresEscolas ?? {})) {
      score += (escolas[esc as EscolaId] ?? 0) * (peso ?? 0) * 0.3;
    }
    const synergy = RECURSO_SYNERGY[id];
    if (synergy && (recursos[synergy] ?? 0) > 0) score += SYNERGY_BONUS;
    return { id, score };
  });
  const bestScore = Math.max(...scored.map(s => s.score));
  const band = scored.filter(s => s.score >= bestScore - SYNERGY_BONUS);
  const rng = mulberry32(hashString(`${seedKey}|profissao`));
  return pick(rng, band).id;
}
