import { heartLossCap } from './passives';
import { playerDayKey, type PlayerDayAnchor } from './playerDay';
import {
  MAX_HEARTS_LOST_PER_DAY,
  ABSENCE_FORGIVENESS_DAYS,
  daysSinceLastReset,
} from './dailyReset';

// Dreno de cocô como função PURA — o dono único da regra.
//
// Por que existe: a subtração vivia dentro de um `setGameState` de `useEffect`
// no `App.tsx` (`healthPoints: Math.max(0, prev.healthPoints - periods)`), fora
// de `computeDailyReset()`. Por morar fora, escapava das TRÊS travas que a
// virada do dia respeita — `MAX_HEARTS_LOST_PER_DAY`, o traço **Teimoso**
// (`heartLossCap`) e o perdão por ausência (`ABSENCE_FORGIVENESS_DAYS`). Era a
// única perda de HP sem teto do jogo: 24h de cocô na tela custavam 4 corações
// (zerando o pet) num dia em que a regra escrita permitia 1 — e quem voltava de
// 2 dias fora era cobrado retroativamente pelas horas em que não estava lá,
// exatamente o instante que o perdão foi criado para proteger.
// Ver `squad-alpha-runs/soulmon-01/discovery/verificacao-V1.md` (decisão D-09).
//
// ⚠️ O QUE O DRENO **NÃO** RESPEITA, e é decisão do dono (08/09/2026): a folga
// da semana (`REST_DAYS_PER_WEEK`, `utils/dailyReset.ts`). Ela absorve a perda
// da VIRADA DO DIA e só ela. O motivo é que o dreno cobra presença com
// descuido — só tira coração de quem abriu o app, viu o cocô e não deu banho —
// enquanto a folga existe para perdoar AUSÊNCIA. E as três travas de cima já
// limitam o estrago. Se isto mudar, mude o docstring de `REST_DAYS_PER_WEEK`
// junto: as duas explicações têm de contar a mesma história.
//
// Aqui, como em `careRules.ts`: recebe estado e devolve estado, sem React, sem
// `Date.now()` interno, sem localStorage. Quem chama cuida de efeito e
// persistência. Este arquivo NÃO inventa número nenhum — as constantes
// continuam sendo de `dailyReset.ts` e o traço de `passives.ts`.

/** Um tick de dreno = 6h de cocô não limpo. */
export const POOP_DRAIN_PERIOD_MS = 6 * 3600000;

/** Corações cobrados por período de 6h, ANTES do teto diário. */
export const POOP_DRAIN_HEARTS_PER_PERIOD = 1;

/** Dormindo o relógio é só empurrado; persistir a cada ≥5min evita que o
 *  bump vire spam de cloud save a noite inteira (ver CLAUDE.md, arquitetura). */
export const SLEEP_CLOCK_BUMP_MS = 5 * 60000;

/** Quanto já foi cobrado pelo dreno no dia civil — é o que faz o teto ser
 *  DIÁRIO e não por tick: sem isso, bastavam quatro ticks de 6h para o dia
 *  custar 4 corações, cada um "dentro" do teto. */
export interface PoopDrainCharge {
  /** Chave do DIA DO JOGADOR (`utils/playerDay.ts`), forma de `toDateString()`. */
  day: string;
  hearts: number;
}

/** Fatia do GameState que esta regra lê e escreve. */
export interface PoopDrainState {
  healthPoints: number;
  poopEventsShown?: number[];
  poopEventsCompleted?: number[];
  poopPenaltyClockAt: number;
  poopDrainCharge?: PoopDrainCharge;
  /** Traço de nascimento — lido do ESTADO, nunca por parâmetro novo, para o
   *  desktop herdar o efeito sem uma segunda implementação. */
  petPassive?: string;
  /** Data da última virada; é dela que sai a leitura de ausência. */
  lastResetDate?: string;
  /**
   * Fuso FIXO do dia do jogador (`utils/playerDay.ts`). Lido do ESTADO, e não
   * por um parâmetro novo em `PoopDrainOptions`, pela mesma razão do
   * `petPassive` logo acima: parâmetro é coisa que quem chama esquece, e um
   * chamador que esquecesse voltaria em silêncio ao dia do APARELHO — que é
   * exatamente o bug. Vindo do estado, o desktop e o celular herdam a âncora
   * sem uma segunda fiação.
   */
  playerDayTz?: PlayerDayAnchor;
}

export interface PoopDrainOptions {
  /** Epoch ms. Sempre por parâmetro — a função não olha o relógio sozinha. */
  now: number;
  isSleeping: boolean;
}

/**
 * Corações já cobrados HOJE pelo dreno.
 *
 * "Hoje" é o dia do JOGADOR, não o do aparelho. Com `toDateString()` o teto
 * diário do dreno era furável por troca de fuso do mesmo jeito que o teto de
 * carinho era (achado X-4): `poopDrainCharge` mora no SAVE, e o aparelho que
 * lesse um `day` com outro nome achava que o dia do teto ainda não tinha
 * começado — devolvendo ao dreno o direito de cobrar o teto INTEIRO de novo, em
 * corações de verdade.
 */
export function chargedToday(state: PoopDrainState, now: number): number {
  const charge = state.poopDrainCharge;
  if (!charge || charge.day !== playerDayKey(new Date(now), state.playerDayTz)) return 0;
  return Math.max(0, charge.hearts);
}

/** Quanto o dreno ainda PODE cobrar hoje (0 = o teto do dia já foi gasto).
 *  Usado também pelo aviso de ~30min: avisar de um tick que não vai cobrar
 *  nada é assustar de graça — e o Soulmon não é cobrador. */
export function remainingDrainToday(state: PoopDrainState, now: number): number {
  const cap = heartLossCap(state.petPassive, MAX_HEARTS_LOST_PER_DAY);
  return Math.max(0, cap - chargedToday(state, now));
}

/**
 * Aplica o dreno de cocô ao estado. Devolve o MESMO objeto quando nada muda
 * (o chamador está dentro de um updater de `setGameState`; devolver `prev` é o
 * que evita re-render à toa).
 */
export function applyPoopDrain<T extends PoopDrainState>(state: T, opts: PoopDrainOptions): T {
  const { now, isSleeping } = opts;
  const shown = state.poopEventsShown || [];
  const cleaned = state.poopEventsCompleted || [];
  const hasUncleanPoop = shown.some(i => !cleaned.includes(i));
  const clock = state.poopPenaltyClockAt ?? 0;

  // Banho tomado / nenhum cocô na tela: o relógio para.
  if (!hasUncleanPoop) {
    return clock === 0 ? state : { ...state, poopPenaltyClockAt: 0 };
  }

  // Dormindo não cobra — só empurra o relógio (com throttle de persistência).
  if (isSleeping) {
    if (clock !== 0 && now - clock < SLEEP_CLOCK_BUMP_MS) return state;
    return { ...state, poopPenaltyClockAt: now };
  }

  // Relógio parado: começa a contar agora.
  if (clock === 0) return { ...state, poopPenaltyClockAt: now };

  // Ausência ≥ ABSENCE_FORGIVENESS_DAYS: quem volta encontra saudade, não
  // fatura. O relógio é REANCORADO em `now` (e não acumulado), senão a próxima
  // passagem cobraria a mesma ausência que acabou de ser perdoada.
  if (daysSinceLastReset(state.lastResetDate, new Date(now)) >= ABSENCE_FORGIVENESS_DAYS) {
    return { ...state, poopPenaltyClockAt: now };
  }

  const periods = Math.floor((now - clock) / POOP_DRAIN_PERIOD_MS);
  if (periods <= 0) return state;

  // Teto do dia, com o traço Teimoso valendo aqui como vale na virada.
  const cap = heartLossCap(state.petPassive, MAX_HEARTS_LOST_PER_DAY);
  const already = chargedToday(state, now);
  const lost = Math.min(periods * POOP_DRAIN_HEARTS_PER_PERIOD, Math.max(0, cap - already));

  // Sempre reancora em `now`: o resto dos períodos é PERDOADO, não guardado
  // para o próximo tick — guardar seria o teto voltando a vazar por fora.
  if (lost <= 0) return { ...state, poopPenaltyClockAt: now };

  return {
    ...state,
    healthPoints: Math.max(0, state.healthPoints - lost),
    poopPenaltyClockAt: now,
    poopDrainCharge: { day: playerDayKey(new Date(now), state.playerDayTz), hearts: already + lost },
  };
}

// ── O BANHO ────────────────────────────────────────────────────────────────
//
// Mora AQUI, e não num arquivo próprio, porque limpar é escrever exatamente as
// três coisas que `applyPoopDrain` lê para decidir se cobra: `poopEventsShown`,
// `poopEventsCompleted` e `poopPenaltyClockAt`. Separar a leitura da escrita em
// dois arquivos é como a regra ganha duas donas e diverge em silêncio.
//
// Existe porque o commit 86341fcb declarou a dívida por escrito ao ligar o
// banho no overlay do desktop: no app não havia regra pura de banho — ela vivia
// inteira no `App.tsx` (`handleCareEventComplete`), acoplada ao `careEvent`,
// estado de React produzido pelo agendamento do `useCareSystem`, que o overlay
// não tem e não deveria ter. Sem função para importar, o desktop refez o
// trabalho à mão.
//
// As DUAS formas do banho estão aqui de propósito, e não são um `if` de
// conveniência:
//  - **com `at`** é o banho do CELULAR. O `careEvent` sabe o HORÁRIO AGENDADO
//    do cocô que está na tela, não o índice; achar o índice é regra, e era ela
//    que estava solta no `App.tsx`.
//  - **sem `at`** é o banho do OVERLAY. Ele não tem `careEvent` e não sabe qual
//    dos cocôs está na tela do celular — e o dreno não distingue: para ele
//    existe "tem sujeira" e "não tem". Um banho que limpasse só um deixaria o
//    relógio correndo com o pet visivelmente limpo.

/** Por que o banho não escreveu nada. Nunca é erro — é "não havia o que fazer". */
export type CleanPoopRefusal = 'not-scheduled' | 'already-clean';

/** Fatia do estado que o banho lê e escreve. */
export interface CleanPoopState {
  poopEventsScheduled?: number[];
  poopEventsShown?: number[];
  poopEventsCompleted?: number[];
  poopPenaltyClockAt: number;
}

export interface CleanPoopOptions {
  /** Horário agendado (`careEvent.requestTime`) do cocô que está na tela.
   *  Ausente = banho geral, o do overlay. */
  at?: number;
}

/**
 * Dá banho. Devolve o MESMO objeto quando nada mudaria — o chamador do app está
 * dentro de um `setGameState`, e devolver `prev` é o que evita re-render à toa.
 *
 * O relógio de 6h SEMPRE para, mesmo quando sobra cocô sujo: é o que o
 * `handleCareEventComplete` sempre fez, e quem decide se ele volta a correr é
 * `applyPoopDrain` na passagem seguinte — não esta função.
 */
export function cleanPoop<T extends CleanPoopState>(
  state: T,
  opts: CleanPoopOptions = {},
): { state: T; refused?: CleanPoopRefusal } {
  const cleaned = state.poopEventsCompleted ?? [];
  const clock = state.poopPenaltyClockAt ?? 0;

  const alvos = opts.at === undefined
    ? (state.poopEventsShown ?? []).filter(i => !cleaned.includes(i))
    : (() => {
        const i = (state.poopEventsScheduled ?? []).indexOf(opts.at!);
        // Guarda contra -1: a virada do dia pode ter limpado a agenda no meio
        // do evento, e aí não há cocô nenhum a que este gesto se refira.
        if (i < 0) return null;
        return cleaned.includes(i) ? [] : [i];
      })();

  if (alvos === null) return { state, refused: 'not-scheduled' };
  if (alvos.length === 0 && clock === 0) return { state, refused: 'already-clean' };

  return {
    state: {
      ...state,
      poopEventsCompleted: alvos.length === 0 ? cleaned : [...cleaned, ...alvos],
      poopPenaltyClockAt: 0,
    },
  };
}
