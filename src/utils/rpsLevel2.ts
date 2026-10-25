/** PPT nível 2: cada lado tem 3 pedras, 3 papéis e 3 tesouras; peça jogada fica usada. Funções puras. */
export type RpsHand = 0 | 1 | 2;
export type RpsInventory = [number, number, number];
export const RPS_PIECES_PER_TYPE = 3;
export const freshInventory = (): RpsInventory => [RPS_PIECES_PER_TYPE, RPS_PIECES_PER_TYPE, RPS_PIECES_PER_TYPE];
export const spendPiece = (inv: RpsInventory, hand: RpsHand): RpsInventory => {
  const next: RpsInventory = [inv[0], inv[1], inv[2]];
  next[hand] = Math.max(0, next[hand] - 1);
  return next;
};
export const remainingTypes = (inv: RpsInventory): RpsHand[] =>
  ([0, 1, 2] as RpsHand[]).filter(h => inv[h] > 0);
export const totalPieces = (inv: RpsInventory): number => inv[0] + inv[1] + inv[2];
/** Inimigo só escolhe entre o que lhe resta (rng injetável para teste). */
export function petPick(inv: RpsInventory, rng: () => number = Math.random): RpsHand | null {
  const opts = remainingTypes(inv);
  if (!opts.length) return null;
  return opts[Math.min(opts.length - 1, Math.floor(rng() * opts.length))];
}
