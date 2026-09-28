// ---------------------------------------------------------------------------
// Seleção no bestiário — o pool alinhado com as respostas.
//
// O pool (`pool.json`, gerado por `scripts/sync-oracle-data.mjs` do corpus
// canônico do Besti-rio-, com SHA de procedência) é pontuado contra a leitura
// COMPLETA do oráculo: o vetor dos 17 elementos do class-system (não só o
// dominante), o reino, o alinhamento e o papel. A criatura escolhida vira
// INSPIRAÇÃO da geração — nunca cópia, e o nome dela NUNCA entra em prompt
// de imagem (há teste travando).
//
// Padrão "coerente com fator aleatório real", o mesmo do companheiro e da
// profissão: reduz à FAIXA de candidatas com pontuação próxima do topo e
// sorteia dentro dela com seed determinística. A faixa tem tamanho mínimo —
// é o que garante variedade E que toda criatura do pool seja alcançável
// (verificado por simulação de cobertura).
// ---------------------------------------------------------------------------

import { hashString, mulberry32, pick } from '../../oracle';
import type { AlignmentId, RealmId, RoleId } from '../../oracle';
import type { OracleAxes } from '../types';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import poolJson from './pool.json';

export interface BestiaryCreature {
  nome: string;
  origem: string;
  descricao: string;
  elementos: string[];
  familia: string | null;
  biologia: string[];
  bioma: string[];
  tamanho: string;
  hostilidade: number;
  atributos: { forca: number; inteligencia: number; velocidade: number; magia: number } | null;
}

interface Pool {
  _provenance: { repo: string; ref: string; sha: string; syncedAt: string };
  criaturas: BestiaryCreature[];
}

export const BESTIARY_POOL = (poolJson as unknown as Pool).criaturas;
export const BESTIARY_PROVENANCE = (poolJson as unknown as Pool)._provenance;

/** id derivado → componentes base, direto da tabela de receitas (não uma
 *  segunda tabela à mão — o bestiário usa ids derivados como "lava"/"gelo"
 *  no vocabulário canônico, e a receita diz de que bases eles são feitos). */
const DERIVED_TO_BASE: Record<string, string[]> = Object.fromEntries(
  DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes as unknown as string[]])
);

function baseElements(elementos: string[]): string[] {
  return elementos.flatMap(id => DERIVED_TO_BASE[id] ?? [id]);
}

/** Reino → famílias com afinidade de bioma (geografia, não personalidade).
 *  ⚠️ `ignea` (deserto) não tem NENHUMA criatura no pool hoje (0/732) — e,
 *  segundo `docs/BESTIARIO-PROCEDENCIA.md` §12, o próprio nome já foi visto
 *  como resíduo de um bug de corrupção de família (curadoria de 27/09/2026),
 *  sem certeza de que seja uma família pretendida de verdade. Por isso NÃO
 *  ganhou ponte sintética como `humanoide` ganhou (ver `scoreCreature`) —
 *  sintetizar linha para uma família cuja legitimidade está em dúvida seria
 *  inventar em cima de incerteza, não consertar dado real. Fica sem bônus
 *  até o dono decidir (manter/remover/gerar de verdade). */
const REALM_TO_FAMILIAS: Record<RealmId, string[]> = {
  deserto: ['besta', 'aberracao', 'ignea'],
  picos: ['ave', 'gigante', 'draconico'],
  oceano: ['aquatica', 'geleia'],
  pantano: ['planta', 'aberracao', 'geleia'],
  floresta: ['besta', 'planta', 'espirito'],
  cavernas: ['morto_vivo', 'construto', 'demonio'],
  gelo: ['besta', 'espirito', 'gigante'],
  campina: ['besta', 'ave', 'humanoide'],
  akasha: ['espirito', 'aberracao', 'demonio'],
};

/** Reino → palavras de bioma do bestiário (o corpus tem bioma textual). */
const REALM_TO_BIOMA: Record<RealmId, string[]> = {
  deserto: ['deserto', 'árido'],
  picos: ['montanha', 'picos', 'colina'],
  oceano: ['oceano', 'mar', 'costa', 'aquático'],
  pantano: ['pântano', 'mangue', 'brejo'],
  floresta: ['floresta', 'selva', 'bosque'],
  cavernas: ['caverna', 'subterrâneo', 'subsolo'],
  gelo: ['gelo', 'ártico', 'tundra', 'neve'],
  campina: ['campo', 'campina', 'planície', 'pradaria'],
  akasha: ['etéreo', 'astral', 'cósmico', 'espiritual'],
};

const ALIGNMENT_TO_HOSTILIDADE: Record<AlignmentId, [number, number]> = {
  poder: [6, 10],
  harmonia: [3, 8],
  benevolencia: [1, 6],
};

const ROLE_TO_TAMANHOS: Record<RoleId, string[]> = {
  tanque: ['Grande', 'Enorme', 'Colossal'],
  fisico: ['Medio', 'Médio', 'Grande', 'Enorme'],
  magico: ['Miudo', 'Miúdo', 'Pequeno', 'Medio', 'Médio', 'Grande', 'Enorme', 'Colossal'],
  suporte: ['Miudo', 'Miúdo', 'Pequeno', 'Medio', 'Médio'],
  alcance: ['Pequeno', 'Medio', 'Médio', 'Grande'],
};

/** Quão perto do topo uma candidata precisa pontuar para entrar na faixa do
 *  sorteio, e o tamanho mínimo da faixa. Calibrados por simulação de
 *  cobertura: faixa estreita demais deixa criatura inalcançável; larga
 *  demais desalinha a escolha das respostas. */
const BAND_WIDTH = 4;
const MIN_BAND = 24;

export function scoreCreature(c: BestiaryCreature, axes: OracleAxes): number {
  let score = 0;

  // Vetor COMPLETO dos 17 elementos: cada elemento da criatura soma o share
  // que a leitura deu àquele elemento (derivados contam pelos componentes).
  // É o termo dominante — contínuo, então alinha fino, não só por vencedor.
  const bases = baseElements(c.elementos);
  for (const el of bases) {
    score += (axes.classElements[el as keyof typeof axes.classElements] ?? 0) * 0.35;
  }
  // Criatura de muitos elementos não pode vencer por acumulação pura:
  // normaliza pelo número de elementos além do primeiro.
  score = score / Math.sqrt(bases.length || 1);

  // ⚠️ Rebalanceio de 28/09/2026 (pedido do dono): os quatro bônus fixos
  // abaixo dobraram (2→4 / 2→4 / 1,5→3 / 1,5→3, teto combinado 7→14) porque
  // o termo de elemento, sendo contínuo sobre 17 valores medidos, tipicamente
  // supera o teto antigo para qualquer criatura bem alinhada — deixando
  // papel/alinhamento/reino do jogador (que só entram por aqui) incapazes de
  // vencer um elemento razoavelmente concentrado, mesmo quando são o sinal
  // mais forte da própria leitura. Dobrar aproxima a ordem de grandeza sem
  // apagar o peso do elemento (ele continua sendo o único termo CONTÍNUO,
  // sensível a nuance; os quatro abaixo continuam binários — bate ou não).
  const FAMILIA_BONUS = 4;
  const BIOMA_BONUS = 4;
  const HOSTILIDADE_BONUS = 3;
  const TAMANHO_BONUS = 3;

  const familiaEsperada = REALM_TO_FAMILIAS[axes.dominantRealm];
  if (c.familia && familiaEsperada.includes(c.familia)) {
    score += FAMILIA_BONUS;
  } else if (
    // Ponte de dado real (não invenção): nenhuma criatura do pool de hoje
    // tem `familia: 'humanoide'` (0/732, `docs/BESTIARIO-PROCEDENCIA.md`
    // §7.1), mas várias já têm `biologia: ['Humanoide']` (os arquétipos de
    // Gigante/Autômato etc.) — usa esse campo, que É real e já curado, como
    // evidência equivalente só onde o reino esperaria a família ausente.
    familiaEsperada.includes('humanoide') && c.biologia.includes('Humanoide')
  ) {
    score += FAMILIA_BONUS;
  }
  const biomas = REALM_TO_BIOMA[axes.dominantRealm];
  if (c.bioma.some(b => biomas.some(k => b.toLowerCase().includes(k)))) score += BIOMA_BONUS;

  const [hMin, hMax] = ALIGNMENT_TO_HOSTILIDADE[axes.dominantAlignment];
  if (c.hostilidade >= hMin && c.hostilidade <= hMax) score += HOSTILIDADE_BONUS;

  if (ROLE_TO_TAMANHOS[axes.dominantRole].includes(c.tamanho)) score += TAMANHO_BONUS;

  return score;
}

export interface BestiaryPick {
  creature: BestiaryCreature;
  score: number;
  /** Tamanho da faixa de onde a escolha saiu — transparência da aleatoriedade. */
  bandSize: number;
}

/**
 * Escolhe a criatura-inspiração: pontua o pool inteiro, reduz à faixa
 * (topo − BAND_WIDTH, com mínimo MIN_BAND por ordem de pontuação) e sorteia
 * com seed determinística. Mesmo (leitura, seedKey) = mesma criatura; seed
 * nova (reroll) = outra criatura coerente com a mesma leitura.
 */
export function selectBestiaryCreature(axes: OracleAxes, seedKey: string): BestiaryPick {
  return selectFromPool(axes, `${seedKey}|bestiario`, null, new Set());
}

// ---------------------------------------------------------------------------
// Continuidade de espécie: a linhagem de inspirações através dos estágios.
//
// A evolução não deve saltar para uma espécie sem parentesco: um dragão tende
// a evoluir para outro dragão — a MENOS que outra criatura compartilhe muitos
// outros aspectos (biologia, tamanho, elementos), caso em que a travessia de
// família é legítima (dragão → mamífero com forte sobreposição). O termo de
// proximidade abaixo codifica exatamente isso: família pesa mais que qualquer
// aspecto isolado, mas a SOMA dos outros aspectos pode superá-la.
// ---------------------------------------------------------------------------

const TAMANHO_ORDER = ['miudo', 'pequeno', 'medio', 'grande', 'enorme', 'colossal'];

function tamanhoIndex(t: string): number {
  const norm = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return TAMANHO_ORDER.indexOf(norm);
}

/** Quanto `c` é "da mesma linhagem" que `prev`. Família domina (+4), mas
 *  biologia (até +4,5), elementos base em comum (até +2) e tamanho vizinho
 *  (+1) somados podem passá-la — é o que permite a travessia rara. */
export function speciesProximity(prev: BestiaryCreature, c: BestiaryCreature): number {
  let bonus = 0;
  if (prev.familia && c.familia && prev.familia === c.familia) bonus += 4;
  const bioOverlap = c.biologia.filter(b => prev.biologia.includes(b)).length;
  bonus += Math.min(bioOverlap, 3) * 1.5;
  const prevBases = new Set(baseElements(prev.elementos));
  const sharedBases = baseElements(c.elementos).filter(e => prevBases.has(e)).length;
  bonus += Math.min(sharedBases, 2);
  const ti = tamanhoIndex(prev.tamanho); const tj = tamanhoIndex(c.tamanho);
  if (ti >= 0 && tj >= 0 && Math.abs(ti - tj) <= 1) bonus += 1;
  return bonus;
}

function selectFromPool(
  axes: OracleAxes,
  seedString: string,
  prev: BestiaryCreature | null,
  exclude: Set<string>,
): BestiaryPick {
  const scored = BESTIARY_POOL
    .filter(c => !exclude.has(c.nome))
    .map(creature => ({
      creature,
      score: scoreCreature(creature, axes) + (prev ? speciesProximity(prev, creature) : 0),
    }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].score;
  let band = scored.filter(s => s.score >= top - BAND_WIDTH);
  if (band.length < MIN_BAND) band = scored.slice(0, MIN_BAND);
  const rng = mulberry32(hashString(seedString));
  const chosen = pick(rng, band);
  return { creature: chosen.creature, score: chosen.score, bandSize: band.length };
}

/**
 * Linhagem completa de inspirações, um pick por estágio, em ordem de
 * evolução. O primeiro estágio usa EXATAMENTE a seleção clássica (mesma seed
 * `|bestiario` — a linhagem não muda a inspiração que já alimenta a geração);
 * cada estágio seguinte pontua o pool com o termo de proximidade ao pick
 * anterior e exclui os nomes já usados (evoluir é virar outra criatura).
 */
export function selectBestiaryLineage(
  axes: OracleAxes,
  seedKey: string,
  stages: readonly string[],
): Record<string, BestiaryPick> {
  const lineage: Record<string, BestiaryPick> = {};
  const used = new Set<string>();
  let prev: BestiaryCreature | null = null;
  for (const [i, stage] of stages.entries()) {
    const seedString = i === 0 ? `${seedKey}|bestiario` : `${seedKey}|bestiario|${stage}`;
    const pickForStage = selectFromPool(axes, seedString, prev, used);
    lineage[stage] = pickForStage;
    used.add(pickForStage.creature.nome);
    prev = pickForStage.creature;
  }
  return lineage;
}
