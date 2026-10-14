/**
 * ONDE FICA O Z DO SONO (14/10/2026, dono: "os Zs estão muito altos, quase fora da área visível").
 *
 * O grupo do pet cresce `zoom` (CENA_ZOOM) com origem na linha dos pés (`footY`), então um ponto a `y` no grupo aparece na tela em
 * `footY + (y - footY) * zoom`. O Z ancorado "acima da cabeça" caía em y < 0 da tela (cabeça de forma alta = topo do palco). A regra:
 * o Z NUNCA passa do topo visível do palco (`margin` px de folga, em px de TELA) e fica ao LADO da cabeça (à direita do centro do sprite,
 * sobre a quina de cima), nunca sobre o rosto. Funciona igual para qualquer forma (a caixa do sprite é a mesma) e com ou sem altitude
 * (`airLiftPx`: o sprite sobe, o Z sobe junto até bater no teto).
 *
 * Tudo em px do GRUPO (sem zoom), salvo `margin`. Puro: o teste (`sleepZ.test.ts`) cobre sem montar o HUD.
 */
export interface SleepZInput {
  /** Y dos pés do sprite no grupo (borda de baixo da caixa do sprite). */
  footY: number;
  /** Lado da caixa do sprite renderizado (`PET_RENDER`). */
  spriteBox: number;
  /** Lado do Z. */
  size: number;
  zoom: number;
  /** Quanto o sprite sobe quando `voando` (0 no chão). */
  airLiftPx?: number;
  /** Folga mínima do topo da TELA, em px de tela. */
  margin?: number;
}

export interface SleepZPlacement {
  /** Topo do Z no grupo (px a partir do topo do palco). */
  top: number;
  /** Deslocamento do canto esquerdo do Z a partir do CENTRO do pet. */
  dx: number;
  /** Topo do Z na TELA, já com zoom (≥ margin). */
  screenTop: number;
}

export function sleepZPlacement({ footY, spriteBox, size, zoom, airLiftPx = 0, margin = 4 }: SleepZInput): SleepZPlacement {
  const headTop = footY - spriteBox - airLiftPx;
  const wanted = headTop + size * 0.2; // quina de cima do sprite, não acima dele
  const minTop = footY - (footY - margin) / zoom; // o que, depois do zoom, dá `margin` na tela
  const top = Math.max(wanted, minTop);
  return { top, dx: spriteBox / 2 - size * 0.45, screenTop: footY + (top - footY) * zoom };
}
