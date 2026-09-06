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
import { cascataDosPares, CUSTO_PONTO_BASE, CUSTO_PONTO_PAR } from './cascata';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';

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

/**
 * ORÇAMENTO DE ELEMENTOS por estágio — curva própria, mais funda que o
 * multiplicador geral, porque é ela que faz a CASCATA geracional acontecer:
 * destravar um par exige ~50 pontos em cada componente (marco de 100 de
 * orçamento do class-system), e só perfis concentrados de mega/ultra chegam
 * lá — "só as criaturas de estágio avançado alcançam os elementos avançados".
 * Base custa 1; ponto direto em par destravado custa `CUSTO_PONTO_PAR` (2).
 */
export const ELEMENT_ORCAMENTO_BY_STAGE: Record<FichaStage, number> = {
  rookie: 30, champion: 60, ultimate: 120, mega: 300, ultra: 500,
};

/** Fração do orçamento de elementos desviada para pontos DIRETOS no melhor
 *  par destravado (especialização — o resto continua alargando as bases). */
const DERIVED_SPEND_FRACTION = 0.2;

/**
 * ESPECIALIZAÇÃO PROGRESSIVA: expoente aplicado às afinidades antes da
 * distribuição — evoluir é focar. Rookie fica em 1 (largura total; profissão
 * e captura leem a ficha rookie e não mudam); nos estágios altos o expoente
 * concentra o orçamento nos elementos dominantes, que é o que permite à
 * cascata destravar pares de verdade (sem isso, espalhar 500 pontos por 17
 * elementos deixava o segundo colocado abaixo dos ~50 do marco de destrave —
 * medido: 3 fichas com par em 120 no ultra; com o foco, 88/120).
 *
 * A ESCADA medida (120 perfis reais): rookie–ultimate só bases · mega chega
 * com passivos altos ("quase destravando" — a antecipação é conteúdo) ·
 * ultra destrava e COMPRA o par em ~73% dos perfis (23 pares distintos).
 * Só o topo alcança os elementos avançados, como pedido.
 */
const FOCUS_EXPONENT: Record<FichaStage, number> = {
  rookie: 1, champion: 1.1, ultimate: 1.25, mega: 1.55, ultra: 1.7,
};

/**
 * RENASCIMENTO (`utils/rebirth.ts`): quem renasceu joga com um orçamento
 * maior em TODOS os estágios — é essa multiplicação, e não um bônus solto,
 * que faz "mais pontos no primeiro nível e, por consequência, nos próximos"
 * ser verdade por construção. O valor mora no módulo do Rebirth; aqui só se
 * aplica (footgun 9: um dono por regra).
 */
export interface RebirthBoost {
  multiplier: number;
  /** Escola escolhida na cerimônia — recebe piso garantido de pontos. */
  escola: EscolaId;
  /** Elemento escolhido (base ou par de 2º nível): entra como VIÉS na
   *  distribuição, nunca como pontos avulsos. Par vira viés nos dois
   *  componentes, que é como a cascata destrava o par de verdade. */
  elemento: string;
}

function budgetForStage(stage: FichaStage, boost?: RebirthBoost): Budget {
  const m = STAGE_MULTIPLIER[stage] * (boost?.multiplier ?? 1);
  return {
    elementos: Math.round(ROOKIE_BUDGET.elementos * m),
    escolasDistribuidas: Math.round(ROOKIE_BUDGET.escolasDistribuidas * m),
    evocacaoFixo: Math.round(ROOKIE_BUDGET.evocacaoFixo * m),
    recursos: Math.round(ROOKIE_BUDGET.recursos * m),
    talentoRanks: Math.round(ROOKIE_BUDGET.talentoRanks * m),
    profissao: Math.round(ROOKIE_BUDGET.profissao * m),
  };
}

/**
 * O elemento escolhido no Rebirth entra como VIÉS de participação, não como
 * pontos avulsos: a alocação continua sendo a mesma função, com as mesmas
 * garantias de soma. Um PAR (2º nível) vira viés nos DOIS componentes —
 * é assim que a cascata destrava o par de verdade (`cascataDosPares`), em
 * vez de escrever o par à mão numa ficha, que seria o par sem o caminho.
 */
const REBIRTH_ELEMENT_BIAS = 2.5;

function applyElementBias(shares: Record<ElementoBaseId, number>, elementoId: string): void {
  const par = DERIVED_ELEMENT_PAIRS.find(p => p.id === elementoId);
  const alvos: ElementoBaseId[] = par
    ? [...par.componentes]
    : (CLASS_ELEMENT_ORDER as string[]).includes(elementoId) ? [elementoId as ElementoBaseId] : [];
  // Piso antes de multiplicar: quem tirou ~0 no eixo escolhido continuaria em
  // ~0 depois de multiplicar por qualquer coisa, e a escolha do jogador não
  // apareceria na ficha.
  const teto = Math.max(...CLASS_ELEMENT_ORDER.map(id => shares[id])) || 1;
  for (const alvo of alvos) {
    shares[alvo] = Math.max(shares[alvo], teto * 0.2) * REBIRTH_ELEMENT_BIAS;
  }
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

/**
 * Distribui o orçamento de elementos pela ALOCAÇÃO GERACIONAL, como um
 * jogador jogaria: primeiro tudo nas bases (proporcional às afinidades da
 * leitura); se a cascata destravar algum par, o passe 2 reserva
 * `DERIVED_SPEND_FRACTION` do orçamento para pontos diretos no MELHOR par
 * destravado (o mais equilibrado nas afinidades) e devolve o resto às bases.
 * Duas passadas, sem realimentação — determinístico.
 */
function allocateElementos(
  shares: Record<ElementoBaseId, number>,
  orcamento: number,
): Partial<Record<string, number>> {
  const passe1 = apportion(shares, CLASS_ELEMENT_ORDER, orcamento);
  const destravados = cascataDosPares(passe1).filter(c => c.destravado);
  if (destravados.length === 0) {
    for (const el of CLASS_ELEMENT_ORDER) if (passe1[el] === 0) delete passe1[el];
    return passe1;
  }
  // melhor par: o mais EQUILIBRADO nas afinidades (min dos componentes),
  // desempate por id — mesma leitura, mesmo par, sempre.
  const melhor = [...destravados].sort((x, y) => {
    const mx = Math.min(shares[x.def.componentes[0]], shares[x.def.componentes[1]]);
    const my = Math.min(shares[y.def.componentes[0]], shares[y.def.componentes[1]]);
    return my - mx || x.def.id.localeCompare(y.def.id);
  })[0];
  const pontosPar = Math.floor((orcamento * DERIVED_SPEND_FRACTION) / CUSTO_PONTO_PAR);
  const orcamentoBases = orcamento - pontosPar * CUSTO_PONTO_PAR;
  const bases = apportion(shares, CLASS_ELEMENT_ORDER, orcamentoBases);
  // o passe 2 precisa MANTER o destrave: se o corte de orçamento das bases
  // derrubasse os passivos abaixo do limiar, o ponto direto seria ilegal no
  // class-system — nesse caso o par não é comprado (volta ao passe 1).
  const aindaDestravado = cascataDosPares(bases).some(
    c => c.destravado && c.def.id === melhor.def.id,
  );
  if (!aindaDestravado || pontosPar <= 0) {
    for (const el of CLASS_ELEMENT_ORDER) if (passe1[el] === 0) delete passe1[el];
    return passe1;
  }
  const saida: Partial<Record<string, number>> = { ...bases, [melhor.def.id]: pontosPar };
  for (const el of CLASS_ELEMENT_ORDER) if (saida[el] === 0) delete saida[el];
  return saida;
}

/** Custo em orçamento de um mapa de elementos (base 1 · par 3). */
function custoElementos(elementos: Partial<Record<string, number>>): number {
  let total = 0;
  for (const [id, pts] of Object.entries(elementos)) {
    const base = (CLASS_ELEMENT_ORDER as readonly string[]).includes(id);
    total += (pts ?? 0) * (base ? CUSTO_PONTO_BASE : CUSTO_PONTO_PAR);
  }
  return total;
}

/** Ficha de UM estágio a partir dos eixos. Determinística por `seedKey`. */
export function buildFicha(
  nome: string,
  oracle: OracleAxes,
  stage: FichaStage = 'rookie',
  seedKey: string = nome,
  boost?: RebirthBoost,
): Ficha {
  const budget = budgetForStage(stage, boost);

  const elementoShares = Object.fromEntries(
    CLASS_ELEMENT_ORDER.map(id => [id, oracle.classElements[id]])
  ) as Record<ElementoBaseId, number>;
  const focoShares = Object.fromEntries(
    CLASS_ELEMENT_ORDER.map(id => [id, Math.pow(Math.max(0, elementoShares[id]), FOCUS_EXPONENT[stage])])
  ) as Record<ElementoBaseId, number>;
  if (boost) applyElementBias(focoShares, boost.elemento);
  const elementos = allocateElementos(
    focoShares,
    Math.round(ELEMENT_ORCAMENTO_BY_STAGE[stage] * (boost?.multiplier ?? 1)),
  );

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
  if (boost) {
    // Piso da escola escolhida: ela termina com a MAIOR pontuação da ficha.
    // Escolher e não ver diferença é o pior resultado possível de uma tela de
    // escolha — some-se a isso que `evocacao` tem valor fixo e nunca entra na
    // distribuição, e sem este piso escolher evocação não faria nada.
    const maior = Math.max(...Object.values(escolas).map(v => v ?? 0));
    escolas[boost.escola] = Math.max(escolas[boost.escola] ?? 0, maior + 1);
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
  const rookieElementos = stage === 'rookie' ? elementos : allocateElementos(elementoShares, ELEMENT_ORCAMENTO_BY_STAGE.rookie);
  const rookieDistributed = stage === 'rookie' ? distributedEscolas : apportion(roleEscolaShares, [...DISTRIBUTED_ESCOLAS], rookieBudget.escolasDistribuidas);
  const rookieEscolas: Partial<Record<EscolaId, number>> = { evocacao: rookieBudget.evocacaoFixo, ...rookieDistributed };
  const rookieRecursos: Partial<Record<RecursoId, number>> = { [ROLE_TO_RECURSO[dominantRole]]: rookieBudget.recursos };

  const profissoes: Partial<Record<ProfissaoId, number>> = {
    [pickProfissao(rookieElementos, rookieEscolas, rookieRecursos, seedKey)]: budget.profissao,
  };

  return {
    nome, elementos, escolas, recursos, talentos, profissoes,
    totals: {
      elementos: custoElementos(elementos), escolas: sum(escolas), recursos: sum(recursos),
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
