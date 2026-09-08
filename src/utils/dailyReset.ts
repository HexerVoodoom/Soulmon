import { FORM_REQUIREMENTS, MANUAL_EVOLUTION, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays, clampBranch, canReachUltra } from '../types/progression';
import type { EvolutionStage } from '../types/progression';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';
import { heartLossCap } from './passives';
import {
  normalizeSchedule,
  normalizeEffort,
  HABIT_WEIGHT,
  type Schedule,
} from '../types/taskModel';
import {
  emptyRhythm,
  habitCountsOn,
  completeHabit,
  applyMissedDay,
  earnShield,
  type HabitRhythm,
} from './habitRhythm';
import { ensureSeasonProgress, applySeasonMedal } from './seasons';

// Tipos necessários para o reset
interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  steps: { id: string; label: string; completed: boolean; }[];
  weekDays: number[];
  alarm?: { time: string; };
  completedToday?: boolean;
  lastCompletedDate?: string;
}

interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
}

export interface GameState {
  activities: Activity[];
  tasks: Task[];
  healthPoints: number;
  maxHealthPoints: number;
  perfectDays: number;
  totalXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  evolutionStage: string;
  unlockedEvolutions: string[];
  degeneratedByHP: boolean;
  currentBranch: 'virus' | 'data' | 'vaccine';
  lastDayWasPerfect: boolean;
  [key: string]: any;
}

// NOTA: aqui viviam `wasDayPerfect` e `countCompletedYesterday`, que
// reimplementavam a regra do dia perfeito e a contagem de conclusões — as
// MESMAS que `computeDailyReset` faz mais abaixo. Nada em produção as chamava;
// só os testes delas. Era o pior formato de código morto: uma segunda cópia de
// uma regra viva, com testes verdes dando a impressão de que a regra estava
// coberta. Mudar a regra em `computeDailyReset` as deixaria divergentes em
// silêncio, exatamente o footgun 9 do CLAUDE.md. Se precisar da resposta
// "o dia foi perfeito?", leia `lastDayReport.wasPerfect` do estado.

type Attr = 'virus' | 'data' | 'vaccine';
const ALL_ATTRS: Attr[] = ['virus', 'data', 'vaccine'];

// Árvore do Soulmon: id embute nível+branch ('champion-virus', 'rookie',
// 'ultra' — ver types/progression.ts). Cada jogador tem nomes ÚNICOS
// (utils/oracle.ts) então a evolução é pura manipulação de id, sem tabela
// por espécie. O branch usado é sempre o ATRIBUTO DOMINANTE recente (pode
// mudar de uma evolução pra outra, se os pontos recentes mudarem de tipo).
export function getNextEvolution(
  currentStage: string,
  branch: Attr,
  unlockedEvolutions: string[],
  /** Dias perfeitos desde a última evolução — abre o caminho da PERMANÊNCIA
   *  para o Ultra (`canReachUltra`, WP4.2/D6). Zero por omissão, então quem
   *  não passa continua com a regra antiga: só a coleção das três megas. */
  perfectDays = 0,
): string {
  branch = clampBranch(branch) as Attr;
  const level = getStageLevel(currentStage);
  if (level === 'rookie') return `champion-${branch}`;
  if (level === 'champion') return `ultimate-${branch}`;
  if (level === 'ultimate') return `mega-${branch}`;
  if (level === 'mega') {
    // A pergunta "existe destino?" é de `canReachUltra` (dono da árvore).
    // Aqui não se decide critério — se decidisse, seria a segunda cópia de uma
    // regra de evolução, que é como este projeto já se machucou antes.
    if (canReachUltra({ unlockedEvolutions, perfectDays })) return 'ultra';
    return currentStage;
  }
  return currentStage; // ultra — já no topo
}

// Forma anterior determinística (degeneração): desce pelo MESMO branch da
// forma atual (embutido no id); só o passo ultra→mega não tem branch
// embutido, então usa o branch atual do jogo como critério.
export function getPreviousForm(currentStage: string, branch: Attr = 'data'): string {
  const level = getStageLevel(currentStage);
  const [, ownBranch] = currentStage.split('-');
  const stepBranch: Attr = (ownBranch as Attr) ?? branch;
  if (level === 'ultra') return `mega-${branch}`;
  if (level === 'mega') return `ultimate-${stepBranch}`;
  if (level === 'ultimate') return `champion-${stepBranch}`;
  return 'rookie';
}

// ---------------------------------------------------------------------------
// A VIRADA DO DIA
//
// Esta função é a ÚNICA fonte da regra. O hook (hooks/useDailyReset.ts) chama
// ela dentro do setGameState, e o teste (hooks/useDailyReset.test.ts) importa
// ELA MESMA — antes o teste reimplementava a lógica numa cópia (`simulateReset`)
// e podia passar com o app quebrado. Regra copiada = regra que diverge em
// silêncio; não recrie uma segunda cópia disto em lugar nenhum.
//
// O princípio que rege os números abaixo: o Soulmon é um avatar que evolui COM
// o usuário e o encoraja. A falha existe e tem consequência — mas nunca uma
// consequência que castigue mais forte justamente quem está numa fase pior.
// ---------------------------------------------------------------------------

/**
 * Teto de corações perdidos por virada de dia. A perda continua PROPORCIONAL
 * ao que não foi cumprido; isto só impede que um único dia zerado leve o pet de
 * cheio a degenerado de uma vez. Um dia ruim é um sinal, não uma sentença.
 */
export const MAX_HEARTS_LOST_PER_DAY = 1;

/**
 * A partir de quantos dias sem abrir o app a virada para de cobrar HP. Quem
 * volta depois de sumir encontra o pet com saudade, não uma fatura.
 */
export const ABSENCE_FORGIVENESS_DAYS = 2;

/** Meio coração de volta na virada de domingo→segunda: o teto do estrago é 7 dias. */
export const WEEKLY_RELIEF_HEARTS = 0.5;

/**
 * P2 — UM DIA DE FOLGA POR SEMANA, GRÁTIS E AUTOMÁTICO.
 *
 * Modelo: o Inn do Habitica (não punir) + o congelamento do Duolingo (já está
 * no bolso) + o Pokémon Sleep (você não ganha, mas nunca perde) — que é o
 * produto do benchmark com a menor queda no ano 3.
 *
 * **Automático e retroativo, e não "marque folga hoje".** Quem precisou de
 * folga não abriu o app; uma folga que precisa ser declarada de antemão é mais
 * um item de planejamento, ou seja, exatamente a fricção que a auditoria de
 * carga diária mandou tirar. Então ela é gasta sozinha, na virada, sobre um dia
 * que JÁ terminou.
 *
 * Sem acúmulo (teto 1): folga que empilha vira saldo a administrar, e
 * administrar saldo é trabalho.
 *
 * O que a folga NÃO faz, de propósito:
 *  - **não vira dia completo** (`dayWasPerfect` não sabe que ela existe). Não
 *    ganha, não perde — é o formato do Pokémon Sleep. O caminho de evolução
 *    continua custando o mesmo.
 *  - **não desliga o dia**: o que a pessoa fez naquele dia valeu normalmente
 *    (comida, atributos, Bits). É a lição do Inn — descansar não é sair do jogo.
 *
 * NÃO CONFUNDIR com os escudos de `habitRhythm.ts`: aqueles protegem o RITMO de
 * um hábito específico e nunca tocaram em HP (está escrito lá: "falta não gera
 * perda de HP própria"). Este protege o CORAÇÃO, uma vez por semana, do save
 * inteiro. São duas coisas, e é por isso que são dois mecanismos.
 */
export const REST_DAYS_PER_WEEK = 1;

/**
 * A semana à qual a folga pertence, ancorada na SEGUNDA — a mesma virada do
 * `WEEKLY_RELIEF_HEARTS`. Ter duas semanas diferentes no mesmo arquivo faria o
 * jogador ganhar fôlego num dia e folga noutro, sem nada que explicasse.
 */
export function restWeekKeyFor(d: Date): string {
  const dia = d.getDay();
  const desdeSegunda = (dia + 6) % 7;           // segunda = 0, domingo = 6
  const segunda = new Date(d.getTime() - desdeSegunda * 86400000);
  return `${segunda.getFullYear()}-${String(segunda.getMonth() + 1).padStart(2, '0')}-${String(segunda.getDate()).padStart(2, '0')}`;
}

/**
 * Carência de HP nas primeiras viradas de vida do save.
 *
 * É o MESMO mecanismo de `ABSENCE_FORGIVENESS_DAYS`, apontado para o começo em
 * vez do retorno. Cenário medido: usuário novo cadastra 3 hábitos no tutorial e
 * faz 1 no dia 1. Na virada, `dailyGoal = min(3, 4) = 3` e `dailyDone = 1`, o
 * que dá `floor((1 − 1/3) × 3) = 2`, com teto 1 → ele PERDE UM CORAÇÃO na
 * segunda abertura da vida do save. Está dentro das regras da tabela do
 * CLAUDE.md, e é a pior aplicação possível delas: no dia 2 a pessoa ainda não
 * conhece a mecânica de cura (esfregar o pet, coraçãozinho), não tem carinho de
 * sobra guardado, e a única leitura disponível para o que aconteceu é "eu já
 * estou falhando". A perda proporcional só comunica alguma coisa para quem já
 * entendeu o contrato; antes disso ela é só um castigo sem professor.
 *
 * A carência NÃO relaxa nenhuma tese: nada zera, a falha continua sem punição
 * própria, e o histórico de constância (`habitRhythms`) continua sendo escrito
 * normalmente durante a carência — inclusive porque é ele que faz o contador
 * abaixo andar.
 */
export const NEW_SAVE_GRACE_DAYS = 3;

/**
 * Rampa de HP DEPOIS de um retorno — quantas viradas seguintes à virada do
 * retorno ainda não cobram.
 *
 * `ABSENCE_FORGIVENESS_DAYS` perdoava só a virada em que a ausência foi
 * detectada: no dia seguinte `wasAway` já é `false` e a cobrança volta inteira.
 * Ou seja, quem sumiu 5 dias era cobrado na SEGUNDA abertura depois de voltar —
 * e quem acabou de voltar está no momento de MAIOR risco de abandono, não de
 * menor. O argumento que justifica o perdão da ausência é exatamente o mesmo
 * aqui; ele só não tinha sido aplicado à rampa.
 */
export const RETURN_GRACE_DAYS = 2;

/**
 * Quantos dias perfeitos custa uma degeneração REAL (queda de estágio).
 *
 * O piso continua sendo `floor(required/2)` do estágio novo, então quem tinha
 * pouco não fica negativo. Este número é o que a queda tira de quem tinha
 * muito — antes ela zerava tudo, o que contradizia "um dia ruim é um sinal,
 * não uma sentença" num evento que já exige três dias ruins seguidos.
 *
 * Ajuste de balanceamento: mexer aqui muda o peso da degeneração para jogador
 * avançado, e só para ele.
 */
export const DEGENERATION_PERFECT_DAYS_COST = 5;

/**
 * OS DIAS PERFEITOS DEPOIS DE UMA QUEDA DE ESTÁGIO — dono único da regra.
 *
 * Existem DOIS caminhos que degeneram: o automático (HP 0 na virada, logo
 * abaixo em `computeDailyReset`) e o MANUAL (o botão da página de Evolução,
 * `handleDegenerate` no App). Enquanto a expressão estava escrita à mão nos
 * dois, ela divergiu em silêncio — o footgun 9 literal: o automático virou
 * piso + custo fixo e o manual ficou na atribuição antiga
 * (`= floor(required/2)`), que é ESTRITAMENTE mais dura para qualquer jogador
 * acima do piso. Um mega com 39 dias perfeitos que descia de propósito
 * reaparecia com 2, enquanto o mesmo mega que simplesmente deixou o HP zerar
 * reaparecia com 34. O caminho deliberado punia mais que o descuido, e o
 * comentário do App afirmava exatamente o contrário.
 *
 * `piso` = metade do requisito do estágio NOVO (a misericórdia de sempre:
 * quem cai não recomeça do zero). `custo` = os dias que a queda tira de quem
 * tinha muito. O piso é chão, nunca prêmio: um jogador que já tinha mais que
 * ele não é rebaixado até ele.
 *
 * Há teste de PARIDADE (`useDailyReset.test.ts`) exigindo que os dois caminhos
 * devolvam o mesmo número — se alguém reescrever a expressão em qualquer um
 * dos lados, ele quebra.
 */
export function degeneratedPerfectDays(
  previousPerfectDays: number,
  newStageLevel: EvolutionStage,
): number {
  return Math.max(
    Math.floor(FORM_REQUIREMENTS[newStageLevel].required / 2),
    previousPerfectDays - DEGENERATION_PERFECT_DAYS_COST,
  );
}

/** Quantos dias se passaram desde a última virada. 1 = virada normal de ontem. */
export function daysSinceLastReset(lastResetDate: string | undefined, now: Date): number {
  if (!lastResetDate) return 1;
  const last = new Date(lastResetDate);
  if (Number.isNaN(last.getTime())) return 1;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  return Math.max(1, Math.round((a - b) / 86400000));
}

// ---------------------------------------------------------------------------
// IDADE DO SAVE — como se sabe que um save é NOVO sem um campo de nascimento
//
// O GameState não tem (e não vai ganhar) um `createdAt`: `hydrateSave` monta um
// objeto com campos EXPLÍCITOS, então um campo novo de topo simplesmente não
// sobrevive a um reload. O único lugar deste arquivo que atravessa a hidratação
// inteiro é `lastDayReport` (o hydrate devolve o objeto verbatim quando
// `date` é string) — e ele já é output EXCLUSIVO desta função. É lá, portanto,
// que mora o contador `saveDay`: uma virada = +1 (mais os dias pulados).
//
// A parte que exige cuidado não é contar, é o CHUTE INICIAL: um save antigo, na
// primeira virada depois desta mudança, não tem `saveDay` nenhum. Se o padrão
// fosse 0, todo save antigo do mundo ganharia três dias de carência indevida no
// dia do deploy. Por isso o padrão é decidido por `looksLikeVeteranSave`: só um
// estado SEM NENHUM sinal de vida pregressa começa em 0. Na dúvida, veterano —
// a direção segura aqui é a que NÃO dá carência.
//
// Limites conhecidos e aceitos da heurística:
//  (a) um save antigo que nunca evoluiu, nunca teve dia perfeito, nunca
//      concluiu nada e nunca registrou ritmo é indistinguível de um save novo,
//      e ganha até `NEW_SAVE_GRACE_DAYS` viradas sem cobrança. É alguém que,
//      por definição, não tem histórico a proteger — errar para o lado de não
//      cobrar é a escolha que o produto já faz em toda regra desta tabela;
//  (b) o contador anda por VIRADA, não por relógio: quem fica meses sem abrir
//      não "envelhece" o save. Coerente de propósito — dia sem virada é dia que
//      o jogo não julgou.
// ---------------------------------------------------------------------------

/**
 * WP4.19 — A ROTA DE REDENÇÃO.
 *
 * Quem chega a HP 0 cai um estágio (`degeneratedByHP`), e até aqui essa queda
 * não tinha VOLTA narrada: subir de novo era só subir, e o save carregava a
 * marca da queda sem carregar a da recuperação. Um produto que registra o
 * tombo e não registra o levantar está escolhendo qual metade da história
 * contar.
 *
 * A regra é uma linha: **evoluir enquanto `degeneratedByHP` está de pé apaga
 * a marca da queda e acende a da volta** (`redeemed`). Três limites,
 * herdados da ressalva #21 da revisão:
 *  · `redeemed` **nunca** é marca de queda — ele só existe no sentido
 *    positivo, e nada no app diz "este bicho já caiu";
 *  · **exibir é escolha do jogador** (`showRedeemed`, desligado por padrão):
 *    o app não decide contar isso por ninguém;
 *  · é **cosmético**. Não dá ponto, não muda requisito, não entra em ranking.
 *
 * Função PURA e idempotente: chamar duas vezes não muda nada depois da
 * primeira (footgun 6).
 */
export function applyRedemption<T extends { degeneratedByHP?: boolean; redeemed?: boolean }>(
  prev: T,
  evoluiu: boolean,
): T {
  if (!evoluiu || !prev.degeneratedByHP) return prev;
  return { ...prev, degeneratedByHP: false, redeemed: true };
}

/** Sinais de que este save JÁ VIVEU — qualquer um basta para não ser novo. */
export function looksLikeVeteranSave(state: Record<string, any>): boolean {
  if ((state.totalPerfectDays ?? 0) > 0) return true;
  if ((state.perfectDays ?? 0) > 0) return true;
  if (state.degeneratedByHP) return true;
  if (getStageLevel(state.evolutionStage) !== 'rookie') return true;
  if ((state.unlockedEvolutions?.length ?? 0) > 1) return true;
  if ((state.completedTasks?.length ?? 0) > 0) return true;
  if ((state.activityLog?.length ?? 0) > 0) return true;
  if ((state.moodLog?.length ?? 0) > 0) return true;
  if ((state.rest?.nights?.length ?? 0) > 0) return true;
  const rhythms: Record<string, HabitRhythm> = state.habitRhythms ?? {};
  for (const r of Object.values(rhythms)) {
    if ((r?.done?.length ?? 0) > 0 || (r?.missed?.length ?? 0) > 0 || (r?.totalDone ?? 0) > 0) {
      return true;
    }
  }
  return false;
}

/** Quantas viradas este save já viveu ANTES da que está sendo calculada. */
export function saveDaysLived(state: Record<string, any>): number {
  const stored = state.lastDayReport?.saveDay;
  if (typeof stored === 'number' && Number.isFinite(stored) && stored >= 0) {
    return Math.floor(stored);
  }
  // Sem contador: save anterior a esta regra. Veterano assume a carência já
  // gasta; só um estado limpo de qualquer histórico começa do zero.
  return looksLikeVeteranSave(state) ? NEW_SAVE_GRACE_DAYS : 0;
}

/** Quantas viradas ainda restam da rampa pós-retorno (0 = já acabou). */
function returnGraceLeft(state: Record<string, any>): number {
  const stored = state.lastDayReport?.returnGraceLeft;
  if (typeof stored === 'number' && Number.isFinite(stored) && stored > 0) {
    return Math.floor(stored);
  }
  // Compatibilidade: save que voltou ANTES desta regra existir só tem o
  // `welcomeBack` do relatório do retorno. Ele garante ao menos a virada
  // seguinte — que é exatamente a "segunda abertura" que cobrava.
  return state.lastDayReport?.welcomeBack ? 1 : 0;
}

// ---------------------------------------------------------------------------
// META DO DIA — dono único da regra `min(cadastradas, requisito do estágio)`.
//
// A regra tem DOIS componentes, e o segundo é o que já divergiu duas vezes:
//   (a) o teto: `FORM_REQUIREMENTS[nível].required`;
//   (b) a FONTE do "cadastradas": atividades **do dia da semana** + tarefas.
//
// Cadastrar uma atividade só de seg–sex não pode aumentar a meta de sábado.
// `computeDailyReset` sempre filtrou por dia da semana; os call sites que
// copiaram a fórmula usavam `activities.length` cru e, no fim de semana,
// cobravam uma meta que a virada do dia não cobra. É a mesma classe do achado
// 🔴 da rodada 4 (dois lugares calculando a mesma coisa a partir de fontes de
// dados DIFERENTES), e a mesma classe do bug já corrigido nas notificações —
// que na época só corrigiu o componente (a), não o (b).
//
// NÃO reescreva `Math.min(... , FORM_REQUIREMENTS[...].required)` em lugar
// nenhum: chame `dailyGoalFor`. Há guard travando isso
// (`src/utils/dailyGoal.contract.test.ts`).
// ---------------------------------------------------------------------------

/** Fatia do estado que a meta do dia lê. */
export interface DailyGoalState {
  evolutionStage: string;
  activities: Array<{ id?: string; weekDays?: number[]; schedule?: Schedule }>;
  /** Histórico por hábito. Opcional: nenhum save antigo tem, e sem ele a meta
   *  volta ao comportamento antigo (hábito flexível elegível) — nunca cobra a
   *  mais por não saber. */
  habitRhythms?: Record<string, HabitRhythm>;
  /** `any` porque a meta lê `effort`/`status` de tarefas que vêm do save (dado
   *  não confiável) — `normalizeEffort` e `countsForGoal` fazem a validação. */
  tasks: any[];
}

/**
 * Atividades que valem PARA ESTE dia (0 = domingo).
 *
 * ANTES: um hábito de recorrência flexível (`timesPerWeek`, `everyNDays`) era
 * elegível TODO dia, porque `weekDaysForSchedule` devolve `[0..6]` para eles.
 * Só que o laço de ritmo da virada julgava a falta por `isDueOn`. Os dois lados
 * da razão — a META e o FEITO — usavam regras de elegibilidade DIFERENTES, e o
 * hábito de intervalo era cobrado em coração nos dias em que o próprio motor
 * dizia que ele não era devido (ver o bloco de `habitCountsOn` em
 * `utils/habitRhythm.ts` para o caso medido).
 *
 * AGORA: a elegibilidade é UMA só (`habitCountsOn`), e ela precisa da DATA e do
 * `HabitRhythm` — daí o `dayKey` opcional. Quem não passa `dayKey` (call sites
 * que só têm o dia da semana em mãos) cai no comportamento antigo: hábito
 * flexível conta. É o padrão seguro na direção certa — na dúvida a meta é a
 * MAIOR, e a meta maior nunca é a que cobra a mais, porque `dailyDone` usa esta
 * mesma lista.
 */
export function activitiesForWeekDay<A extends { id?: string; weekDays?: number[]; schedule?: Schedule }>(
  state: { evolutionStage: string; activities: A[]; habitRhythms?: Record<string, HabitRhythm> },
  weekDay: number,
  dayKey?: string,
): A[] {
  const parsed = dayKey ? new Date(dayKey) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const weekdaysMatter = canSelectWeekdays(state.evolutionStage);
  return state.activities.filter(a => {
    const schedule = normalizeSchedule(a);
    if (schedule.kind === 'weekdays') {
      // O calendário continua mandando, e continua lendo o `weekDay` recebido
      // (e não o dia do `dayKey`): o chamador é quem escolhe o dia da semana, e
      // trocar a fonte aqui mudaria a resposta de quem passa os dois.
      return !weekdaysMatter || schedule.days.includes(weekDay);
    }
    // Flexível: sem data não há histórico a consultar → comportamento antigo.
    return date ? habitCountsOn(a, state.habitRhythms?.[String(a.id)], date) : true;
  });
}

/**
 * Tarefas avulsas CONCLUÍDAS num dia (`dayKey` = `new Date().toDateString()`).
 *
 * Existe porque `completeTask` (utils/careRules.ts) **remove** a tarefa de
 * `tasks` e a move para `completedTasks`. Quem contar só `tasks` está contando
 * uma lista que a outra regra esvazia: a tarefa some do total E do concluído,
 * e um dia em que a pessoa fez TUDO fica indistinguível de um dia em que ela
 * não cadastrou nada.
 */
export function tasksCompletedOn(
  state: { completedTasks?: Array<{ completedAt?: string; effort?: unknown }> },
  dayKey: string,
): number {
  return (state.completedTasks ?? []).reduce((sum, t) => {
    if (!t?.completedAt) return sum;
    const d = new Date(t.completedAt);
    if (Number.isNaN(d.getTime()) || d.toDateString() !== dayKey) return sum;
    return sum + normalizeEffort(t.effort);
  }, 0);
}

// ---------------------------------------------------------------------------
// A META É PONDERADA POR ESFORÇO — não é uma contagem de itens.
//
// Hábito pesa HABIT_WEIGHT (1); tarefa pesa o próprio `effort` (1–3). Enquanto
// a meta contava ITENS, o jogo ensinava exatamente o comportamento que ele
// existe para corrigir: cinco tarefas triviais rendiam mais que a única difícil
// que mudaria o dia da pessoa. É o defeito documentado do Karma do Todoist —
// recompensa desacoplada do esforço real produz teatro, não progresso.
//
// A mudança é retrocompatível por construção: `normalizeEffort` devolve 1 para
// todo item sem o campo, então para um save antigo peso == contagem e nenhum
// número que o jogador via muda de valor.
//
// Tarefas 'someday' e 'dropped' NÃO entram: a primeira é deliberadamente inerte
// (o Someday do Things 3) e a segunda é um estado terminal. Fazê-las contar na
// meta transformaria as duas saídas honestas do backlog em cobrança nova, que é
// o oposto exato do motivo pelo qual elas existem.
// ---------------------------------------------------------------------------

/** Uma tarefa entra na meta do dia? (Só as ativas.) */
function countsForGoal(t: any): boolean {
  const status = t?.status ?? 'open';
  return status === 'open';
}

/**
 * O PESO cadastrado PARA ESTE dia: atividades do dia + tarefas ativas ainda na
 * lista + tarefas do dia que já saíram da lista por terem sido feitas.
 *
 * O nome continua `registeredForDay` (e o guard de origem continua ancorado
 * nele) porque o papel é o mesmo — o que mudou é a UNIDADE: esforço, não itens.
 */
export function registeredForDay(state: DailyGoalState, weekDay: number, dayKey?: string): number {
  return activitiesForWeekDay(state, weekDay, dayKey).length * HABIT_WEIGHT
    + state.tasks.filter(countsForGoal).reduce((s, t: any) => s + normalizeEffort(t?.effort), 0)
    + (dayKey ? tasksCompletedOn(state as any, dayKey) : 0);
}

/** Meta do dia = `min(cadastradas no dia, requisito do estágio)`. */
export function dailyGoalFor(state: DailyGoalState, weekDay: number, dayKey?: string): number {
  // Escrita inline de propósito: é a ÚNICA ocorrência autorizada desta forma no
  // projeto, e o guard de origem usa esta linha como âncora — se ela sumir, o
  // guard percebe que virou decoração em vez de passar vazio.
  return Math.min(
    registeredForDay(state, weekDay, dayKey),
    FORM_REQUIREMENTS[getStageLevel(state.evolutionStage)].required,
  );
}

/**
 * P1 — A META QUE PROTEGE O CORAÇÃO É MENOR QUE A META DO DIA COMPLETO.
 *
 * O Habitica separa **Dailies** (obrigatório, machuca) de **Habits** (bônus,
 * não machuca). O Soulmon tinha os dois eixos escondidos num número só: a mesma
 * `dailyGoal` decidia se o dia foi completo E se a criatura perdia coração.
 * Consequência: não havia nenhum lugar entre "fiz tudo" e "regredi".
 *
 * Agora há duas réguas, e é de propósito que sejam duas:
 *
 *   - **a excelência continua custando a meta inteira** — `dayWasPerfect` NÃO
 *     usa esta função, e o caminho de evolução (`perfectDays`) não cede um
 *     milímetro. Princípio permanente #3: modernizar o atrito, nunca a
 *     dificuldade.
 *   - **a segurança passa a custar 60%** — o jogador que teve um dia ruim para
 *     de perder coração; o que quer evoluir continua tendo que fazer tudo.
 *
 * Em número (`maxHP` do estágio à parte): mega com meta 6 precisava de 5 itens
 * para não perder coração e passa a precisar de 4. Rookie com meta 4 continua
 * em 3 — o piso `max(1, …)` e o arredondamento para cima impedem que o alívio
 * vire "não precisa fazer nada".
 *
 * O coração vira o que a essência declarada diz que ele é: o retrato do
 * cuidado, não a fatura.
 *
 * **O botão de ajuste é este número.** Se o conjunto ficar generoso demais,
 * 0,6 → 0,7 devolve o mega a 5/6. Ver `product/soulmon-01/balance/carga-diaria.md`, P1.
 */
export const HEART_GOAL_RATIO = 0.6;

/**
 * Meta de CORAÇÃO do dia — a que a perda de HP cobra. Dono único da fórmula:
 * `computeDailyReset` e `tasksToAvoidHeartLoss` chamam esta função, e nenhum
 * dos dois recalcula 0,6 na mão (footgun 9).
 */
export function heartGoalFor(state: DailyGoalState, weekDay: number, dayKey?: string): number {
  return heartGoalFromDailyGoal(dailyGoalFor(state, weekDay, dayKey));
}

/**
 * A conversão pura, para quem JÁ tem a meta do dia em mãos e não pode pagar
 * uma segunda varredura das atividades (é o caso do `computeDailyReset`).
 * `0` continua `0`: sem nada cadastrado não há o que falhar, e o piso de 1 não
 * pode inventar uma cobrança onde não havia nenhuma.
 */
export function heartGoalFromDailyGoal(dailyGoal: number): number {
  if (dailyGoal <= 0) return 0;
  return Math.max(1, Math.ceil(dailyGoal * HEART_GOAL_RATIO));
}

/**
 * Corações perdidos ANTES do teto diário: proporcional ao que não foi feito.
 * Dono único da fórmula — `computeDailyReset` e `tasksToAvoidHeartLoss` (a
 * resposta que a UI dá) chamam esta mesma função, para o número prometido não
 * poder divergir do número cobrado nem por arredondamento.
 */
export function rawHeartsLostFor(done: number, goal: number, maxHP: number): number {
  const completionRatio = goal > 0 ? Math.min(1, done / goal) : 1;
  return Math.floor((1 - completionRatio) * maxHP);
}

/**
 * Quantos itens PRECISAM estar concluídos hoje para a virada não tirar coração
 * nenhum. Dono único da resposta que a UI dá quando o jogador pergunta
 * "quanto falta para eu não regredir?".
 *
 * Deriva da MESMA fórmula da perda (`floor((1 − feitas/meta) × maxHP)`, mais
 * abaixo): a perda zera quando `feitas/meta > 1 − 1/maxHP`. Para um rookie com
 * meta 4 e 3 corações isso dá **3** itens — e não 2.
 *
 * Existe porque "metade das tarefas" já foi dito ao jogador como se bastasse.
 * A auditoria de tom corrigiu isso no aviso das 20h (STATUS §2: "parou de
 * prometer que 'metade das tarefas' evita a perda — o que era falso") e o
 * banner de 1 coração continuou com `Math.ceil(required / 2)`, prometendo o
 * mesmo número falso no momento de maior consequência do jogo.
 */
export function tasksToAvoidHeartLoss(
  state: DailyGoalState & { maxHealthPoints?: number },
  weekDay: number,
  dayKey?: string,
): number {
  // P1: a pergunta é "quanto falta para eu NÃO REGREDIR", e quem responde isso
  // é a meta de coração — não a do dia completo. Trocar aqui e esquecer o
  // `computeDailyReset` (ou o contrário) faria a UI prometer um número e o jogo
  // cobrar outro, que é exatamente o footgun 9.
  const goal = heartGoalFor(state, weekDay, dayKey);
  const maxHP = state.maxHealthPoints ?? 3;
  if (goal <= 0 || maxHP <= 0) return 0;
  // Procurado PELA PRÓPRIA fórmula da perda, e não por álgebra equivalente.
  // Um `floor(goal × (1 − 1/maxHP)) + 1` fechado é "o mesmo cálculo" no papel e
  // diverge na prática: em ultra (meta 5, maxHP 5) com 4 feitas, o ponto
  // flutuante faz `(1 − 4/5) × 5` valer 0,9999999999999998 e a perda ser ZERO,
  // enquanto a álgebra exigiria 5. Derivar da função é o que garante que o
  // número prometido é o número que o jogo cobra. (Guard diferencial em
  // `dailyGoalSources.test.ts` roda os dois lado a lado.)
  for (let feitas = 0; feitas <= goal; feitas++) {
    if (rawHeartsLostFor(feitas, goal, maxHP) === 0) return feitas;
  }
  return goal;
}

export interface DailyResetOptions {
  /** Injetável para teste; usa a data real por padrão. */
  now?: Date;
}

/**
 * Calcula o estado do dia seguinte. Função PURA — não toca em localStorage nem
 * dispara efeito nenhum (StrictMode invoca updaters 2×).
 */
export function computeDailyReset<T extends Record<string, any>>(prev: T, opts: DailyResetOptions = {}): T {
  const now = opts.now ?? new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();

  const currentLevel = getStageLevel(prev.evolutionStage);
  const requirements = FORM_REQUIREMENTS[currentLevel];
  const requiredToday = requirements.required;

  let dailyDone = 0;
  // A MESMA lista para os três usos: o que entra na meta (`registeredForDay`),
  // o que pode creditar `dailyDone` e o que o laço de ritmo julga. Era aqui que
  // a razão tinha dois denominadores: esta chamada não passava o `dayKey`, então
  // hábito flexível entrava sempre, enquanto o laço lá embaixo filtrava por
  // `isDueOn` e não registrava nada. Ver `habitCountsOn` (utils/habitRhythm.ts).
  const availableActivities = activitiesForWeekDay(
    prev as any,
    yesterdayWeekDay,
    yesterdayString,
  ) as any[];

  availableActivities.forEach((activity: any) => {
    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every((s: any) => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }
    if (isComplete) dailyDone += HABIT_WEIGHT;
  });

  // Tarefas avulsas: as que ainda estão na lista marcadas (janela de 3s entre o
  // clique e a saída da lista) MAIS as que já saíram para `completedTasks`.
  // Contar só `prev.tasks` era contar uma lista que `completeTask` esvazia:
  // quem fez TODAS as tarefas do dia caía em `totalTasks === 0` e a virada
  // NEGAVA o dia perfeito — o dia em que a pessoa fez tudo ficava idêntico ao
  // dia em que ela não cadastrou nada, e o progresso para a evolução travava
  // sem nenhum aviso, com a barra da tela marcando 100%.
  // Ponderado pelo mesmo peso da meta (`registeredForDay`): se o feito contasse
  // itens e a meta contasse esforço, uma tarefa de projeto pediria 3 e entregaria
  // 1 — o jogador faria 100% do que se comprometeu e a virada cobraria coração.
  dailyDone += prev.tasks
    .filter((t: any) => t.completed && countsForGoal(t))
    .reduce((s: number, t: any) => s + normalizeEffort(t?.effort), 0)
    + tasksCompletedOn(prev as any, yesterdayString);

  // Meta do dia = min(cadastradas, requisito do estágio). Cumprir o que você
  // mesmo se comprometeu a fazer basta; cadastrar MAIS nunca aumenta o risco.
  // É o análogo exato da fórmula do Vital Bracelet, que mede o esforço pelo
  // delta do SEU próprio batimento de base — o jogo compara você com você.
  // Fórmula em `dailyGoalFor` (acima) — é a MESMA que a UI e as notificações
  // chamam, para a meta anunciada não poder divergir da meta cobrada.
  const totalTasks = registeredForDay(prev as any, yesterdayWeekDay, yesterdayString);
  const dailyGoal = dailyGoalFor(prev as any, yesterdayWeekDay, yesterdayString);

  // Energia do dia perfeito medida contra a META DO DIA, não contra o requisito
  // cru do estágio. As barras exibidas continuam sendo `requiredToday`
  // (getMaxEnergyForStage) — o que mudou é o que o dia perfeito COBRA.
  //
  // Por que: comida se ganha 1 por conclusão (careRules.foodForCompletedTask) e
  // energia só enche comendo. Se a meta do dia é 2 (mega no sábado, com as
  // atividades cadastradas só para seg–sex), o jogador que faz as 2 ganha 2
  // comidas e a energia MÁXIMA possível dele naquele dia é 2. Cobrar 6 ali era
  // negar o dia perfeito a quem fez 100% da própria meta, sem uma linha de
  // aviso. A mesma linha misturava as duas réguas: tarefas contra `dailyGoal`
  // (min) e energia contra o requisito cru — a Fase 1 do fix de
  // `tasksCompletedOn` repetida no outro eixo.
  const energyWasFull = (prev.energyPoints ?? 0) >= dailyGoal;
  const dayWasPerfect = totalTasks > 0 && dailyDone >= dailyGoal && energyWasFull;

  // Ausência: se o app ficou dias sem abrir, não há o que cobrar — as tarefas
  // daqueles dias nem chegaram a ser registradas. Cobrar aqui puniria o retorno,
  // que é exatamente o momento que precisa ser acolhedor.
  const daysAway = daysSinceLastReset(prev.lastResetDate, now);
  const wasAway = daysAway >= ABSENCE_FORGIVENESS_DAYS;

  // Carência de começo de vida (ver NEW_SAVE_GRACE_DAYS). `lived` é o número de
  // viradas ANTERIORES a esta; a virada nº 1 de um save novo tem lived 0.
  const lived = saveDaysLived(prev);
  const newSaveGrace = lived < NEW_SAVE_GRACE_DAYS;

  // Rampa pós-retorno (ver RETURN_GRACE_DAYS). O crédito é gasto por DIA
  // decorrido, não por virada, senão sumir de novo no meio da rampa esticaria a
  // carência para sempre.
  const graceLeftBefore = returnGraceLeft(prev);
  const returnRamp = !wasAway && graceLeftBefore > 0;
  const graceLeftAfter = wasAway
    ? RETURN_GRACE_DAYS
    : Math.max(0, graceLeftBefore - daysAway);

  /** Esta virada cobra HP? As três carências têm o MESMO argumento por trás. */
  const forgivesHP = wasAway || newSaveGrace || returnRamp;

  let newHP = prev.healthPoints;
  let newPerfectDays = prev.perfectDays;
  let newEvolutionStage = prev.evolutionStage;
  const finalUnlockedEvolutions = [...prev.unlockedEvolutions];
  let wasDegeneratedByHP = false;
  let newMaxActivityCap = prev.maxActivityCap;
  let newCurrentBranch = prev.currentBranch as Attr;
  let newRecentAttrs = {
    virus: prev.attributesSinceLastEvolution?.virus ?? 0,
    data: prev.attributesSinceLastEvolution?.data ?? 0,
    vaccine: prev.attributesSinceLastEvolution?.vaccine ?? 0,
  };

  // Perda de HP: proporcional ao que NÃO foi feito, medido contra a mesma meta,
  // e limitada a MAX_HEARTS_LOST_PER_DAY. Sem tarefas cadastradas, nada a falhar.
  // P1: contra a meta de CORAÇÃO (60% da meta do dia), não contra a meta
  // inteira — que continua sendo o que `dayWasPerfect` exige, logo acima.
  const heartGoal = heartGoalFromDailyGoal(dailyGoal);
  const rawHeartsLost = rawHeartsLostFor(dailyDone, heartGoal, prev.maxHealthPoints);
  // Teimoso (utils/passives.ts) aguenta melhor um dia ruim.
  const lossCap = heartLossCap(prev.petPassive, MAX_HEARTS_LOST_PER_DAY);
  const heartsAntesDaFolga = forgivesHP ? 0 : Math.min(rawHeartsLost, lossCap);

  // ── P2: a folga da semana ────────────────────────────────────────────────
  // A ORDEM IMPORTA e é esta: gasta-se PRIMEIRO, recarrega-se DEPOIS. A perda
  // sendo julgada aqui é de ONTEM, então ela pertence à semana de ontem e tem
  // de ser paga com a folga daquela semana. Recarregar antes daria, na virada
  // de segunda, duas folgas para a mesma pessoa: a que sobrou do domingo e a
  // da semana nova.
  const semanaDeOntem = restWeekKeyFor(yesterday);
  const folgasAntes = prev.restWeekKey === semanaDeOntem
    // Limitado ao teto NA LEITURA, não só na recarga: o save é escrito pelo
    // cliente e viaja pela nuvem, então um `restDaysLeft` inflado (edição,
    // save forjado, bug futuro) viraria folga infinita — ou seja, imunidade a
    // perda de coração, em silêncio.
    ? Math.min(REST_DAYS_PER_WEEK, Math.max(0, prev.restDaysLeft ?? REST_DAYS_PER_WEEK))
    // Semana diferente (ou save antigo, sem o campo): a folga daquela semana
    // ainda estava inteira. Save antigo nunca começa devendo.
    : REST_DAYS_PER_WEEK;
  const usouFolga = heartsAntesDaFolga > 0 && folgasAntes > 0;
  const heartsLost = usouFolga ? 0 : heartsAntesDaFolga;

  const semanaAgora = restWeekKeyFor(now);
  const restWeekKey = semanaAgora;
  const restDaysLeft = semanaAgora !== semanaDeOntem
    // Virou a semana: recarrega cheio, sem acúmulo.
    ? REST_DAYS_PER_WEEK
    : Math.max(0, folgasAntes - (usouFolga ? 1 : 0));

  if (heartsLost > 0) {
    newHP = Math.max(0, prev.healthPoints - heartsLost);
  }

  // Alívio de segunda-feira: meio coração de volta, limitado ao máximo do
  // estágio. Semana nova começa com fôlego (o Snorlax do Pokémon Sleep reinicia
  // toda segunda pelo mesmo motivo).
  const isMonday = now.getDay() === 1;
  if (isMonday && newHP > 0) {
    newHP = Math.min(prev.maxHealthPoints, newHP + WEEKLY_RELIEF_HEARTS);
  }

  if (dayWasPerfect) {
    newPerfectDays++;
  }
  // Dia não-perfeito NÃO tira perfectDays. O contador acumula e só zera ao
  // evoluir — que é o que o CLAUDE.md sempre documentou. Um contador que zera
  // dispara o "já quebrei, quebra tudo" e leva ao abandono.

  // Evolução. O cadeado na página de Evolução bloqueia por completo: os dias
  // perfeitos seguem acumulando e a evolução acontece na virada seguinte ao
  // destravar.
  if (!MANUAL_EVOLUTION && !prev.evolutionLocked && newPerfectDays >= requirements.required) {
    newPerfectDays = 0;

    // Branch = atributo dominante RECENTE (não o total histórico), pra que o
    // hábito atual do jogador ainda mande no rumo da evolução.
    const recentV = newRecentAttrs.virus;
    const recentD = newRecentAttrs.data;
    const recentVac = newRecentAttrs.vaccine;
    const dominantAttr = Math.max(recentV, recentD, recentVac);
    let branch = prev.currentBranch as Attr;
    if (dominantAttr > 0) {
      if (recentV === dominantAttr) branch = 'virus';
      else if (recentD === dominantAttr) branch = 'data';
      else branch = 'vaccine';
    }
    newCurrentBranch = branch;
    newRecentAttrs = { virus: 0, data: 0, vaccine: 0 };

    newEvolutionStage = getNextEvolution(prev.evolutionStage, branch, prev.unlockedEvolutions, prev.perfectDays ?? 0);
    const naturalNext = newEvolutionStage;

    const newStageLevel = getStageLevel(newEvolutionStage);
    newHP = MAX_HP_BY_FORM[newStageLevel];
    const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
    if (newCap > newMaxActivityCap) newMaxActivityCap = newCap;

    if (!finalUnlockedEvolutions.includes(naturalNext)) {
      finalUnlockedEvolutions.push(naturalNext);
    }
  }

  // Degeneração por HP zerado.
  if (newHP <= 0) {
    const previousForm = getPreviousForm(prev.evolutionStage, newCurrentBranch);
    const caiuDeEstagio = previousForm !== prev.evolutionStage;

    if (caiuDeEstagio) {
      wasDegeneratedByHP = true;
      newEvolutionStage = previousForm;

      const degeneratedLevel = getStageLevel(newEvolutionStage);
      newHP = MAX_HP_BY_FORM[degeneratedLevel];

      // Desconto de recuperação: quem cai reaparece já na metade do requisito
      // do estágio novo. É misericórdia deliberada — você caiu, mas não
      // recomeça do zero.
      //
      // Mudou de ATRIBUIÇÃO para PISO + CUSTO FIXO. Antes era `=`, e isso
      // deixava a regra inconsistente na direção: quem tinha MENOS que o
      // desconto ganhava, e quem tinha MAIS perdia tudo — um jogador com 39
      // dias em mega, a um dia do ultra, reaparecia com 2. Três dias ruins
      // seguidos (o mínimo para zerar o HP com o teto de 1/dia) apagavam três
      // meses. Agora a queda custa DEGENERATION_PERFECT_DAYS_COST dias, e o
      // desconto é o chão — nunca um prêmio.
      //
      // A expressão vive em `degeneratedPerfectDays` (acima) porque o caminho
      // MANUAL (`handleDegenerate`, App.tsx) precisa da mesma — e enquanto ela
      // estava duplicada os dois divergiram.
      newPerfectDays = degeneratedPerfectDays(prev.perfectDays, degeneratedLevel);
      newRecentAttrs = { virus: 0, data: 0, vaccine: 0 };
    } else {
      // RAIZ da árvore (rookie): não existe forma abaixo, então `getPreviousForm`
      // devolve o próprio estágio e nada degenera de fato.
      //
      // O bloco acima rodava aqui do mesmo jeito e entregava HP CHEIO e
      // `perfectDays = 2` a quem simplesmente não fez nada. Medido: rookie com
      // HP 1 que não fazia nada terminava com HP 3 e perfectDays 0→2, enquanto
      // o que FAZIA TUDO terminava com HP 1 e perfectDays 0. Negligenciar
      // rendia mais progressão que cuidar — o oposto exato da essência
      // declarada do produto.
      //
      // Volta com UM coração: o suficiente para continuar jogando (senão o
      // jogador fica presoem HP 0 para sempre), sem presente e sem custo extra
      // — cobrar dias de quem ainda nem tem estágio abaixo seria punir
      // justamente quem o produto diz que não quer punir.
      newHP = 1;
    }
  }

  // -------------------------------------------------------------------------
  // CONSTÂNCIA DOS HÁBITOS (utils/habitRhythm.ts)
  //
  // A virada é o único momento em que se sabe se um hábito devido ONTEM foi
  // cumprido — logo abaixo, `resetActivities` apaga `completedToday` e a
  // resposta deixa de existir. Por isso o histórico é escrito aqui, e por isso
  // ele mora em `habitRhythms` (fora do array de atividades, que é justamente o
  // que essa linha reescreve inteiro).
  //
  // Falta NÃO gera perda de HP própria nem zera nada: ela só entra no
  // denominador da média móvel e, se houver escudo, é absorvida
  // automaticamente. A cobrança do dia continua sendo uma só — a fórmula de
  // corações lá em cima. Duas cobranças pelo mesmo dia ruim seria exatamente o
  // empilhamento de punição que afunda o Habitica.
  // -------------------------------------------------------------------------
  const rhythms: Record<string, HabitRhythm> = { ...(prev.habitRhythms ?? {}) };
  /* Quantos escudos esta virada CONSUMIU (WP2.15).
     Vai no `lastDayReport` pelo mesmo motivo que `saveDay` e `returnGraceLeft`:
     é registro da virada, e este é o único objeto deste arquivo que atravessa a
     hidratação inteiro. Não é para a UI — é o dado que a decisão D3 (escudo
     3→2) vai precisar, e que hoje não existe: `applyMissedDay` gasta o escudo
     em silêncio, de propósito, e ninguém nunca soube com que frequência ele
     salvou alguém. */
  let shieldsSpent = 0;
  if (!wasAway) {
    availableActivities.forEach((activity: any) => {
      const current = rhythms[activity.id] ?? emptyRhythm();
      // Sem `isDueOn` de novo aqui: `availableActivities` JÁ foi filtrada pela
      // mesma regra (`habitCountsOn`, que chama `isDueOn` para `everyNDays`).
      // A segunda checagem era a origem do bug — duas leituras da mesma
      // pergunta, uma por lista, produzindo meta e falta discordantes.
      const isComplete = activity.steps?.length > 0
        ? activity.steps.every((s: any) => s.completed)
        : !!activity.completedToday && activity.lastCompletedDate === yesterdayString;

      const next = isComplete
        ? completeHabit(current, yesterdayString)
        : applyMissedDay(current, yesterdayString);
      // A conta é ANTES do `earnShield`: ganhar um escudo no mesmo dia em que
      // gastou outro não pode esconder o gasto.
      if (next.shields < current.shields) shieldsSpent += current.shields - next.shields;
      rhythms[activity.id] = earnShield(next, now);
    });
  }

  const resetActivities = prev.activities.map((activity: any) => ({
    ...activity,
    steps: activity.steps.map((step: any) => ({ ...step, completed: false })),
    completedToday: false,
  }));

  const resetTasks = prev.tasks.map((task: any) => ({ ...task, completed: false }));

  const finalStageLevel = getStageLevel(newEvolutionStage);
  const newMaxHP = MAX_HP_BY_FORM[finalStageLevel];

  return {
    ...prev,
    activities: resetActivities,
    // P2 — a folga vive no save (um contador por JOGADOR, não por aparelho).
    restDaysLeft,
    restWeekKey,
    tasks: resetTasks,
    healthPoints: Math.min(newHP, newMaxHP),
    maxHealthPoints: newMaxHP,
    perfectDays: newPerfectDays,
    lastResetDate: now.toDateString(),
    evolutionStage: newEvolutionStage,
    poopEventsScheduled: [],
    poopEventsCompleted: [],
    poopEventsShown: [],
    poopPenaltyClockAt: 0,
    currentBranch: newCurrentBranch,
    unlockedEvolutions: finalUnlockedEvolutions,
    degeneratedByHP: wasDegeneratedByHP,
    lastDayWasPerfect: dayWasPerfect,
    // Contador vitalício de dias perfeitos (missões) — nunca zera ao evoluir.
    totalPerfectDays: (prev.totalPerfectDays ?? 0) + (dayWasPerfect ? 1 : 0),
    /* WP4.16 — a estação passa a existir para o jogador.
       `seasons.ts` estava escrito, testado e SEM CONSUMIDOR: ninguém chamava
       `ensureSeasonProgress`, ninguém chamava `applySeasonMedal`, e por isso a
       medalha da estação nunca podia ser ganha por ninguém.
       A ordem importa: `ensure` primeiro (entrar numa estação nova tira foto
       nova preservando `earnedMedals`), `apply` depois, sobre os contadores JÁ
       atualizados desta virada — senão a medalha chega sempre um dia tarde. */
    season: (() => {
      const contadores = {
        totalPerfectDays: (prev.totalPerfectDays ?? 0) + (dayWasPerfect ? 1 : 0),
        dungeonRunsCompleted: prev.dungeonRunsCompleted ?? 0,
      };
      const alinhado = ensureSeasonProgress(prev.season, contadores, now);
      return applySeasonMedal(alinhado, contadores, prev.rest, now);
    })(),
    maxActivityCap: newMaxActivityCap,
    attributesSinceLastEvolution: newRecentAttrs,
    habitRhythms: rhythms,
    energyPoints: 0, // Energia zera todo dia (enche comendo)
    // Resumo de ontem, mostrado 1× como "relatório diário" na próxima abertura.
    lastDayReport: {
      date: yesterdayString,
      done: dailyDone,
      total: totalTasks,
      required: dailyGoal,
      heartsLost,
      wasPerfect: dayWasPerfect,
      energyWasFull,
      perfectDays: newPerfectDays,
      degenerated: wasDegeneratedByHP,
      // Modo boas-vindas: a UI deve receber quem voltou sem nenhuma cobrança.
      welcomeBack: wasAway,
      daysAway: wasAway ? daysAway : 0,
      weeklyRelief: isMonday,
      // --- estado de carência, carregado DENTRO do relatório de propósito ---
      // `hydrateSave` monta o GameState com campos explícitos (campo de topo
      // desconhecido é descartado no reload), e `lastDayReport` é o único
      // objeto deste arquivo que atravessa a hidratação inteiro. Estes dois
      // números não são para a UI: são o relógio das carências.
      /** Viradas já vividas por este save, contando esta. */
      saveDay: Math.min(lived + Math.max(1, daysAway), 9999),
      /** Viradas de rampa que ainda restam depois de um retorno. */
      returnGraceLeft: graceLeftAfter,
      /** Escudos de descanso consumidos NESTA virada (WP2.15). */
      shieldsSpent,
      /** Esta virada não cobrou HP por carência (novo save / rampa de retorno). */
      forgiven: forgivesHP,
      /** P2 — a folga da semana absorveu a perda desta virada. A UI usa isto
       *  para CONTAR o que aconteceu: uma folga gasta em silêncio é um perdão
       *  que a pessoa nunca soube que recebeu, e perdão invisível não acalma
       *  ninguém. */
      restDayUsed: usouFolga,
      /** Quantas folgas ainda restam nesta semana, depois desta virada. */
      restDaysLeft,
    },
  };
}
