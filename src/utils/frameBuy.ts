import { frameById, FRAMES_MAX_OWNED } from './frames';
import { spendBitsPaidFirst, type BitsOrigin } from './bitsOrigin';

/**
 * A COMPRA de uma MOLDURA de avatar na lojinha do Mercado (C3), no molde de `shopBuy.ts`: a recusa é
 * reconferida sobre o `prev` (dois toques no mesmo lote com saldo == preço não cobram duas vezes nem
 * duplicam a posse). Só moldura `origin: 'shop'` (preço em Bits) é vendável; moldura de rank, conquista
 * e evento nunca se compra. Cosmética pura: não toca em nenhum outro campo da economia.
 */
export type FrameBuyRefusal = 'not-for-sale' | 'already-owned' | 'no-funds' | 'full';

export interface FrameBuyState {
  gamePoints?: number;
  bitsOrigin?: BitsOrigin;
  ownedFrames?: string[];
}

export function frameBuyRefusal(state: FrameBuyState, frameId: string): FrameBuyRefusal | undefined {
  const f = frameById(frameId);
  if (!f || f.origin !== 'shop' || typeof f.price !== 'number') return 'not-for-sale';
  const owned = state.ownedFrames ?? [];
  if (owned.includes(f.id)) return 'already-owned';
  if ((state.gamePoints ?? 0) < f.price) return 'no-funds';
  if (owned.length >= FRAMES_MAX_OWNED) return 'full';
  return undefined;
}

export function applyFrameBuy<T extends FrameBuyState>(prev: T, frameId: string): { state: T; refused?: FrameBuyRefusal } {
  const refused = frameBuyRefusal(prev, frameId);
  if (refused) return { state: prev, refused };
  const price = frameById(frameId)!.price!;
  const next: T = spendBitsPaidFirst({ ...prev, gamePoints: (prev.gamePoints ?? 0) - price }, price);
  next.ownedFrames = [...(prev.ownedFrames ?? []), frameId];
  return { state: next };
}
