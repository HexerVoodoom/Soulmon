import { CHIP_BOOST, HEART_HEAL, SPARK_HOME_ENERGY, SPECIAL_ITEMS, type Attr } from './shop';
import { potionElementOfKey } from './elementPotion';
import { dishIdOfKey, serveDish } from './dishItems';
import { dishById } from './restaurantMenu';
import type { RestaurantState } from './restaurantState';
import { getNextEvolution } from './dailyReset';
import { resetAlignmentPoints } from './betaResetGrant';
import { glitchtamaBuffAtivo } from './glitchtamaBuff';
import { playerDayIso, type PlayerDayAnchor } from './playerDay';
import { HUNGER_PER_PREMIUM, HUNGER_PREMIUM_REFUSE_AT, eat, hungerAt, maxEnergyOf, setEnergy, settleEnergy, type EnergyClock, type HungerRecord } from './hunger';
import {
  PREMIUM_USES_PER_DAY, premiumUsedToday, premiumDroppedToday, premiumDroppedThisWeek,
  weekMondayOf, type PremiumRecord,
} from './premiumFood';

/**
 * O USO de um item especial da pastinha — glitchtama, coraçãozinho, chip.
 *
 * ⚠️ Por que este arquivo existe, e por que NÃO é o `careUpdaters.ts`.
 *
 * O ramo de `SPECIAL_ITEMS` do `handleFeed` carregava **três updaters inline
 * com regra de verdade dentro**: o decremento do inventário (repetido três
 * vezes, palavra por palavra), o `HEART_HEAL`, o `CHIP_BOOST` e o `+1` de
 * `perfectDays`. Regra dentro de updater inline é regra sem teste: nada em
 * `src/utils/*.test.ts` conseguia alcançá-la sem montar o `App.tsx` em jsdom.
 *
 * Não foi para o `careUpdaters.ts` de propósito. Aquele arquivo é dos GESTOS DE
 * CUIDADO COMUNS — carinho e comida —, e a coisa que ele existe para guardar é
 * o TETO (`careCaps`: janela de comida por hora, carinho por dia). Item especial
 * não tem teto nenhum: o próprio `careRules.ts` declara isso por escrito no
 * cabeçalho de `feedFood` ("Itens especiais da loja NÃO passam por aqui: eles
 * têm efeitos próprios e não contam no limite"). Enfiá-los ali reabriria a
 * pergunta "isso conta no teto?" em cima do arquivo cuja razão de ser é
 * responder que sim.
 *
 * Também não foi para o `shop.ts`: aquilo é CATÁLOGO — o que existe, quanto
 * custa, como se chama. Aqui é o que ACONTECE ao usar. Este arquivo consome o
 * catálogo (`SPECIAL_ITEMS`, `CHIP_BOOST`, `HEART_HEAL`) e não o redefine, para
 * os números continuarem tendo um dono só.
 *
 * ⚠️ PROGRESSÃO: `perfectDays`, `totalPerfectDays` e o `CHIP_BOOST` alimentam
 * evolução, que alimenta a árvore e o teto de geração de sprite. Esta extração
 * é aritmeticamente idêntica ao que estava inline — há teste travando cada
 * número (`specialItemUse.test.ts`).
 *
 * O que fica no `App.tsx`: só os efeitos (som por tipo de item, animação de
 * comer, toast do glitchtama) e a decisão de recusar, que dispara sinal na UI e
 * por isso não pode morar dentro de um updater — efeito colateral em updater
 * roda 2× no StrictMode.
 */

export type SpecialRefusal = 'no-stock' | 'already-full' | 'daily-cap' | 'weekly-cap' | 'stage-cap' | 'nothing-to-reduce' | 'no-next-evolution';

/**
 * D-97 (19/10/2026): no máximo 3 chips por ESTÁGIO de evolução, TODOS os tipos
 * somados (comum, maior, prisma, triplo). Do 4º em diante o Soulmon recusa e o
 * chip volta intacto à pastinha — sem punição, e vale no próximo estágio.
 *
 * A contagem mora em `chipsStage` ({ stage, used }). Ela vale só para o
 * `evolutionStage` gravado nela: ao evoluir, o estágio muda e o registro velho
 * deixa de valer sozinho; renascer/degenerar (que podem repetir o estágio)
 * zeram o campo explicitamente no `App.tsx`.
 */
export const CHIPS_PER_STAGE = 3;
export interface ChipStageUse { stage: string; used: number }

/** Migração/sanitização do campo do save (idempotente). Ausente ou lixo → `undefined` (0 usados):
 *  o save antigo não registra uso de chip, então ninguém é bloqueado por dado que não existe. */
export function sanitizeChipsStage(v: unknown): ChipStageUse | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const c = v as { stage?: unknown; used?: unknown };
  if (typeof c.stage !== 'string' || !c.stage) return undefined;
  const used = typeof c.used === 'number' && Number.isFinite(c.used) ? Math.max(0, Math.floor(c.used)) : 0;
  return { stage: c.stage, used };
}

export function chipsUsedThisStage(state: { evolutionStage?: string; chipsStage?: ChipStageUse }): number {
  const reg = state.chipsStage;
  return reg && reg.stage === (state.evolutionStage ?? 'rookie') ? Math.max(0, reg.used) : 0;
}

/**
 * Chips de REDUÇÃO (dono, 04/11/2026): limite PRÓPRIO de 3 por estágio, que NÃO soma com o dos
 * chips que aumentam — dá para usar 3 que somam e 3 que reduzem no mesmo estágio. Mesmo molde
 * de `chipsStage` (registro `chipsReduceStage`, vale só para o estágio gravado nele).
 */
export const REDUCE_CHIPS_PER_STAGE = 3;
export function reduceChipsUsedThisStage(state: { evolutionStage?: string; chipsReduceStage?: ChipStageUse }): number {
  const reg = state.chipsReduceStage;
  return reg && reg.stage === (state.evolutionStage ?? 'rookie') ? Math.max(0, reg.used) : 0;
}

/**
 * 🌀 Glitchtama (design de 10/11/2026): 1 uso por SEMANA, que concede um buff de +10% nos pontos de progressão por 7 dias.
 * Regra, cooldown e aplicação do buff em `utils/glitchtamaBuff.ts` + `dailyReset.ts`. O registro é um timestamp no SAVE
 * (`glitchtamaUsadoEm`), nunca no localStorage — um teto que se fura trocando de aparelho não é um teto.
 */

/** Fatia do GameState que o uso de item especial lê e escreve. */
export interface SpecialItemState {
  healthPoints: number;
  maxHealthPoints: number;
  foodInventory: Record<string, number>;
  perfectDays: number;
  /** 🧬 Gauge de evolução (`utils/evolutionGauge.ts`). */
  evolutionPoints?: number;
  totalPerfectDays?: number;
  /** Dias completos vitalícios PARA AS MISSÕES — real + 🌀 (decisão #41/#60). */
  missionPerfectDays?: number;
  powerPoints: number;
  harmonyPoints: number;
  benevolencePoints: number;
  totalXP: number;
  attributesSinceLastEvolution: { power: number; harmony: number; benevolence: number };
  /** 🌀 Instante (ms) do último uso do Glitchtama: buff de +10% e cooldown de 7 dias a partir dele (`utils/glitchtamaBuff.ts`). */
  glitchtamaUsadoEm?: number;
  /** Comida premium: fome/relógio da energia (`utils/hunger.ts`) + registro de tetos. A comida NÃO dá energia direto (REGISTRO §40). */
  energyPoints?: number;
  evolutionStage?: string;
  /** Evoluções destravadas: o mega só mira o Ultra com as três megas (`canReachUltra`). */
  unlockedEvolutions?: readonly string[];
  hunger?: HungerRecord;
  energyClock?: EnergyClock;
  premiumFood?: PremiumRecord;
  /** Chips usados no estágio atual (D-97) — ver `CHIPS_PER_STAGE`. */
  chipsStage?: ChipStageUse;
  /** Chips de REDUÇÃO usados no estágio atual — contador separado (`REDUCE_CHIPS_PER_STAGE`). */
  chipsReduceStage?: ChipStageUse;
  /** 🧪 Elemento da poção dada ao Soulmon, pendente para a próxima evolução (`utils/elementPotion.ts`). */
  evolutionPotion?: string;
  playerDayTz?: PlayerDayAnchor;
  /** 🍽️ Buff de prato (`restaurantState`): `serveDish` grava aqui ao usar um prato de combate/regeneração. */
  restaurant?: RestaurantState;
}

function pointsOf(state: SpecialItemState, a: Attr): number {
  return a === 'power' ? state.powerPoints : a === 'harmony' ? state.harmonyPoints : state.benevolencePoints;
}

/**
 * O uso seria recusado? Separado de `applySpecialItem` pelo mesmo motivo de
 * `rubDecision`: a recusa acende sinal na UI (o coração cheio pisca o
 * `healCapSignal`), e efeito colateral não entra em updater.
 *
 * O `petPassive` não entra aqui de propósito: nenhum traço mexe em item
 * especial hoje. Se um dia mexer, ele vem do ESTADO, como em `rubDecision`.
 */
export function specialRefusal(state: SpecialItemState, emoji: string, now: Date): SpecialRefusal | undefined {
  const special = SPECIAL_ITEMS[emoji];
  if (!special) return undefined;
  if ((state.foodInventory[emoji] ?? 0) <= 0) return 'no-stock';
  // O cooldown semanal do Glitchtama recusa ANTES do decremento: o item volta para a
  // pastinha intacto e vale quando a semana passar. Recusar depois de consumir seria a família
  // de bug do X-6 ao contrário — gastar para não receber nada.
  // Faísca de Alma: restaura a energia da Home; com ela cheia recusa e o item volta intacto.
  if (special.kind === 'spark' && settleEnergy({ ...state, energyPoints: state.energyPoints ?? 0 }, now.getTime()).energyPoints >= maxEnergyOf(state)) return 'already-full';
  if (special.kind === 'glitchtama' && glitchtamaBuffAtivo(state.glitchtamaUsadoEm, now.getTime())) return 'weekly-cap';
  // Comida premium: fome quase cheia recusa (o item volta, não se queima à toa), e há 1 uso por dia.
  if (special.kind === 'premium') {
    if (premiumUsedToday(state, now) >= PREMIUM_USES_PER_DAY) return 'daily-cap';
    if (hungerAt(state.hunger, now.getTime()) >= HUNGER_PREMIUM_REFUSE_AT) return 'already-full';
  }
  // D-97: limite de chips por estágio. Recusa ANTES do decremento: o chip volta intacto.
  if (special.kind === 'chip' && special.reduce) {
    if (reduceChipsUsedThisStage(state) >= REDUCE_CHIPS_PER_STAGE) return 'stage-cap';
    // Tipo já em 0: não há o que tirar — recusa e o chip volta intacto (não se queima à toa).
    if (special.attr && pointsOf(state, special.attr) <= 0) return 'nothing-to-reduce';
  } else if (special.kind === 'chip' && chipsUsedThisStage(state) >= CHIPS_PER_STAGE) return 'stage-cap';
  // Poção de Elemento só vale para a PRÓXIMA evolução: no ápice (sem destino) ela seria consumida à toa — recusa e o item volta intacto.
  // O galho não muda se existe destino, então 'harmony' serve de neutro; a regra mora em `getNextEvolution`/`canReachUltra`.
  if (special.kind === 'potion') {
    const stage = state.evolutionStage ?? 'rookie';
    if (getNextEvolution(stage, 'harmony', [...(state.unlockedEvolutions ?? [])]) === stage) return 'no-next-evolution';
  }
  // Só o coraçãozinho recusa por estado: ele é a única cura comprável, e gastar
  // um com a vida cheia queimaria o item por nada.
  if (special.kind === 'heart' && state.healthPoints >= state.maxHealthPoints) return 'already-full';
  return undefined;
}

/**
 * Um item especial usado sobre o `prev`.
 *
 * ⚠️ A recusa é RECONFERIDA aqui, sobre o `prev` — a checagem de fora existe só
 * pelo sinal na UI. É a família de bug do X-6, e ela ESTAVA presente no
 * coraçãozinho: a recusa de vida cheia só era lida do `gameState` de fora, e o
 * updater inline se limitava a clampar a cura com `Math.min`. Dois toques no
 * mesmo lote do React com 4/5 de vida liam o mesmo `gameState` (4 < 5, passa
 * duas vezes), e a segunda passada decrementava o inventário para curar ZERO —
 * um coraçãozinho queimado em silêncio. Aqui a segunda passada já enxerga a
 * vida cheia que a primeira escreveu e devolve `prev` intacto.
 *
 * O estoque também vem do `prev`, e não de fora, pelo mesmo motivo: com UM item
 * no inventário, dois toques no mesmo lote passariam os dois pela checagem
 * externa.
 */
export function applySpecialItem<T extends SpecialItemState>(
  prev: T,
  emoji: string,
  now: Date,
): { state: T; refused?: SpecialRefusal } {
  const special = SPECIAL_ITEMS[emoji];
  if (!special) return { state: prev };

  const refused = specialRefusal(prev, emoji, now);
  if (refused) return { state: prev, refused };

  // Decremento do inventário — era esta a linha copiada três vezes inline.
  const count = prev.foodInventory[emoji] ?? 0;
  const foodInventory = { ...prev.foodInventory, [emoji]: count - 1 };
  if (foodInventory[emoji] === 0) delete foodInventory[emoji];

  if (special.kind === 'glitchtama') {
    // 🌀 Glitchtama (design de 10/11/2026): NÃO mexe em pontos, dias perfeitos nem barra — só liga o BUFF de +10% na progressão por 7 dias
    // e grava o instante no MESMO retorno que consome o item (um lote do React com dois toques não passa duas vezes: a segunda
    // passada já vê o buff e recusa). Antes: enchia a barra e dava +1 dia perfeito (revogado pelo dono). Quem credita o +10%
    // é a virada (`dailyReset`), sobre o ganho de cada dia.
    return { state: { ...prev, foodInventory, glitchtamaUsadoEm: now.getTime() } };
  }

  if (special.kind === 'premium') {
    // Enche a FOME (`HUNGER_PER_PREMIUM`), não a energia (beta-2 3.5): era +5 de energia. Não dá atributo nem XP (a comida comum dá).
    const day = playerDayIso(now, prev.playerDayTz);
    return {
      state: {
        ...eat({ ...prev, energyPoints: prev.energyPoints ?? 0 }, now.getTime(), HUNGER_PER_PREMIUM),
        foodInventory,
        premiumFood: {
          day,
          dropped: premiumDroppedToday(prev, now),
          used: premiumUsedToday(prev, now) + 1,
          week: weekMondayOf(day),
          weekDropped: premiumDroppedThisWeek(prev, now),
        },
      },
    };
  }

  if (special.kind === 'dish') {
    // 🍽️ Prato do Restaurante (16/11/2026): fome cheia + o efeito do prato, pela regra única `serveDish`. Prato desconhecido (id fora do
    // cardápio) não chega aqui: `specialRefusal` já o trata como sem catálogo (`SPECIAL_ITEMS` só tem os do cardápio).
    const d = dishById(dishIdOfKey(emoji) ?? '');
    if (!d) return { state: prev };
    return { state: { ...serveDish({ ...prev, energyPoints: prev.energyPoints ?? 0 }, d, now.getTime()), foodInventory } };
  }

  if (special.kind === 'spark') {
    // Energia da Home (a da comida/Masmorra), pelo ÚNICO caminho que mexe nela: `setEnergy` acerta a regeneração e reposiciona o relógio.
    return { state: { ...setEnergy({ ...prev, energyPoints: prev.energyPoints ?? 0 }, now.getTime(), (cur) => cur + SPARK_HOME_ENERGY), foodInventory } };
  }
  if (special.kind === 'potion') {
    // Poção de Elemento: grava o elemento pendente (sobrescreve a anterior; a anterior se perde de propósito, spec do dono).
    return { state: { ...prev, foodInventory, evolutionPotion: potionElementOfKey(emoji) } };
  }

  if (special.kind === 'reset') {
    // 🔄 Zerador (`utils/betaResetGrant.ts`): só os 3 pontos. Elemento, forma, poção e o log do estágio ficam.
    return { state: { ...resetAlignmentPoints(prev), foodInventory } };
  }

  if (special.kind === 'heart') {
    // A única cura comprável. O `Math.min` continua aqui como segunda trava,
    // mas quem barra o desperdício agora é a recusa acima.
    return {
      state: {
        ...prev,
        foodInventory,
        healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + HEART_HEAL),
      },
    };
  }

  // Chip (combate v3, PR6): só PONTOS DE TIPO — inclinam o caminho (e a
  // distribuição na evolução). Não dão XP, nível, energia nem total de combate:
  // o total de pontos é o level (`soulXP.statPoints`) e `soulWeights` só
  // normaliza estes pontos em fatias entre 15% e 45%.
  // Chip: sem energia. Os três atributos são escritos por extenso
  // em vez de por chave computada porque a chave computada obriga o retorno a
  // largar o tipo do estado — e era exatamente disso que o updater inline vivia.
  const boost = (a: Attr) => special.boosts?.[a] ?? (special.attr === a ? CHIP_BOOST : 0);
  const since = prev.attributesSinceLastEvolution;
  if (special.reduce) {
    // Redução: clamp em 0 nos pontos totais e nos do estágio (nunca negativos).
    const cut = (v: number | undefined, a: Attr) => Math.max(0, (v ?? 0) + boost(a));
    return {
      state: {
        ...prev,
        foodInventory,
        chipsReduceStage: { stage: prev.evolutionStage ?? 'rookie', used: reduceChipsUsedThisStage(prev) + 1 },
        powerPoints: cut(prev.powerPoints, 'power'),
        harmonyPoints: cut(prev.harmonyPoints, 'harmony'),
        benevolencePoints: cut(prev.benevolencePoints, 'benevolence'),
        attributesSinceLastEvolution: {
          power: cut(since?.power, 'power'),
          harmony: cut(since?.harmony, 'harmony'),
          benevolence: cut(since?.benevolence, 'benevolence'),
        },
      },
    };
  }
  return {
    state: {
      ...prev,
      foodInventory,
      chipsStage: { stage: prev.evolutionStage ?? 'rookie', used: chipsUsedThisStage(prev) + 1 },
      powerPoints: prev.powerPoints + boost('power'),
      harmonyPoints: prev.harmonyPoints + boost('harmony'),
      benevolencePoints: prev.benevolencePoints + boost('benevolence'),
      attributesSinceLastEvolution: {
        power: (since?.power ?? 0) + boost('power'),
        harmony: (since?.harmony ?? 0) + boost('harmony'),
        benevolence: (since?.benevolence ?? 0) + boost('benevolence'),
      },
    },
  };
}
