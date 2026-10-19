/**
 * Tipos do DONO ÚNICO da copy de push (`_pushCopy.js`).
 *
 * O arquivo é `.js` porque roda em três lugares que não compartilham build:
 * Pages Functions, worker de push (deploy manual) e o cliente. A declaração
 * existe para o cliente (TS) poder importá-lo sem `any` — e é o `any` que
 * deixaria uma mudança de forma passar sem quebrar nada.
 */
export declare const PUSH_HOURS_BRT: number[];
export declare const PUSH_HOURS_UTC: number[];

export interface PushCopy {
  title: string;
  body: string;
  tag: string;
}

/** `null` quando a hora não tem notificação — quem chama NÃO inventa fallback. */
/** WP3.11 — o lembrete de deitar. A hora sai da janela da pessoa, não daqui. */
export declare function sleepReminderCopy(
  petName: string,
  language: string,
): PushCopy;

export declare function pushCopy(
  brtHour: number,
  petName: string,
  language: string,
  /** WP1.17 — idade da criatura em dias. Ausente = copy de sempre. */
  ageDays?: number | null,
): PushCopy | null;

/** O aviso das 20h. Só o TEXTO mora aqui; a condição fica no cliente, porque
 *  o worker não sabe se a meta do dia foi cumprida. */
export declare function eveningCopy(
  petName: string,
  language: string,
  hpBaixo: boolean,
): PushCopy;

export type MealInviteKind = 'snack' | 'poop' | 'pet' | 'tenSeconds';
export declare const MEAL_INVITE_KINDS: readonly MealInviteKind[];
/** Os tipos que um PUSH pode sortear — o worker não sabe se há cocô na tela. */
export declare const MEAL_PUSH_KINDS: readonly MealInviteKind[];
export declare const MEAL_PUSH_TAGS: readonly string[];

/** Convite de refeição (push E cartão do app): UMA fonte de texto. */
export declare function mealInviteCopy(
  meal: 'breakfast' | 'lunch' | 'dinner',
  kind: MealInviteKind,
  petName: string,
  language: string,
): PushCopy;

/** O tipo que o push daquele dia/refeição sorteia (determinístico). */
export declare function mealPushKind(meal: 'breakfast' | 'lunch' | 'dinner', dayKey: string): MealInviteKind;

/** REGISTRO §113 — copy dos pushes de evento. Só convite, nunca culpa nem medo. */
export declare const EVENT_PUSH_TAGS: { hunger: string; energyFull: string; progress: string };
export declare function hungerInviteCopy(petName: string, language: string): PushCopy;
export declare function energyFullCopy(petName: string, language: string): PushCopy;
export declare function poopPushCopy(petName: string, language: string, index?: number): PushCopy;
export declare function progressCopy(petName: string, language: string): PushCopy;
