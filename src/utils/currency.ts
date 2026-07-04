// 🪙 Minigame currency — "Bits". Earned in the Activities games (GameState.gamePoints,
// kept as the internal field name) and spent in the shop. One place for the icon
// and name so every screen reads consistently.
export const BITS_ICON = '🪙';
export const BITS_NAME = 'Bits';

/** "🪙 250" — icon + amount. */
export function bitsLabel(n: number): string {
  return `${BITS_ICON} ${n}`;
}
