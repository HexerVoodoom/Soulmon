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
 *  ⚠️ Vocabulário trocado em 28/09/2026: `familia` passou a ser o GRUPO da
 *  criatura (`scripts/bestiario-originais.mjs` — fungo, planta, peixe,
 *  inseto, aracnídeo, anfíbio, réptil, ave, mamífero, cnidário, verme,
 *  molusco, crustáceo, monstro, humanoide, construto, etéreo, morto-vivo,
 *  extraplanetário, geológico, elemental, demônio, angelical, dracônico).
 *  `invertebrado` saiu na Fase 1 (B1): tinha 1 criatura. As antigas (`besta`, `aquatica`, `gigante`, `geleia`,
 *  `espirito`, `aberracao`, `ignea`) saíram com as entradas geradas. Todo
 *  grupo aparece em pelo menos um reino. */
const REALM_TO_FAMILIAS: Record<RealmId, string[]> = {
  deserto: ['reptil', 'aracnideo', 'inseto', 'geologico', 'elemental'],
  picos: ['ave', 'humanoide', 'geologico', 'angelical', 'monstro'],
  oceano: ['peixe', 'cnidario', 'molusco', 'crustaceo', 'monstro'],
  pantano: ['anfibio', 'reptil', 'verme', 'fungo', 'morto_vivo', 'crustaceo'],
  floresta: ['mamifero', 'planta', 'inseto', 'anfibio', 'etereo', 'molusco'],
  cavernas: ['aracnideo', 'verme', 'fungo', 'demonio', 'construto', 'morto_vivo'],
  gelo: ['mamifero', 'ave', 'peixe', 'humanoide', 'elemental', 'cnidario'],
  campina: ['planta', 'mamifero', 'ave', 'construto', 'extraplanetario'],
  akasha: ['etereo', 'angelical', 'demonio', 'extraplanetario'],
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
/** Faixa mínima nos estágios de EVOLUÇÃO (com pick anterior). ⚠️ 28/09/2026:
 *  com o pool só de entradas originais (194, cada família com 6–18), a faixa
 *  de 24 sempre misturava várias famílias e o parentesco não pesava nada —
 *  97% das evoluções trocavam de família. O sorteio INICIAL mantém a faixa
 *  larga (é ela que garante que toda criatura seja alcançável). */
const MIN_BAND_LINHAGEM = 6;

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
  if (c.familia && familiaEsperada.includes(c.familia)) score += FAMILIA_BONUS;
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

/**
 * Peso do parentesco (`speciesProximity`) na escolha de cada estágio da
 * linhagem. ⚠️ Achado do Loop A (28/09/2026, N=400): a peso cheio (até
 * +11,5 contra uma faixa de sorteio de 4) o parentesco decidia sozinho —
 * 79% dos perfis passavam os 5 estágios na MESMA família, e a leitura da
 * pessoa quase não mexia na evolução. Com o pool só de entradas originais
 * (194, famílias de 6–18) o problema virou o oposto — 97% trocavam de
 * família — e o valor foi recalibrado para 3 junto com `MIN_BAND_LINHAGEM`.
 * Régua: `criacaoDistribuicao.test.ts` (continuidade é o normal, travessia
 * não é rara).
 */
// ⚠️ 06/10/2026: era 3, calibrado para o pool curado de 194. Com o corpus de
// 7.386 (≈330 por grupo) a faixa de 6 só tinha criaturas da MESMA família e
// 0,8% das evoluções atravessavam. Varredura (N=240, mesma régua de
// `criacaoDistribuicao.test.ts`): 0,25→96%, 0,5→93%, 0,8→77%, **1,0–1,2 passa
// (30–65%)**, 1,5→22%, 2→5%. A janela é estreita — o valor fica no meio dela.
const LINEAGE_PROXIMITY_WEIGHT = 1.1;

const PREFIXO_PROCEDURAL = /^(?:Titânico|Espiritual|Cristalino|Corrompido|Ancião)\s+/;
/** A ESPÉCIE de uma entrada do pool: sem prefixo procedural, sem o sufixo
 *  de elemento ("de Fogo") e sem o modificador "Veneno/Venenoso" — as
 *  variantes da mesma espécie contam como uma só. */
export function especieDe(nome: string): string {
  return nome
    .replace(PREFIXO_PROCEDURAL, '')
    .replace(/\s+de\s+\S+$/, '')
    .replace(/\s+Venenos[oa]$/, '')
    .replace(/\s+Veneno$/, '')
    .trim();
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
      score: scoreCreature(creature, axes)
        + (prev ? speciesProximity(prev, creature) * LINEAGE_PROXIMITY_WEIGHT : 0),
    }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0].score;
  if (!prev) return sortearPorGrupo(scored, top, seedString);
  let band = scored.filter(s => s.score >= top - BAND_WIDTH);
  const minBand = prev ? MIN_BAND_LINHAGEM : MIN_BAND;
  if (band.length < minBand) band = scored.slice(0, minBand);
  // Sorteio com chance IGUAL por GRUPO (família) dentro da faixa, não por
  // entrada. ⚠️ Histórico (28/09/2026): primeiro era por entrada, e a base
  // com mais variantes no pool ganhava ("Cão" em 10% das criações); depois
  // por espécie; com o pool só de originais cada entrada JÁ é uma espécie, e
  // o que desequilibrava era o tamanho do GRUPO (mamíferos com 18 criaturas
  // saíam em 11,6%, anfíbios com 7 em 1,9%). O pedido do dono é chance
  // proporcional entre grupos — quem decide o grupo é a leitura da pessoa
  // (quem entra na faixa), não quantas criaturas o catálogo tem nele.
  // Só no sorteio INICIAL: na linhagem, igualar grupos anularia o parentesco
  // (medido: 83% atravessavam família), então lá cada entrada vale 1.
  const grupoDe = (c: BestiaryCreature) => (prev ? c.nome : (c.familia ?? especieDe(c.nome)));
  const porGrupo = new Map<string, number>();
  for (const s of band) porGrupo.set(grupoDe(s.creature), (porGrupo.get(grupoDe(s.creature)) ?? 0) + 1);
  const rng = mulberry32(hashString(seedString));
  const total = porGrupo.size; // soma de 1/n sobre as entradas = nº de grupos
  let alvo = rng() * total;
  let chosen = band[band.length - 1];
  for (const s of band) {
    alvo -= 1 / porGrupo.get(grupoDe(s.creature))!;
    if (alvo < 0) { chosen = s; break; }
  }
  return { creature: chosen.creature, score: chosen.score, bandSize: band.length };
}

/**
 * Peso de cada GRUPO no sorteio inicial (padrão 1). ⚠️ Fase 1 B3
 * (28/09/2026): mesmo com chance igual DENTRO da faixa, a frequência com que
 * cada grupo ENTRA na faixa varia com o catálogo (quantos reinos o listam em
 * `REALM_TO_FAMILIAS`, quantos elementos comuns ele tem) — a auditoria mediu
 * demônio 7,2% × aracnídeo 1,4% (5,3×). O peso compensa só essa frequência
 * de entrada; quem entra continua sendo decidido pela leitura. Calibrado por
 * simulação (seed 20260928), validado por `npm run oraculo:auditoria`.
 * Exportado mutável só para o script de calibração.
 */
export const GRUPO_PESO: Record<string, number> = {
  anfibio: 1.55, angelical: 1.13, aracnideo: 1.54, ave: 0.47, cnidario: 1.16,
  construto: 0.98, crustaceo: 1.73, demonio: 0.88, elemental: 0.78,
  etereo: 1.43, extraplanetario: 1.23, fungo: 1.65, geologico: 1.0,
  humanoide: 0.57, inseto: 2.21, mamifero: 0.44, molusco: 2.1, monstro: 0.7,
  morto_vivo: 0.94, peixe: 1.07, planta: 0.81, reptil: 1.08, verme: 1.49,
};

/** Grupos mínimos na faixa do sorteio inicial. */
const MIN_GRUPOS = 6;
/** Faixa DENTRO do grupo escolhido — mais larga que `BAND_WIDTH` porque o
 *  grupo já foi decidido pela leitura. Medido (N=800): 4 → 178/194 criaturas
 *  sorteadas; 6 → 188/194 e tupla visível 97% única; 8 → 183 (pior). */
const BAND_WIDTH_NO_GRUPO = 6;

/**
 * Sorteio INICIAL em duas etapas: primeiro o GRUPO, depois a criatura.
 * ⚠️ 28/09/2026: sortear por entrada (mesmo com peso 1/n por grupo) deixava
 * o grupo refém de quantas criaturas dele caíam perto do topo — hostilidade e
 * tamanho favorecem monstros/aves/mamíferos, e o resultado ia de 1% a 9%
 * (7×). Aqui cada grupo entra na faixa pela SUA melhor criatura (a leitura
 * continua decidindo quem entra), a faixa tem pelo menos `MIN_GRUPOS`, e
 * todo grupo da faixa tem a mesma chance.
 */
function sortearPorGrupo(scored: { creature: BestiaryCreature; score: number }[], top: number, seedString: string): BestiaryPick {
  const porGrupo = new Map<string, { creature: BestiaryCreature; score: number }[]>();
  for (const s of scored) {
    const g = s.creature.familia ?? especieDe(s.creature.nome);
    if (!porGrupo.has(g)) porGrupo.set(g, []);
    porGrupo.get(g)!.push(s);
  }
  // `scored` já vem ordenado: o primeiro de cada lista é o melhor do grupo.
  const grupos = [...porGrupo.entries()].sort((a, b) => b[1][0].score - a[1][0].score);
  let faixa = grupos.filter(([, l]) => l[0].score >= top - BAND_WIDTH);
  if (faixa.length < MIN_GRUPOS) faixa = grupos.slice(0, MIN_GRUPOS);
  const rng = mulberry32(hashString(seedString));
  // Peso por grupo (Fase 1 B3) — ver `GRUPO_PESO`.
  const pesos = faixa.map(([g]) => GRUPO_PESO[g] ?? 1);
  let alvo = rng() * pesos.reduce((a, b) => a + b, 0);
  let idx = faixa.length - 1;
  for (let i = 0; i < faixa.length; i++) { alvo -= pesos[i]; if (alvo < 0) { idx = i; break; } }
  const [, lista] = faixa[idx];
  const dentro = lista.filter(s => s.score >= lista[0].score - BAND_WIDTH_NO_GRUPO);
  const chosen = dentro[Math.floor(rng() * dentro.length)];
  const bandSize = faixa.reduce((n, [, l]) => n + l.filter(s => s.score >= l[0].score - BAND_WIDTH).length, 0);
  return { creature: chosen.creature, score: chosen.score, bandSize };
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
