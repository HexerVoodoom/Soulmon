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
export declare function pushCopy(
  brtHour: number,
  petName: string,
  language: string,
  /** WP1.17 — idade da criatura em dias. Ausente = copy de sempre. */
  ageDays?: number | null,
): PushCopy | null;
