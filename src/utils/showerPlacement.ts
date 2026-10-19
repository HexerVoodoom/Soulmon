/**
 * ONDE FICA O CHUVEIRINHO DO BANHO (D-11, 19/10/2026: "o chuveirinho aparece fora da tela").
 *
 * Mesma geometria do Z do sono (`sleepZ.ts`): o grupo do pet cresce `zoom` (CENA_ZOOM) com origem na linha dos pés (`footY`), então um ponto
 * a `y` no grupo aparece na tela em `footY + (y - footY) * zoom`. O chuveiro ficava 26px ACIMA da caixa do sprite (`top: -26px`), o que no palco
 * de 250px com zoom 1,5 dá y de tela negativo — fora da área visível, em qualquer estágio (a caixa do sprite é a mesma do rookie ao ultra).
 * A regra: o chuveiro NUNCA passa do topo visível do palco (`margin` px de folga, em px de TELA) e fica centrado sobre a cabeça.
 *
 * `top` e `dropTop` vêm em px a partir do topo da CAIXA do sprite (o contêiner `absolute inset-0` do banho); `screenTop` é o topo do
 * chuveiro na TELA. Puro: `showerPlacement.test.ts` cobre sem montar o HUD.
 */
export interface ShowerInput {
  /** Y dos pés do sprite no grupo (borda de baixo da caixa do sprite). */
  footY: number;
  /** Lado da caixa do sprite renderizado (`PET_RENDER`). */
  spriteBox: number;
  /** Lado do chuveiro. */
  size: number;
  zoom: number;
  /** Quanto o sprite sobe quando `voando` (0 no chão). */
  airLiftPx?: number;
  /** Folga mínima do topo da TELA, em px de tela. */
  margin?: number;
}

export interface ShowerPlacement {
  /** Topo do chuveiro, em px a partir do topo da caixa do sprite. */
  top: number;
  /** Onde as gotas nascem (logo abaixo do bocal), na mesma referência de `top`. */
  dropTop: number;
  /** Topo do chuveiro na TELA, já com zoom (>= margin). */
  screenTop: number;
  /** Base do chuveiro na TELA. */
  screenBottom: number;
}

export function showerPlacement({ footY, spriteBox, size, zoom, airLiftPx = 0, margin = 4 }: ShowerInput): ShowerPlacement {
  const boxTop = footY - spriteBox;
  const headTop = boxTop - airLiftPx;
  const wanted = headTop - size * 0.6; // por cima da cabeça, sobrepondo só a quina — não 26px de ar vazio
  const minTop = footY - (footY - margin) / zoom; // o que, depois do zoom, dá `margin` na tela
  const topInGroup = Math.max(wanted, minTop);
  const top = topInGroup - boxTop;
  return {
    top,
    dropTop: top + size * 0.8,
    screenTop: footY + (topInGroup - footY) * zoom,
    screenBottom: footY + (topInGroup + size - footY) * zoom,
  };
}
