import type { ActivityCategory } from '../types/attributes';
import { isDemoMode } from './demoMode';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { getMaxEnergyForStage, MAX_STAGE_REQUIREMENT } from '../types/progression';
import { GULOSO_BONUS_ATTR, hasPassive, rubDailyCap } from './passives';
import { isHaunted as isHauntedTask } from './taskTriage';
import type { TaskStatus } from '../types/taskModel';

// Regras de cuidado como funções PURAS.
//
// Por que existe: o app de desktop (desktop/) precisa aplicar exatamente as
// mesmas regras que o app do celular. Enquanto elas viviam dentro do App.tsx,
// misturadas com som, animação e toast, a única saída do desktop era
// reimplementá-las — e duas implementações da mesma regra divergem em silêncio.
// Aqui elas recebem estado e devolvem estado, sem tocar em React nem em
// localStorage; quem chama cuida dos efeitos colaterais e da persistência.
//
// As regras em si continuam sendo as do CLAUDE.md (teto de comidas/hora derivado
// do maior requisito da escada — hoje 6 —, carinho cura
// meio coração até 1/dia). Este arquivo NÃO decide nada novo — só é o lugar
// onde a decisão passou a morar uma vez só.

/** Fatia do GameState que estas regras leem e escrevem. */
export interface CareState {
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
  evolutionStage: string;
  foodInventory: Record<string, number>;
  powerPoints: number;
  harmonyPoints: number;
  benevolencePoints: number;
  totalXP: number;
  attributesSinceLastEvolution: { power: number; harmony: number; benevolence: number };
  /** Traço de nascimento (utils/passives.ts). Fica no ESTADO, e não num
   *  parâmetro novo, para o app de desktop herdar o efeito sem uma segunda
   *  implementação — é o mesmo motivo pelo qual este arquivo existe. */
  petPassive?: string;
  /** Demo local (`utils/demoMode.ts`): comer não rende XP de Vínculo. */
  demoLocal?: boolean;
}

/**
 * Máximo de comidas por hora (janela deslizante).
 *
 * DERIVADO do maior requisito diário da escada (`MAX_STAGE_REQUIREMENT`), e não
 * um literal, porque o limite de ritmo NUNCA pode ficar abaixo do que o jogo
 * pede num dia: comida se ganha concluindo tarefa, energia só enche comendo e
 * energia cheia é condição do dia perfeito. Com o literal `5` e mega/ultra
 * pedindo 6, o jogador que fechava as 6 tarefas numa sessão só (o padrão de
 * quem trabalha) dava 5 comidas, batia no teto e **perdia o dia perfeito tendo
 * feito 100% da própria meta** — punido por ritmo, não por esforço.
 *
 * O limite continua existindo e continua barrando farm de atributo: ele só
 * deixou de barrar o próprio dia do jogador. Se a escada mudar, este número
 * acompanha sozinho (guard em `careRules.test.ts`).
 */
export const FOOD_LIMIT_PER_HOUR = MAX_STAGE_REQUIREMENT;
const HOUR_MS = 60 * 60 * 1000;

/** Cura do carinho por gesto, e o teto diário. */
export const RUB_HEAL_STEP = 0.5;
export const RUB_HEAL_DAILY_CAP = 1;

export type FeedRefusal = 'no-stock' | 'hourly-limit';
export type RubRefusal = 'already-full' | 'daily-cap';

/** Timestamps (ms) das comidas dentro da janela de 1h. */
export function recentFeeds(feedTimes: number[], now: number): number[] {
  return feedTimes.filter(t => now - t < HOUR_MS);
}

export function feedsLeft(feedTimes: number[], now: number): number {
  return Math.max(0, FOOD_LIMIT_PER_HOUR - recentFeeds(feedTimes, now).length);
}

/**
 * Alimenta com uma comida COMUM (as do `FOOD_BY_CATEGORY`).
 *
 * Itens especiais da loja (chip, coraçãozinho, glitchtama) NÃO passam por aqui:
 * eles têm efeitos próprios e não contam no limite de 5/hora — quem trata é o
 * `handleFeed` do App.
 */
export function feedFood<T extends CareState>(
  state: T,
  foodEmoji: string,
  feedTimes: number[],
  now: number,
): { state: T; feedTimes: number[]; refused?: FeedRefusal } {
  const count = state.foodInventory[foodEmoji] ?? 0;
  if (count <= 0) return { state, feedTimes, refused: 'no-stock' };

  const recent = recentFeeds(feedTimes, now);
  if (recent.length >= FOOD_LIMIT_PER_HOUR) {
    // Importante: devolve `recent` (já podado) mesmo recusando, senão os
    // timestamps velhos ficariam acumulando para sempre.
    return { state, feedTimes: recent, refused: 'hourly-limit' };
  }

  const foodInventory = { ...state.foodInventory, [foodEmoji]: count - 1 };
  if (foodInventory[foodEmoji] === 0) delete foodInventory[foodEmoji];

  const foodDef = Object.values(FOOD_BY_CATEGORY).find(f => f.emoji === foodEmoji);
  const base = foodDef
    ? CATEGORY_ATTRIBUTES[foodDef.category]
    : { power: 0, harmony: 0, benevolence: 0 };

  // Guloso: cada refeição rende um ponto a mais, no atributo que a comida já
  // favorece (empate vai pro dado, que é o meio-termo da árvore).
  const attrs = { ...base };
  if (hasPassive(state.petPassive, 'guloso') && foodDef) {
    const top = Math.max(base.power, base.harmony, base.benevolence);
    if (base.power === top) attrs.power += GULOSO_BONUS_ATTR;
    else if (base.harmony === top) attrs.harmony += GULOSO_BONUS_ATTR;
    else attrs.benevolence += GULOSO_BONUS_ATTR;
  }

  return {
    feedTimes: [...recent, now],
    state: {
      ...state,
      // A energia só enche comendo, limitada pelas barras do estágio.
      energyPoints: Math.min(getMaxEnergyForStage(state.evolutionStage), (state.energyPoints ?? 0) + 1),
      foodInventory,
      powerPoints: state.powerPoints + attrs.power,
      harmonyPoints: state.harmonyPoints + attrs.harmony,
      benevolencePoints: state.benevolencePoints + attrs.benevolence,
      // DEMO LOCAL: o nível fica fixo — comer rende atributo, não XP de Vínculo.
      totalXP: isDemoMode(state) ? state.totalXP : state.totalXP + (attrs.power + attrs.harmony + attrs.benevolence) * 10,
      attributesSinceLastEvolution: {
        power: (state.attributesSinceLastEvolution?.power ?? 0) + attrs.power,
        harmony: (state.attributesSinceLastEvolution?.harmony ?? 0) + attrs.harmony,
        benevolence: (state.attributesSinceLastEvolution?.benevolence ?? 0) + attrs.benevolence,
      },
    },
  };
}

/** Registro do carinho do dia — `date` no formato de `new Date().toDateString()`. */
export interface RubHealRecord {
  date: string;
  healed: number;
}

/**
 * O registro que vale para HOJE — **ordem-consciente**, não igualdade cega.
 *
 * ⚠️ Achado **X-4** do gate da fatia 2. Enquanto este registro morava no
 * `localStorage`, igualdade bastava: um `date` que não fosse o de hoje só podia
 * ser de ontem. A fatia 2 mudou a premissa ao mover o campo para o SAVE, e um
 * mesmo save passou a ser lido por aparelhos em fusos diferentes — que discordam
 * do NOME do dia durante `|offsetA − offsetB|` horas por dia.
 *
 * Com igualdade, o furo não era "um coração a mais": era ILIMITADO. O aparelho
 * A (UTC−3, 23:00 de 26/ago) gasta o teto e grava "Wed Aug 26"; o aparelho B
 * (UTC+9, MESMO INSTANTE, 11:00 de 27/ago) lê "Thu Aug 27" ≠ e zera; de volta em
 * A, "Wed Aug 26" ≠ "Thu Aug 27" e zera de novo. Cada troca invalidava o
 * registro do outro, para sempre.
 *
 * A correção é estreita de propósito: só um dia **estritamente anterior** zera.
 * Um registro de hoje ou de um dia à frente (o aparelho adiantado) continua
 * valendo — é teto já gasto, não teto a devolver.
 *
 * O que isto deliberadamente NÃO faz: mudar `dayKeyOf`. A chave de dia é a mesma
 * do motor de hábitos, de `perfectDays`, da streak e do gatilho de virada em
 * `useDailyReset.ts:57` — redefini-la dispararia uma virada espúria em todo save
 * existente. Sobra um resíduo conhecido: o aparelho à frente ainda ganha o teto
 * do dia dele mais cedo, no máximo uma vez por dia civil. **Esse resíduo foi
 * fechado uma camada acima**, e não aqui: `utils/playerDay.ts` é o "dia do
 * jogador" em fuso FIXO gravado no save (`playerDayTz`), e quem chama esta
 * função hoje lhe entrega uma `todayKey` já produzida por `playerDayKey`. Com
 * os dois aparelhos concordando sobre QUAL DIA É, o pingue-pongue não tem mais
 * de onde nascer — e a ordem estrita abaixo continua de pé como a segunda
 * trava, para o intervalo em que um save antigo ainda carrega a chave do
 * aparelho. `lastCheckInDate`, `moodLog` e `poopDrainCharge` tinham o mesmo
 * defeito e **já receberam a mesma solução**, junto com `playLog`, as noites do
 * descanso e o pesadelo (a lista viva está no cabeçalho de `playerDay.ts`, e o
 * guard de fiação em `playerDay.contract.test.ts`).
 *
 * `Date.parse` sobre `toDateString()` é estável (formato fixo do JS, não
 * dependente de locale) e devolve meia-noite local — comparar duas dessas
 * compara dias, não horas.
 */
export function rubHealRecordFor(record: RubHealRecord | null, todayKey: string): RubHealRecord {
  if (!record) return { date: todayKey, healed: 0 };
  if (record.date === todayKey) return record;
  const gravado = Date.parse(record.date);
  const hoje = Date.parse(todayKey);
  // Data ilegível (save adulterado ou formato antigo): mantém o gasto, mas adota
  // a chave de hoje, para o registro se normalizar sozinho na próxima virada em
  // vez de ficar ilegível para sempre.
  if (Number.isNaN(gravado) || Number.isNaN(hoje)) return { date: todayKey, healed: record.healed };
  // Dia à frente: devolve o registro INTACTO, com a data dele. Reescrever a data
  // para o `todayKey` (mais antigo) faria o registro ANDAR PARA TRÁS quando o
  // chamador o gravasse de volta no save — e o aparelho adiantado zeraria de
  // novo na leitura seguinte, ressuscitando o pingue-pongue pelo caminho da
  // escrita. Medido: sem isto, 5 repiques alternados devolviam o teto 2x.
  if (gravado > hoje) return record;
  return { date: todayKey, healed: 0 };
}

/**
 * O carinho seria recusado? Separado de `rubHeal` porque quem chama precisa
 * decidir a recusa ANTES de entrar num updater de estado (recusa dispara fala
 * e animação, e efeito colateral dentro de updater roda 2× no StrictMode).
 */
export function rubRefusal(
  healthPoints: number,
  maxHealthPoints: number,
  record: RubHealRecord | null,
  todayKey: string,
  petPassive?: string,
): RubRefusal | undefined {
  if (healthPoints >= maxHealthPoints) return 'already-full';
  const cap = rubDailyCap(petPassive, RUB_HEAL_DAILY_CAP);
  if (rubHealRecordFor(record, todayKey).healed >= cap) return 'daily-cap';
  return undefined;
}

/**
 * Carinho: cura meio coração, no máximo 1 coração por dia.
 *
 * A animação toca sempre (é o App que decide isso) — aqui só entra a cura.
 */
export function rubHeal<T extends CareState>(
  state: T,
  record: RubHealRecord | null,
  todayKey: string,
): { state: T; record: RubHealRecord; refused?: RubRefusal } {
  const today = rubHealRecordFor(record, todayKey);
  const refused = rubRefusal(state.healthPoints, state.maxHealthPoints, today, todayKey, state.petPassive);
  if (refused) return { state, record: today, refused };
  return {
    record: { date: todayKey, healed: today.healed + RUB_HEAL_STEP },
    state: {
      ...state,
      healthPoints: Math.min(state.maxHealthPoints, state.healthPoints + RUB_HEAL_STEP),
    },
  };
}

/**
 * Recompensa por concluir uma tarefa: +1 comida da categoria dela.
 *
 * Os atributos NÃO vêm daqui — vêm de alimentar. Concluir tarefa só entrega a
 * comida; o jogador escolhe quando usar.
 */
export function foodForCompletedTask(
  inventory: Record<string, number>,
  category: ActivityCategory,
): Record<string, number> {
  const food = FOOD_BY_CATEGORY[category];
  if (!food) return inventory;
  return { ...inventory, [food.emoji]: (inventory[food.emoji] ?? 0) + 1 };
}

/** Fatia do GameState que a conclusão de tarefa lê e escreve. */
export interface TaskState extends CareState {
  tasks: Array<{
    id: string; name: string; category: ActivityCategory; emoji: string; completed?: boolean;
    effort?: 1 | 2 | 3; status?: TaskStatus; deadline?: { date: string; time: string };
    createdAt?: string; lastTouchedAt?: string;
  }>;
  completedTasks: Array<{
    id: string; name: string; category: ActivityCategory; emoji: string; completedAt: string;
    effort?: 1 | 2 | 3; wasHaunted?: boolean;
  }>;
  activityStats: Record<string, {
    name: string; emoji: string; category: ActivityCategory; completionCount: number;
  }>;
}

/** Histórico é limitado: a UI mostra no máximo os últimos 50, e uma lista sem
 *  teto incha todo save (localStorage e nuvem). */
const COMPLETED_HISTORY_CAP = 200;

/**
 * Conclui uma tarefa: tira da lista, grava no histórico, conta na estatística
 * e entrega a comida da categoria.
 *
 * Vive aqui, e não dentro do App, porque o app de desktop faz exatamente a
 * mesma coisa ao marcar uma tarefa — e duas implementações divergiriam (foi
 * assim que o histórico e a estatística ficariam de fora no desktop).
 *
 * Retorna `null` se a tarefa não está mais na lista — quem chama trata como
 * "nada a fazer", sem gravar. É isso que torna a chamada idempotente: depois da
 * primeira vez a tarefa saiu de `tasks`, então uma segunda chamada não acha
 * nada e não duplica histórico.
 *
 * ATENÇÃO: NÃO recusar uma tarefa que já está com `completed: true`. Esse é o
 * fluxo NORMAL — o app marca a tarefa na hora do clique (para o check aparecer
 * na hora) e só chama esta função 3s depois, na animação de saída. Enquanto a
 * função recusava esse caso, concluir tarefa não entregava a comida, não
 * gravava no histórico e não contava na estatística: o laço central de
 * recompensa do jogo ficava sem efeito. A duplicidade é barrada pela remoção
 * da lista, não por esta flag.
 */
export function completeTask<T extends TaskState>(state: T, taskId: string, now = new Date()): T | null {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return null;

  const activityKey = `task-${task.name}-${task.category}`;
  const stats = state.activityStats[activityKey]
    ?? { name: task.name, emoji: task.emoji, category: task.category, completionCount: 0 };

  // O peso e a "assombração" são lidos AQUI, no último instante em que a tarefa
  // ainda existe. Depois desta função ela sai de `tasks` para sempre, e tanto a
  // meta ponderada do dia quanto o bônus de alívio precisam do dado — quem
  // recalculasse depois estaria lendo uma tarefa que não existe mais.
  const effort = task.effort === 2 || task.effort === 3 ? task.effort : 1;
  const wasHaunted = isHauntedTask(task, now);

  return {
    ...state,
    tasks: state.tasks.filter(t => t.id !== taskId),
    completedTasks: [
      ...state.completedTasks,
      {
        id: taskId,
        name: task.name,
        category: task.category,
        emoji: task.emoji,
        completedAt: now.toISOString(),
        effort,
        wasHaunted,
      },
    ].slice(-COMPLETED_HISTORY_CAP),
    activityStats: {
      ...state.activityStats,
      [activityKey]: { ...stats, completionCount: stats.completionCount + 1 },
    },
    foodInventory: foodForCompletedTask(state.foodInventory, task.category),
  };
}
