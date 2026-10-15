/**
 * COMBATE A PESADELOS — o sono vira conteúdo de jogo
 * ==================================================
 *
 * Parte 3 do `docs/PLANO-TAREFAS.md`, camada de cima da Janela de Descanso
 * (`utils/restWindow.ts`). Enquanto os SONHOS são a coleção passiva (o Sleep
 * Style Dex), o PESADELO é a parte jogável: de manhã, o Soulmon conta que
 * enfrentou algo enquanto o dono dormia, e o jogador entra numa luta curta.
 *
 * O enquadramento importa e é regra, não enfeite: o pesadelo NÃO é uma ameaça
 * ao jogador — é o Soulmon **defendendo o descanso do dono**. Nada de horror,
 * nada de sustos; os nomes e as descrições são fofos de propósito (ver
 * `nightmareName`/`nightmareFlavor`). O tom do app é encorajador; um app que
 * assusta antes de dormir é exatamente o que a Janela de Descanso existe para
 * não ser.
 *
 * ---------------------------------------------------------------------------
 * A REGRA CENTRAL, E ELA É INEGOCIÁVEL
 * ---------------------------------------------------------------------------
 * **A quantidade de pesadelos NUNCA escala com a DURAÇÃO do sono.**
 *
 * Escalar por duração recriaria, dentro do jogo, exatamente o que a Janela de
 * Descanso existe para evitar:
 *
 *  1. Duração é RESULTADO FISIOLÓGICO, não comportamento. Ninguém comanda o
 *     próprio sono às 3h da manhã. Premiar o resultado é a definição
 *     operacional de como se fabrica ortossonia — a busca ansiosa pelo sono
 *     perfeito alimentada por métrica (3–14% da população geral; ~23% dos
 *     usuários de 18–35 anos relatam estresse com apps de sono, contra 2,4%
 *     acima dos 66; o público deste app está INTEIRO na faixa de risco).
 *  2. Duração é FARMÁVEL, e o precedente é famoso: o exploit do Pokémon Sleep,
 *     com gente forjando semanas de sono para farmar recompensa. Se dormir 11h
 *     rendesse mais inimigos que dormir 6h, a jogada ótima passaria a ser
 *     mentir para o app (ou pior, ficar deitado sem dormir).
 *
 * Quem escala é a **REGULARIDADE** — o `ratio` de `restConstancy`:
 *
 *  - é COMPORTAMENTO controlável (deitar no horário que a própria pessoa
 *    escolheu), e não um resultado que ela não comanda;
 *  - tem TETO NATURAL: não dá para "farmar" regularidade dormindo 14h, porque
 *    o máximo é uma noite por noite (ver `NIGHTMARES_PER_NIGHT`);
 *  - é a métrica mais forte cientificamente: no UK Biobank (n=60.977) o Sleep
 *    Regularity Index previu mortalidade por todas as causas MELHOR que a
 *    duração (20–48% menos mortalidade nos quintis mais regulares), e o efeito
 *    SOBREVIVE ao controle por duração.
 *
 * Por isso este arquivo **não lê `sleptAt`/`wokeAt` para calcular nada**. As
 * únicas entradas de regra são o bit `onTime` da noite e a razão de
 * regularidade. Há teste travando: mesma regularidade com noites de 3h e de 11h
 * devolve resultado IDÊNTICO.
 *
 * ---------------------------------------------------------------------------
 * NÃO EXISTE PERDA NESTA MECÂNICA
 * ---------------------------------------------------------------------------
 *  - **Noite sem registro, ou fora da janela = 0 pesadelos e NENHUMA perda.**
 *    Noite sem registro é NEUTRA (é a regra de `restConstancy`); o app não sabe
 *    se a pessoa dormiu mal ou só não abriu o app, e chutar "falhou" seria
 *    inventar um dado ruim sobre a vida de alguém.
 *  - **Pesadelo não combatido simplesmente EXPIRA, sem custo nenhum.** Não há
 *    dano, multa, coração perdido nem contador que zera. Cobrar por não
 *    combater transformaria uma recompensa em dívida — é assim que um bônus
 *    vira cobrança, e é o oposto exato da tese do produto. Perder a luta também
 *    não custa nada (mesma regra da Masmorra: perder não custa coração).
 *
 * Todas as funções são PURAS: `now: Date` entra por parâmetro, sem React, sem
 * localStorage e sem `Math.random()` nas regras (o sorteio, quando existe, é
 * determinístico por seed, como em `rollDream`).
 *
 * O COMBATE É DELEGADO. `buildNightmareWave` chama `buildDungeonWave` em vez de
 * reimplementar inimigo/stat/escala — regra copiada é regra que diverge em
 * silêncio (footgun 9 do CLAUDE.md).
 */

import {
  buildDungeonWave,
  dungeonFoe,
  LADDER_TIERS,
  type DungeonEnemy,
  type DungeonFoeKnobs,
  type EnemyTier,
} from './dungeon';
import { getStageLevel, type EvolutionStage } from '../types/progression';
import { mulberry32 } from './combate/rng';
import type { FightSide } from './combate/fight';
import { soulLevel } from './soulXP';
import { nightmareShadowSprite } from './nightmareShadows';
import type { RingGrade } from './energia';
import {
  dreamRarity,
  restConstancy,
  type DreamRarity,
  type RestState,
} from './restWindow';
import type { PlayerDayAnchor } from './playerDay';
import { playerDayKey } from './playerDay';

// ---------------------------------------------------------------------------
// Constantes (nenhum número solto no meio da regra)
// ---------------------------------------------------------------------------

/**
 * **Teto absoluto: 1 pesadelo por noite registrada.**
 *
 * É esta constante que dá o teto natural que impede farm. Dormir mais não
 * rende mais nada; a única forma de ver mais pesadelos é ter mais NOITES — ou
 * seja, viver mais dias, que é a única "moeda" que ninguém consegue acelerar.
 */
export const NIGHTMARES_PER_NIGHT = 1;

/**
 * Tamanho da onda de combate: **UM combate só, sempre — uma FASE** (decisão do dono, 15/10/2026). Antes eram 2
 * inimigos em sequência. Isto acontece de MANHÃ, e uma mecânica de sono que exige dez minutos de combate antes
 * do café vira obrigação. O inimigo é o do tier da noite (`top`), nunca o de um tier abaixo.
 */
export const NIGHTMARE_WAVE_SIZE = 1;

/**
 * A FORÇA do pesadelo (fração do ataque de um espelho do jogador; `bonus = força − 1` no núcleo).
 *
 * ⚠️ CAUSA DO BUG "o pesadelo não causa dano" (15/10/2026): a onda usava `dungeonFoe` do ANDAR 1, cuja força é
 * 0,026–0,096 (a tabela `DUNGEON_SLOTS` foi calibrada para uma run de 5 andares com HP carregado, não para uma luta
 * isolada). Medido: um golpe do pesadelo tirava 0,3–1,3% do HP e a luta inteira 3–12% — o "dano" aparecia como "1"
 * na cena. A Masmorra continua intacta; só o Pesadelo usa esta força própria.
 *
 * 0,5 é CONSERVADOR (revisão do dono, REGISTRO): a luta custa ~35–48% do HP de quem joga sem defender (defesa
 * automática média) e ~50% no mega, com 0 derrotas por HP em 40 sementes × 3 levels — a dificuldade vem da REGRA
 * DE VITÓRIA (cheer + especial), não de um muro de HP, porque perder aqui não custa nada.
 */
export const NIGHTMARE_POWER = 0.5;

/**
 * O pesadelo no núcleo: o mesmo corpo de `dungeonFoe` (HP e curva relativos ao level), com a força do Pesadelo.
 * Dono único — a onda e a simulação do balanço (`dungeonFight.playSequence`) leem esta função.
 */
export function nightmareFoe(playerLevel: number, slot: number, knobs?: DungeonFoeKnobs): FightSide {
  const base = dungeonFoe(playerLevel, slot, 1, knobs);
  return { ...base, combatant: { ...base.combatant, bonus: NIGHTMARE_POWER - 1 } };
}

/** Teto do histórico de noites já combatidas (mesmo teto de `MAX_NIGHTS`). */
export const MAX_FOUGHT_HISTORY = 30;

/**
 * Cura máxima de uma vitória: **meio coração**, e o teto é regra.
 *
 * O carinho é a cura PRINCIPAL de HP (até 1 coração/dia). Se vencer um pesadelo
 * curasse mais que isso, o sono viraria a rota ótima de HP e o app estaria de
 * novo premiando o resultado fisiológico. Meio coração é um agrado, não uma
 * economia paralela.
 */
export const NIGHTMARE_MAX_HEART_CURE = 0.5;

/** Recompensas por raridade. Modestas de propósito. */
const REWARD_TABLE: Record<DreamRarity, { hearts: number; energy: number; bits: number }> = {
  common: { hearts: 0, energy: 1, bits: 4 },
  rare: { hearts: 0.5, energy: 1, bits: 7 },
  legendary: { hearts: 0.5, energy: 2, bits: 11 },
};

/**
 * Tier "alvo" de cada raridade, ANTES do limite do estágio do pet.
 *
 * A escada é a mesma `LADDER_TIERS` da masmorra — o motor é um só.
 */
const RARITY_TIER: Record<DreamRarity, EnemyTier> = {
  common: 'baby-ii',
  rare: 'rookie',
  legendary: 'champion',
};

/** O maior tier que cada estágio de pet pode encarar. */
const STAGE_TIER_CAP: Record<EvolutionStage, EnemyTier> = {
  rookie: 'rookie',
  champion: 'champion',
  ultimate: 'ultimate',
  mega: 'mega',
  ultra: 'mega',
};

// ---------------------------------------------------------------------------
// Estado (vai para o GameState)
// ---------------------------------------------------------------------------

export interface NightmareState {
  /** dayKeys de noites JÁ combatidas. Teto `MAX_FOUGHT_HISTORY`. */
  fought: string[];
  /** dayKey do pesadelo em aberto, se houver. */
  pending?: string;
  /** dayKeys dos dias de pesadelo do CICLO em curso (0..`NIGHTMARE_CYCLE_DAYS`), contados a partir da implantação (15/10/2026). */
  lurkDays?: string[];
  /** O ciclo fechou: o próximo evento é o SONHO BOM (paga Honra uma vez e reinicia o ciclo). */
  goodDream?: boolean;
  /** Quantos sonhos bons já foram colhidos (0..`MAX_GOOD_DREAMS`). */
  goodDreams?: number;
}

export function createNightmareState(): NightmareState {
  return { fought: [] };
}

export interface NightmareOffer {
  /** 0 ou 1. Nunca mais que `NIGHTMARES_PER_NIGHT`. */
  count: number;
  tier: EnemyTier;
  rarity: DreamRarity;
}

export interface NightmareRewards {
  /** Corações restaurados. Nunca acima de `NIGHTMARE_MAX_HEART_CURE`. */
  hearts: number;
  energy: number;
  bits: number;
  /** Reservado. Hoje NUNCA é preenchido — ver `nightmareRewards`. */
  item?: string;
}

// ---------------------------------------------------------------------------
// Chaves de dia
// ---------------------------------------------------------------------------

/**
 * O dayKey do pesadelo de `now` — a MANHÃ, mesma chave que `recordNight` usa
 * em `RestNight.date`. É a única "unidade de tempo" desta mecânica: um dia
 * civil, uma noite, no máximo um pesadelo.
 *
 * ═══ POR QUE A ÂNCORA ═══
 *
 * `toDateString()` é o dia do APARELHO, e o portão de `nightmaresFor` é
 * `rest.nights.find(n => n.date === key)`. Com o `rest` no SAVE, isso furava
 * **na direção de NEGAR**, que é o lado que ninguém percebe e ninguém
 * reclama: o aparelho B não ganhava um pesadelo extra (`NIGHTMARES_PER_NIGHT`
 * é 1 e o portão exige uma noite REGISTRADA) — ele **perdia** o que a noite
 * gravada pelo aparelho A rendeu. A manhã carimbada "Thu Aug 27" simplesmente
 * não existia para quem chamava o mesmo instante de "Wed Aug 26", e a luta da
 * manhã sumia sem gesto nenhum que a recuperasse.
 *
 * Uma recompensa que some sem motivo é pior que um teto furado: não há nada
 * que o jogador possa fazer a respeito, e a mecânica passa a parecer quebrada
 * exatamente para quem cumpriu a regra (dormiu no horário) — o oposto da tese
 * deste arquivo, que é nunca punir sono.
 *
 * A âncora é PARÂMETRO aqui, e só aqui, porque esta função não recebe estado
 * nenhum; todas as que recebem (`nightmaresFor`, `hasPendingNightmare`,
 * `pendingNightmare`) leem `rest.playerDayTz` e não podem esquecer. Quem chama
 * esta de fora — o `App.tsx`, para carimbar `markFought` — passa
 * `rest.playerDayTz`, e há guard de AST travando isso: a chave da ESCRITA e a
 * do PORTÃO têm de bater, senão `markFought` grava um nome que
 * `hasPendingNightmare` nunca reconhece e o modal reabre para sempre.
 */
export function nightmareDayKey(now: Date, anchor?: PlayerDayAnchor): string {
  return playerDayKey(now, anchor);
}

function tierIndex(tier: EnemyTier): number {
  const i = LADDER_TIERS.indexOf(tier);
  return i < 0 ? 0 : i;
}

/** O tier limitado pelo estágio do pet — um rookie nunca encara um mega. */
function capTier(tier: EnemyTier, petStage: string): EnemyTier {
  const cap = STAGE_TIER_CAP[getStageLevel(petStage)];
  return tierIndex(tier) > tierIndex(cap) ? cap : tier;
}

// ---------------------------------------------------------------------------
// 1. Quantos pesadelos, de que tier
// ---------------------------------------------------------------------------

/**
 * O pesadelo da noite de `now`.
 *
 * **Contagem**: 1 se existe uma noite REGISTRADA para esta manhã e ela entrou
 * na janela (`onTime`); 0 caso contrário. Nunca mais que
 * `NIGHTMARES_PER_NIGHT`, e nunca em função de quanto tempo a pessoa dormiu —
 * `sleptAt`/`wokeAt` não são lidos aqui.
 *
 * **Noite sem registro ou fora da janela → `count: 0`, e nada mais acontece.**
 * Não há penalidade, não há dívida, não há número que diminua.
 *
 * **Tier**: sobe com a REGULARIDADE (`dreamRarity`, que já aplica
 * `RARITY_MIN_NIGHTS`/`RARITY_RARE_AT`/`RARITY_LEGENDARY_AT` sobre o `ratio` de
 * `restConstancy`), e é limitado pelo estágio do pet.
 *
 * `petStage` é opcional só para quem quer a leitura crua (UI de prévia); o
 * combate sempre passa o estágio.
 */
export function nightmaresFor(
  rest: RestState,
  now: Date,
  petStage?: string,
): NightmareOffer {
  const rarity = dreamRarity(rest, now);
  const target = RARITY_TIER[rarity] ?? 'baby-ii';
  const tier = petStage ? capTier(target, petStage) : target;

  const key = nightmareDayKey(now, rest?.playerDayTz);
  const night = rest.nights.find((n) => n.date === key);
  const count = night?.onTime ? NIGHTMARES_PER_NIGHT : 0;

  return { count, tier, rarity };
}

/**
 * A razão de regularidade que decide o tier — exposta para a UI explicar de
 * onde veio o pesadelo ("sua regularidade está alta"), nunca como score.
 */
export function nightmareRegularity(rest: RestState, now: Date): number {
  return restConstancy(rest, now).ratio;
}

// ---------------------------------------------------------------------------
// 2. A onda de combate
// ---------------------------------------------------------------------------

/** FNV-1a de 32 bits da chave do dia: a semente do sabor da onda (determinística, sem `Math.random`). */
function hashDayKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h | 0;
}

/**
 * Os slots da onda do pesadelo para o tier `top` (índice 0..5 de `LADDER_TIERS`): `NIGHTMARE_WAVE_SIZE`
 * slots terminando em `top` (`top−1..top`). Um dono só: a onda e a simulação do balanço leem esta função.
 */
export function nightmareSlots(top: number): number[] {
  const size = Math.max(1, Math.min(NIGHTMARE_WAVE_SIZE, top + 1));
  return Array.from({ length: size }, (_, k) => top + 1 - size + k);
}

/**
 * A onda do pesadelo — **delegada a `buildDungeonWave`**.
 *
 * Não existe combate reimplementado aqui: o inimigo (`dungeonFoe`, relativo ao level do jogador), o
 * sprite e a exclusão da linha do próprio jogador são todos da masmorra. Este módulo só decide QUANTOS e
 * ATÉ QUE TIER — o resto é o motor que já existe.
 *
 * Combate v3 (PR4): a onda é SEMPRE do andar 1 (o `max(1, top−1)` de antes levava o TTK a 31 s no top 5);
 * `playerLevel` é o level do Soulmon (`soulLevel`) e `rng` o sorteio do sabor da onda (sem ele, determinístico
 * pelo andar). Nunca `Math.random`. `buildDungeonWave` devolve a escada inteira (6 inimigos, na ordem); a
 * luta do pesadelo pega só a fatia que TERMINA no tier alvo. Sem noite elegível → `[]`.
 */
export function buildNightmareWave(
  rest: RestState,
  petStage: string,
  now: Date,
  playerLevel?: number,
  rng?: () => number,
): DungeonEnemy[] {
  const { count, tier } = nightmaresFor(rest, now, petStage);
  if (count <= 0) return [];

  const top = tierIndex(tier);
  // sem `rng`, a onda é a da NOITE: o mesmo dia sorteia as mesmas criaturas (e dias diferentes, outras)
  const seed = rng ?? mulberry32(hashDayKey(nightmareDayKey(now, rest?.playerDayTz)));
  const lvl = playerLevel ?? soulLevel({ evolutionStage: petStage });
  const wave = buildDungeonWave(1, petStage, seed, lvl);
  const dayHash = hashDayKey(nightmareDayKey(now, rest?.playerDayTz));
  // Os SPRITES são os do pesadelo (as sombras `dino-shadow-*`, não Soulmons comuns), a força é a do Pesadelo.
  return nightmareSlots(top).map((slot) => ({
    ...wave[slot],
    sprite: nightmareShadowSprite(slot, dayHash).src,
    foe: nightmareFoe(lvl, slot),
  }));
}

// ---------------------------------------------------------------------------
// 3. Pendência
// ---------------------------------------------------------------------------

/** Há um pesadelo desta manhã ainda não combatido? */
export function hasPendingNightmare(
  nm: NightmareState,
  rest: RestState,
  now: Date,
): boolean {
  if (nightmaresFor(rest, now).count <= 0) return false;
  return !nm.fought.includes(nightmareDayKey(now, rest?.playerDayTz));
}

/**
 * O dayKey do pesadelo em aberto, ou `null`.
 *
 * Só a manhã de HOJE. **Pesadelo de ontem que não foi combatido expirou — e
 * expirar não custa nada**: não vira dívida, não acumula fila, não gera aviso.
 * Cobrar por não combater transformaria uma recompensa em cobrança, que é
 * exatamente como um bônus vira imposto na cabeça do usuário.
 */
export function pendingNightmare(
  nm: NightmareState,
  rest: RestState,
  now: Date,
): string | null {
  return hasPendingNightmare(nm, rest, now) ? nightmareDayKey(now, rest?.playerDayTz) : null;
}

/**
 * Marca a noite como combatida. **Idempotente** — chamar duas vezes para o
 * mesmo dayKey não duplica nada (a virada e o modal podem rodar 2×, como em
 * `applyMissedDay`). Poda em `MAX_FOUGHT_HISTORY`, mantendo as mais recentes.
 */
export function markFought(nm: NightmareState, dayKey: string): NightmareState {
  const key = String(dayKey ?? '');
  if (!key) return nm;

  const isNew = !nm.fought.includes(key);
  const fought = isNew ? [...nm.fought, key].slice(-MAX_FOUGHT_HISTORY) : nm.fought;

  const out: NightmareState = { ...nm, fought };
  if (nm.pending === key) delete out.pending;
  // O dia de pesadelo conta UMA vez (reabrir/fechar de novo não repete) e só até o ciclo fechar.
  return isNew ? countNightmareDay(out, key) : out;
}

// ---------------------------------------------------------------------------
// 3b. O SONHO BOM — a cada 6 dias de pesadelo (decisão do dono, 15/10/2026)
// ---------------------------------------------------------------------------

/** Dias de pesadelo por ciclo: no 6º fecha o ciclo e o próximo evento é o sonho bom. */
export const NIGHTMARE_CYCLE_DAYS = 6;
/** Honra do sonho bom: o que UMA vitória no Torneio rende (`EMBLEMS_PER_WIN`, travado por teste) — conservador; o dono revisa (REGISTRO). */
export const GOOD_DREAM_HONOR = 3;
/** Teto do contador de sonhos colhidos (higiene do save). */
export const MAX_GOOD_DREAMS = 9999;

/**
 * Conta o dia de pesadelo no ciclo. Idempotente por dayKey. **Sem retroativo:** só conta a partir daqui (um save
 * antigo começa em zero). Com o sonho bom já pendente, não conta mais nada até ele ser colhido.
 */
export function countNightmareDay(nm: NightmareState, dayKey: string): NightmareState {
  const key = String(dayKey ?? '');
  if (!key || nm.goodDream) return nm;
  const days = nm.lurkDays ?? [];
  if (days.includes(key)) return nm;
  const next = [...days, key].slice(0, NIGHTMARE_CYCLE_DAYS);
  return next.length >= NIGHTMARE_CYCLE_DAYS ? { ...nm, lurkDays: next, goodDream: true } : { ...nm, lurkDays: next };
}

/** Há um sonho bom esperando para ser mostrado? */
export const hasPendingGoodDream = (nm: NightmareState | undefined): boolean => nm?.goodDream === true;

/**
 * Colhe o sonho bom: paga `GOOD_DREAM_HONOR` UMA vez e reinicia o ciclo. **Idempotente** — sem sonho pendente (ou
 * numa segunda chamada) devolve o MESMO estado e honra 0, então reabrir o modal ou o StrictMode (updater 2x) não
 * paga duas vezes.
 */
export function claimGoodDream(nm: NightmareState): { state: NightmareState; honor: number } {
  if (!nm.goodDream) return { state: nm, honor: 0 };
  const { goodDream: _g, lurkDays: _l, ...rest } = nm;
  return { state: { ...rest, lurkDays: [], goodDreams: Math.min(MAX_GOOD_DREAMS, (nm.goodDreams ?? 0) + 1) }, honor: GOOD_DREAM_HONOR };
}

/**
 * Forma segura do estado vindo do disco/nuvem. ESPELHO de `functions/api/_nightmares.js` (`sanitizeNightmares`) —
 * um teste de paridade roda os dois sobre as mesmas entradas. Nunca lança; lixo vira o estado vazio.
 */
export function sanitizeNightmareState(raw: unknown): NightmareState {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const strs = (v: unknown, max: number): string[] => (Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64))].slice(-max)
    : []);
  const out: NightmareState = { fought: strs(r.fought, MAX_FOUGHT_HISTORY) };
  if (typeof r.pending === 'string' && r.pending.length > 0 && r.pending.length <= 64) out.pending = r.pending;
  const days = strs(r.lurkDays, NIGHTMARE_CYCLE_DAYS);
  if (days.length) out.lurkDays = days;
  if (r.goodDream === true) out.goodDream = true;
  const n = typeof r.goodDreams === 'number' && Number.isFinite(r.goodDreams) ? Math.min(MAX_GOOD_DREAMS, Math.max(0, Math.floor(r.goodDreams))) : 0;
  if (n > 0) out.goodDreams = n;
  return out;
}

// ---------------------------------------------------------------------------
// 4. Recompensas
// ---------------------------------------------------------------------------

/**
 * O que a luta rende.
 *
 * **Vencer restaura energia e/ou meio coração** — é ASSIM que o sono contribui
 * para a saúde do pet: através do COMBATE, nunca por bônus passivo. A diferença
 * não é cosmética: um bônus passivo por "ter dormido bem" é um score de sono
 * disfarçado, e vira métrica na cabeça do jogador. Passando pelo jogo, o que se
 * ganha é uma partida.
 *
 * **Perder não custa NADA** — zero corações, zero bits, zero energia, nenhuma
 * marca. É a mesma regra da Masmorra: o jogo nunca cobra da barra que
 * representa o cuidado que o usuário teve consigo mesmo.
 *
 * `item` fica reservado e hoje NUNCA é preenchido: o único item de cura do jogo
 * é o Coraçãozinho (+1 HP), e entregá-lo aqui furaria o teto de
 * `NIGHTMARE_MAX_HEART_CURE` por uma porta lateral.
 */
export function nightmareRewards(rarity: DreamRarity, won: boolean): NightmareRewards {
  if (!won) return { hearts: 0, energy: 0, bits: 0 };

  const base = REWARD_TABLE[rarity] ?? REWARD_TABLE.common;
  return {
    hearts: Math.min(NIGHTMARE_MAX_HEART_CURE, base.hearts),
    energy: base.energy,
    bits: base.bits,
  };
}

// ---------------------------------------------------------------------------
// 5. Textos (EN + PT-BR, sempre os dois)
// ---------------------------------------------------------------------------

const NAMES: Record<DreamRarity, { en: string; pt: string }> = {
  common: { en: 'Grumpy Little Cloud', pt: 'Nuvenzinha Rabugenta' },
  rare: { en: 'Tangled Blanket Beast', pt: 'Bicho-Cobertor Embolado' },
  legendary: { en: 'The Big Sleepy Shadow', pt: 'A Sombra Soneca' },
};

const FLAVOR: Record<DreamRarity, { en: string; pt: string }> = {
  common: {
    en: 'A tiny grey cloud tried to rain on your rest. Your Soulmon puffed it away.',
    pt: 'Uma nuvenzinha cinza tentou chover no seu descanso. Seu Soulmon soprou ela pra longe.',
  },
  rare: {
    en: 'The blankets got all tangled up and grew paws. Your Soulmon untangled the night.',
    pt: 'Os cobertores se embolaram e ganharam patinhas. Seu Soulmon desembolou a noite.',
  },
  legendary: {
    en: 'A big soft shadow leaned over your sleep — and your Soulmon stood right in front of it.',
    pt: 'Uma sombra grande e macia se debruçou sobre o seu sono — e seu Soulmon ficou bem na frente dela.',
  },
};

/**
 * Nome do pesadelo. **Fofo, nunca assustador.** O pesadelo é o adversário que
 * o SOULMON enfrenta enquanto defende o descanso do dono, não uma ameaça ao
 * jogador — um app que produz medo perto da hora de dormir é o oposto exato do
 * que esta mecânica existe para fazer.
 */
export function nightmareName(rarity: DreamRarity, language: string): string {
  const n = NAMES[rarity] ?? NAMES.common;
  return language === 'pt-BR' ? n.pt : n.en;
}

/** Descrição do pesadelo, no mesmo tom encorajador. EN + PT-BR. */
export function nightmareFlavor(rarity: DreamRarity, language: string): string {
  const f = FLAVOR[rarity] ?? FLAVOR.common;
  return language === 'pt-BR' ? f.pt : f.en;
}

// ---------------------------------------------------------------------------
// 6. A REGRA DE VITÓRIA (decisão do dono, 15/10/2026)
// ---------------------------------------------------------------------------
//
// É uma batalha comum, mas DIFÍCIL: zerar o HP do pesadelo NÃO basta. Ele só é EXTINTO se o jogador
//   (a) TORCEU (cheer) — ao menos `NIGHTMARE_MIN_CHEERS` descarga da torcida entrou na luta; e
//   (b) ACERTOU os ESPECIAIS pelo menos PARCIALMENTE — `bom` ou `ótimo` no anel (`ruim` não conta como acerto) em
//       ao menos METADE dos especiais lançados (`NIGHTMARE_SPECIAL_SHARE`), mínimo 1.
// Sem isso o pesadelo "resiste e volta" mesmo com o HP no chão e a noite termina em DESVANECER (sem prêmio, sem
// custo — perder aqui nunca custa nada). Determinístico: depende só do que aconteceu na luta (descargas, notas do
// anel), nunca de sorteio. Justo: as duas condições aparecem na tela durante a luta e dá tempo de cumpri-las (a luta
// dura ~20 s; uma descarga leva 24 toques e o especial do pet sai sempre ao menos 1 vez — medido em 40 sementes).

/** Descargas de torcida mínimas para o pesadelo poder ser extinto. */
export const NIGHTMARE_MIN_CHEERS = 1;
/** Fração dos especiais lançados que precisa acertar (parcial ou melhor). Valor conservador; o dono revisa. */
export const NIGHTMARE_SPECIAL_SHARE = 0.5;

/** O que aconteceu na luta e a regra lê. */
export interface NightmareTally {
  /** Descargas de torcida que o núcleo recolheu. */
  cheers: number;
  /** Especiais que o Soulmon lançou. */
  casts: number;
  /** Quantos desses acertaram ao menos parcialmente (`bom`/`ótimo`). */
  landed: number;
}

export const EMPTY_TALLY: NightmareTally = { cheers: 0, casts: 0, landed: 0 };

/** O anel acertou? `ruim` é erro; `bom` é acerto parcial; `ótimo` é cheio. */
export const specialLanded = (grade: RingGrade | null | undefined): boolean => grade === 'bom' || grade === 'otimo';

/** Quantos especiais precisam acertar para `casts` lançados: metade (arredondada para cima), mínimo 1. */
export const specialsNeeded = (casts: number): number => Math.max(1, Math.ceil(Math.max(0, casts) * NIGHTMARE_SPECIAL_SHARE));

/** As duas condições (a luta já zerou o HP do pesadelo). */
export function nightmareConditions(t: NightmareTally): { cheer: boolean; special: boolean } {
  return {
    cheer: t.cheers >= NIGHTMARE_MIN_CHEERS,
    special: t.casts >= 1 && t.landed >= specialsNeeded(t.casts),
  };
}

export type NightmareVerdict = 'extinct' | 'faded';

/** `winner` é o do núcleo ('player' = o HP do pesadelo chegou a zero). Só 'player' com as DUAS condições extingue. */
export function nightmareVerdict(winner: string, t: NightmareTally): NightmareVerdict {
  if (winner !== 'player') return 'faded';
  const c = nightmareConditions(t);
  return c.cheer && c.special ? 'extinct' : 'faded';
}

/** O texto de fim (frases do dono, 15/10/2026). */
export const NIGHTMARE_END_TEXT: Record<NightmareVerdict, { pt: string; en: string }> = {
  faded: { pt: 'O pesadelo desvaneceu, mas continua à espreita.', en: 'The nightmare faded, but it still lurks.' },
  extinct: {
    pt: 'As sombras se dissipam, o pesadelo foi extinto e dá espaço para os sonhos.',
    en: 'The shadows disperse, the nightmare is extinguished and makes room for dreams.',
  },
};

export const nightmareEndText = (v: NightmareVerdict, language: string): string => (language === 'pt-BR' ? NIGHTMARE_END_TEXT[v].pt : NIGHTMARE_END_TEXT[v].en);
