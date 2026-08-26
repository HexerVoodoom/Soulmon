// A FRONTEIRA DE CUIDADO DO DESKTOP.
//
// Por que este arquivo existe, e por que ele é fininho de propósito:
//
// O `menu.ts` é um módulo de DOM — ele faz `document.getElementById` no topo,
// então nenhum teste em `node` consegue importá-lo. Enquanto a decisão de
// cuidado morava lá dentro, ela era, na prática, INTESTÁVEL: foi assim que o
// `{ date: day, healed: 0 }` fixo (menu.ts:412) sobreviveu à fatia 2 inteira
// enquanto o app consertava exatamente o mesmo defeito no achado X-6.
//
// Aqui NÃO se decide nada de cuidado. Cada função é um adaptador: pega o
// GameState cru que veio do servidor (ou o estado local do overlay), veste ele
// no formato que as regras do app pedem, e chama a regra do app. As regras
// continuam inteiras em `src/utils/careRules.ts`, `careCaps.ts`,
// `careUpdaters.ts` e `playerDay.ts` — este arquivo só liga os fios.
//
// ⚠️ Footgun 9 do CLAUDE.md: regra copiada diverge em silêncio. Foi o que
// aconteceu com o teto de carinho. A resposta NÃO é copiar melhor, é não
// copiar: tudo abaixo importa do app.
import { applyRub, applyFeed, type CareCapsState } from '../../../src/utils/careUpdaters';
// `feedFood` entra direto (e não via `applyFeed`) porque o caminho SEM conta não
// tem `careCaps`: a janela de 1h dele é local por falta de save, não por opção.
import { feedFood } from '../../../src/utils/careRules';
import {
  rubRefusal, rubHealRecordFor, RUB_HEAL_STEP,
  type RubHealRecord, type FeedRefusal, type RubRefusal,
} from '../../../src/utils/careRules';
import { playerDayKey, sanitizePlayerDayAnchor } from '../../../src/utils/playerDay';
// O sono importa a regra inteira: `recordNight` nomeia a noite, decide `onTime`,
// é idempotente por manha e poda em MAX_NIGHTS. Nada disso se reescreve aqui.
import { recordNight, createRestState, type RestState } from '../../../src/utils/restWindow';
// O banho também: `cleanPoop` é a regra pura, e mora no MESMO arquivo que
// `applyPoopDrain` porque limpar é escrever os campos que o dreno lê.
import { cleanPoop } from '../../../src/utils/poopDrain';

/** O GameState como ele chega do servidor: JSON cru, sem tipo. */
export type RemoteState = Record<string, unknown>;

/**
 * O DIA DO JOGADOR do save remoto.
 *
 * Lê a âncora de fuso que o app grava no save (`playerDayTz`) e devolve a chave
 * na MESMA forma que o app usa (`toDateString()`, "Wed Aug 26 2026").
 *
 * Isto é uma restrição de FORMATO, não de estética: o desktop passou a gravar
 * `careCaps.rubHeal.date` no save que o celular lê. Se o desktop escrevesse a
 * chave antiga do overlay (`YYYY-MM-DD`, `state.ts:todayKey`), o
 * `rubHealRecordFor` do app receberia uma data que o `Date.parse` também
 * entende, mas de UM ANO ERRADO — e o registro do dia viraria "dia à frente"
 * para sempre, congelando o teto do celular. Divergir de formato quebra em
 * silêncio; é a restrição número 1 desta fronteira.
 *
 * Sem âncora no save, `playerDayKey` devolve `now.toDateString()` byte a byte —
 * o comportamento antigo, que é o que mantém save não-migrado funcionando.
 */
export function remoteDayKey(remote: RemoteState, now: Date): string {
  return playerDayKey(now, sanitizePlayerDayAnchor(remote.playerDayTz));
}

export type CareOutcome<R> =
  | { next: RemoteState; refused?: undefined }
  | { next: null; refused: R };

/**
 * Um carinho aplicado ao save REAL.
 *
 * O que este wrapper conserta, e o dano concreto: o `menu.ts` passava
 * `{ date: day, healed: 0 }` FIXO para `rubHeal`. Com o registro sempre zerado,
 * o ramo `daily-cap` de `rubRefusal` NUNCA disparava e o desktop também nunca
 * gravava o gasto de volta no save. Resultado medido em regra: o teto do
 * carinho era POR APARELHO — o jogador curava 1 coração no celular e mais 1 no
 * desktop, todo dia, e o teto de 1/dia do produto simplesmente não existia para
 * quem tem o overlay aberto. `applyRub` lê o registro de `prev.careCaps` e o
 * escreve de volta, que é o conserto do X-6 já pronto no app.
 */
export function remoteRub(remote: RemoteState, now: Date): CareOutcome<RubRefusal> {
  const day = remoteDayKey(remote, now);
  const r = applyRub(remote as unknown as CareCapsState, day);
  if (r.refused) return { next: null, refused: r.refused };
  return { next: r.state as unknown as RemoteState };
}

/**
 * Uma comida aplicada ao save REAL.
 *
 * Mesmo defeito, outro contador: a janela de 1h vinha de `state.feedTimes`, o
 * `localStorage` DO OVERLAY, e voltava para lá — nunca para `careCaps.feedTimes`
 * do save. Era o D-33 ("2 corações/dia e 12 comidas/hora em vez de 1 e 6")
 * intacto no desktop, meses depois de o app tê-lo fechado. `applyFeed` lê e
 * grava a janela no save.
 */
export function remoteFeed(remote: RemoteState, foodEmoji: string, now: number): CareOutcome<FeedRefusal> {
  const f = applyFeed(remote as unknown as CareCapsState, foodEmoji, now);
  if (f.refused) return { next: null, refused: f.refused };
  return { next: f.state as unknown as RemoteState };
}

// ───────────────────────────────────────────── caminho local (sem conta)

/** A fatia do estado do overlay que o carinho local lê e escreve. */
export interface LocalHearts {
  hearts: number;
  maxHearts: number;
  rubHeal?: RubHealRecord;
}

/**
 * Carinho SEM conta sincronizada, aplicado só ao estado do overlay.
 *
 * Continua existindo porque sem conta não há save onde escrever — é o único
 * jeito de o overlay fazer alguma coisa. Mas a CURA agora sai de `rubHeal`, a
 * regra do app, e não de um `hearts + 0.5` escrito à mão: o passo (`RUB_HEAL_STEP`)
 * e o teto (`RUB_HEAL_DAILY_CAP`, mais o traço Carinhoso) passam a ser os do
 * jogo. A chave do dia é `toDateString()`, o mesmo formato do save, para o
 * registro local poder ser comparado com o remoto sem tradução.
 */
export function localRub(
  local: LocalHearts,
  now: Date,
): { hearts: number; rubHeal: RubHealRecord | undefined; refused?: RubRefusal } {
  const day = playerDayKey(now, undefined);
  // `rubRefusal` e `RUB_HEAL_STEP`, e não `rubHeal`: o overlay sem conta não tem
  // um `CareState` (não há inventário, atributo nem estágio aqui dentro), só
  // corações. Chamar a DECISÃO do app com os números que existem é mais honesto
  // que fabricar um estado falso para caber na assinatura — e mantém o passo, o
  // teto e o traço Carinhoso vindos de lá, que era o que faltava.
  const record = rubHealRecordFor(local.rubHeal ?? null, day);
  const refused = rubRefusal(local.hearts, local.maxHearts, record, day);
  // Na recusa devolve a entrada INTACTA, igual aos updaters do app: quem chama
  // pode atribuir o resultado sem antes olhar o `refused` e nada anda para trás.
  if (refused) return { hearts: local.hearts, rubHeal: local.rubHeal, refused };
  return {
    hearts: Math.min(local.maxHearts, local.hearts + RUB_HEAL_STEP),
    rubHeal: { date: day, healed: record.healed + RUB_HEAL_STEP },
  };
}

// ─────────────────────────────────────────────────────── 🚿 banho e 💤 sono

/**
 * A NOITE do save, pronta para `recordNight`.
 *
 * Duas coisas acontecem aqui, e a segunda é a que quebra em silêncio:
 *
 * 1. o `rest` do JSON cru pode não existir (save nunca dormido) ou vir torto —
 *    `createRestState()` é o mesmo default do app, e `nights`/`dreams` só são
 *    aproveitados quando REALMENTE são listas. Um `nights: 'x'` chegando em
 *    `recordNight` lançaria `filter is not a function` e a ação morreria como
 *    "erro de rede" para o jogador;
 * 2. a ÂNCORA DO DIA é fiada para dentro do `rest`. `recordNight`, como
 *    `applyPoopDrain` e `applyRub`, lê a âncora do ESTADO e nunca por
 *    parâmetro — exatamente para quem esquece não voltar em silêncio ao dia do
 *    aparelho, compilando. No app essa fiação é uma linha do `hydrateRest`
 *    (`GameStateContext`), travada por guard de AST; no save cru ela não existe,
 *    e sem repeti-la o desktop nomearia a MANHÃ pelo relógio do aparelho —
 *    ressuscitando aqui o bug de noite duplicada que o app já fechou.
 *
 * A âncora do topo do save VENCE a que porventura esteja dentro do `rest`,
 * pela mesma razão do app: duas âncoras discordando dentro do mesmo save é
 * pior que nenhuma.
 */
export function remoteRestState(remote: RemoteState): RestState {
  const raw = (typeof remote.rest === 'object' && remote.rest !== null)
    ? remote.rest as Record<string, unknown>
    : {};
  const base = createRestState();
  const w = (typeof raw.window === 'object' && raw.window !== null)
    ? raw.window as Record<string, unknown>
    : {};
  const anchor = sanitizePlayerDayAnchor(remote.playerDayTz);
  return {
    ...raw,
    window: (typeof w.start === 'string' && typeof w.end === 'string')
      ? { start: w.start, end: w.end }
      : base.window,
    nights: Array.isArray(raw.nights) ? raw.nights as RestState['nights'] : [],
    dreams: Array.isArray(raw.dreams) ? raw.dreams as string[] : [],
    ...(anchor ? { playerDayTz: anchor } : {}),
  };
}

/**
 * Deitar: a noite entra no save REAL.
 *
 * O `doSleepToggle` do overlay só virava `state.sleeping`, um booleano do
 * `localStorage` DESTE aparelho. A cama era desenho: `rest.nights` nunca
 * recebia nada, então dormir pelo overlay não contava para a constância, para a
 * raridade do sonho nem para o pesadelo — o jogador que fecha o app e dorme com
 * o overlay aberto simplesmente não tinha noites.
 *
 * ⚠️ A JANELA CONTINUA NO RELÓGIO DO APARELHO, de propósito. `recordNight`
 * carimba `onTime` com `isWithinWindow`, que lê a hora de PAREDE local: deitar
 * cedo é um gesto do mundo real — é noite ONDE A PESSOA ESTÁ. A âncora do save
 * nomeia a MANHÃ (qual noite é esta), nunca julga a hora de deitar. Trocar uma
 * pela outra transformaria "dormi na hora" em uma conta sobre um fuso que o
 * jogador não está vivendo.
 *
 * Nunca recusa: o pior resultado possível de `recordNight` é uma noite com
 * `onTime: false`, que apenas não rende prêmio. Sono não tem penalidade.
 */
export function remoteSleep(remote: RemoteState, sleptAt: Date): RemoteState {
  return { ...remote, rest: recordNight(remoteRestState(remote), sleptAt) };
}

/**
 * Acordar: a MESMA noite ganha o `wokeAt`.
 *
 * `recordNight` é idempotente por dayKey da manhã, então isto ATUALIZA o
 * registro criado ao deitar em vez de criar um segundo — e com `wokeAt` em mãos
 * a manhã passa a ser literalmente a manhã, e não a inferida pela hora de
 * deitar.
 */
export function remoteWake(remote: RemoteState, sleptAt: Date, wokeAt: Date): RemoteState {
  return { ...remote, rest: recordNight(remoteRestState(remote), sleptAt, wokeAt) };
}

/** Já estava limpo — não há o que gravar, e gravar seria um POST por clique. */
export type ShowerRefusal = 'already-clean';

function numeros(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number') : [];
}

/**
 * O BANHO aplicado ao save REAL.
 *
 * O `doShower` do overlay não escrevia NADA: tocava a fala e a bolha 🫧 e
 * voltava. O dano é concreto e mensurável em corações — `applyPoopDrain` tira 1
 * coração a cada 6h de cocô não limpo, e o 🚿 é o ÚNICO jeito de parar esse
 * relógio (o `handleShower` do app existe exatamente para isso). O jogador com
 * o overlay aberto via o pet perder coração enquanto apertava o botão do banho.
 *
 * A DÍVIDA DECLARADA EM `86341fcb` ESTÁ PAGA. Até ela, esta era a única
 * transição do arquivo que não era um import: o banho não tinha regra pura em
 * `src/utils/` — morava inteiro no `App.tsx` (`handleCareEventComplete`),
 * acoplado ao `careEvent`, estado de React produzido pelo agendamento do
 * `useCareSystem`, coisa que o overlay não tem e não deveria ter. O commit
 * `46a6e542` extraiu `cleanPoop()` para `src/utils/poopDrain.ts` — que é
 * também o dono de `applyPoopDrain`, de propósito: limpar é escrever
 * exatamente os três campos que o dreno lê para decidir se cobra. Agora o
 * overlay DELEGA, e a única coisa que sobra aqui é o saneamento do JSON cru.
 *
 * Banho GERAL (`cleanPoop` sem `at`), e não por índice: o overlay não tem
 * `careEvent`, não sabe qual dos cocôs está na tela do celular, e o dreno não
 * distingue — para ele existe "tem sujeira" e "não tem". Essa é exatamente a
 * forma sem `at` que `cleanPoop` documenta como "o banho do OVERLAY".
 *
 * ⚠️ O `numeros()` continua existindo, e não é gordura: `cleanPoop` é genérica
 * em `T extends CleanPoopState`, que pede `number[]`/`number`; `RemoteState` é
 * `Record<string, unknown>` — JSON cru vindo do servidor, onde
 * `poopEventsShown` pode ser `undefined`, string ou lista com lixo dentro. O
 * saneamento é o que faz o contrato da regra valer de verdade em vez de valer
 * por um `as`. Só os DOIS campos que `cleanPoop` escreve voltam para o save: o
 * `poopEventsShown` cru é preservado byte a byte, porque sanear não é papel do
 * banho e reescrevê-lo seria o overlay editando o que não pediu para editar.
 */
export function remoteShower(remote: RemoteState): CareOutcome<ShowerRefusal> {
  const { state, refused } = cleanPoop({
    poopEventsShown: numeros(remote.poopEventsShown),
    poopEventsCompleted: numeros(remote.poopEventsCompleted),
    poopPenaltyClockAt: typeof remote.poopPenaltyClockAt === 'number' ? remote.poopPenaltyClockAt : 0,
  });
  // Sem `at` só existe uma recusa possível (`already-clean`); `not-scheduled` é
  // do banho por índice, que é o do celular. Os dois nomes já coincidem de
  // propósito — ver `CleanPoopRefusal`.
  if (refused) return { next: null, refused: 'already-clean' };
  return {
    next: {
      ...remote,
      poopEventsCompleted: state.poopEventsCompleted,
      poopPenaltyClockAt: state.poopPenaltyClockAt, // 0: para o relógio de 6h do dreno
    },
  };
}

/** A fatia do estado do overlay que a comida local lê e escreve. */
export interface LocalFeedState {
  /** Id da forma (`DesktopState.stage`) — é ele que decide o teto de energia. */
  stage: string;
  energy: number;
  foodInventory: Record<string, number>;
  feedTimes: number[];
}

/**
 * Comida SEM conta sincronizada, aplicada só ao estado do overlay.
 *
 * ⚠️ ERA A ÚLTIMA REGRA REIMPLEMENTADA DO `menu.ts`. A linha era
 * `state.energy = Math.min(state.maxEnergy, state.energy + 1)` (menu.ts:459),
 * escrita LOGO DEPOIS de chamar `feedFood` — que já calcula exatamente isso,
 * com `getMaxEnergyForStage(state.evolutionStage)`. Duas escritas da mesma
 * regra, o footgun 9 inteiro: o passo (`+ 1`) e o teto estavam escritos duas
 * vezes, e hoje coincidem por acidente feliz — `state.maxEnergy` do overlay é
 * preenchido por `cloudSync` com `getMaxEnergyForStage(stage)`, a MESMA função.
 * No dia em que o teto deixasse de ser "o requisito diário da escada" (um
 * bônus de item, um traço de nascimento, um estágio novo), o app mudaria numa
 * função e o overlay continuaria somando 1 até um número em cache.
 *
 * Por que aqui a resposta é VESTIR o estado e não repetir a decisão como em
 * `localRub`: o carinho tinha um problema que este não tem — `rubHeal` pede um
 * `CareState` inteiro só para consultar o traço Carinhoso, e o overlay não tem
 * traço nenhum, então fabricar o estado seria mentir sobre um dado que MUDA a
 * resposta. Aqui não: dos campos que faltam (atributos, XP, traço), NENHUM
 * altera a energia nem a recusa. `feedFood` os usa apenas para calcular o
 * ganho de atributo, que o overlay sem conta descarta — não há save onde
 * gravá-lo. Zerar o que não existe e ignorar o que sai é honesto; o que era
 * desonesto era o `state as unknown as CareState` do `menu.ts`, que entregava
 * um objeto SEM `evolutionStage` e SEM `virusPoints` e fazia a regra devolver
 * `energyPoints` calculado sobre `undefined` e atributos `NaN` — lixo que só
 * não aparecia porque o `menu.ts` jogava fora e recalculava a energia à mão.
 *
 * Na recusa devolve a entrada INTACTA, igual a `localRub` e aos updaters do app.
 */
export function localFeed(
  local: LocalFeedState,
  foodEmoji: string,
  now: number,
): { energy: number; foodInventory: Record<string, number>; feedTimes: number[]; refused?: FeedRefusal } {
  const f = feedFood({
    // O que o overlay TEM, com o nome que a regra usa:
    evolutionStage: local.stage,
    energyPoints: local.energy,
    foodInventory: local.foodInventory,
    // O que o overlay não tem e a regra não consulta para decidir — só soma e
    // devolve. Sem conta não há save para receber esses pontos; eles morrem
    // aqui, como já morriam (só que como `NaN`).
    healthPoints: 0, maxHealthPoints: 0,
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
  }, foodEmoji, local.feedTimes, now);

  if (f.refused) {
    return {
      energy: local.energy,
      foodInventory: local.foodInventory,
      // `feedTimes` PODADO mesmo na recusa: é o contrato de `feedFood`, e sem
      // ele os timestamps vencidos cresceriam para sempre no localStorage.
      feedTimes: f.feedTimes,
      refused: f.refused,
    };
  }
  return {
    // O teto e o passo saem de `feedFood`, que é o ponto desta fatia.
    energy: f.state.energyPoints,
    foodInventory: f.state.foodInventory,
    feedTimes: f.feedTimes,
  };
}
