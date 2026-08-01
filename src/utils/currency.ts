// Minigame currency — "Bits" (internal field stays GameState.gamePoints).
// Rendered with NO icon: just the name/number in a calculator-LCD look —
// monospace, neon green, subtle glow.
import type { CSSProperties } from 'react';

export const BITS_NAME = 'Bits';
export const BITS_COLOR = '#39ff14';

/** Calculator/LCD style for the Bits wallet readouts (dark/retro themes). */
export const bitsStyle: CSSProperties = {
  fontFamily: "'Courier New', ui-monospace, monospace",
  color: BITS_COLOR,
  textShadow: '0 0 6px rgba(57,255,20,0.75)',
  letterSpacing: '1.5px',
  fontWeight: 700,
};

/**
 * Mesma leitura de calculadora, legível no tema claro.
 *
 * Por que existe: no tema padrão os Bits estavam sendo desenhados com o ícone
 * 💎 — o MESMO dos Créditos, que são comprados com dinheiro real. As duas
 * moedas ficavam visualmente idênticas, e o jogador não tinha como saber que os
 * créditos que ele pagou não compram nada na loja (a loja gasta Bits). O verde
 * neon do `bitsStyle` some no fundo branco, daí um verde mais fechado.
 */
export const BITS_COLOR_LIGHT = '#1b8f3a';
export const bitsStyleLight: CSSProperties = {
  fontFamily: "'Courier New', ui-monospace, monospace",
  color: BITS_COLOR_LIGHT,
  letterSpacing: '1px',
  fontWeight: 700,
};
