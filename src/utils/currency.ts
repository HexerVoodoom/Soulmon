// Minigame currency — "Bits" (internal field stays GameState.gamePoints).
// Rendered with NO icon: just the name/number in a calculator-LCD look —
// monospace, neon green, subtle glow.
import type { CSSProperties } from 'react';

export const BITS_NAME = 'Bits';
export const BITS_COLOR = '#39ff14';

/** Calculator/LCD style for the Bits wallet readouts. */
export const bitsStyle: CSSProperties = {
  fontFamily: "'Courier New', ui-monospace, monospace",
  color: BITS_COLOR,
  textShadow: '0 0 6px rgba(57,255,20,0.75)',
  letterSpacing: '1.5px',
  fontWeight: 700,
};
