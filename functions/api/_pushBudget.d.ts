/** Tipos do DONO ÚNICO do teto/prioridade de push (`_pushBudget.js`). */
export type PushKind =
  | 'poop' | 'hunger' | 'energyFull' | 'sleep' | 'meal' | 'generic' | 'progress';

export interface PushCandidate {
  id: string;
  kind: PushKind;
  /** Instante do push (epoch ms). */
  at: number;
  /** Já entregue hoje / inevitável: fica sempre e conta no teto. */
  committed?: boolean;
}

export declare const PUSH_KINDS_BY_PRIORITY: readonly PushKind[];
export declare const PROGRESS_PUSH_MAX_PER_DAY: number;
export declare function pushPriority(kind: string): number;
export declare function capPushes<T extends PushCandidate>(
  candidates: readonly T[],
  cap?: number,
): { kept: T[]; dropped: T[] };
