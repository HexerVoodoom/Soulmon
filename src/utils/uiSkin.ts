/**
 * Interface do app: "pele" visual escolhida pelo jogador (`data-ui` no <html>).
 *
 * - `arte`    = padrão, com as molduras e os botões ilustrados.
 * - `minimal` = modais e botões só em CSS/SVG, sem arte e sem borda.
 *
 * É uma UNIÃO nomeada (não um booleano) de propósito: pode haver uma 3ª pele.
 * Mesmo molde do tema (`ThemeContext` + `data-theme`): o atributo inicial é
 * posto por um script inline em `index.html` antes da 1ª pintura.
 */
export type UiSkin = 'arte' | 'minimal';

export const UI_SKINS: readonly UiSkin[] = ['arte', 'minimal'];

export const DEFAULT_UI_SKIN: UiSkin = 'arte';

/**
 * Mostra a opção "Interface" em Configurações? Fica DESLIGADA até a fase 2
 * (a pele minimalista de verdade) mergear. Com ela desligada o contexto e o
 * atributo `data-ui` já funcionam; só o seletor não aparece. Para ligar: troque
 * para `true` neste arquivo (um PR de uma linha).
 */
export const UI_SKIN_OPTION_ENABLED = false;

/** Valor ausente, inválido ou de tipo estranho vira o padrão ('arte'). */
export function parseUiSkin(raw: unknown): UiSkin {
  return typeof raw === 'string' && (UI_SKINS as readonly string[]).includes(raw)
    ? (raw as UiSkin)
    : DEFAULT_UI_SKIN;
}

/** Esta pele desenha as molduras de arte (modais, folhas, telas)? Só a 'arte'; a 'minimal' é a folha lisa em CSS. */
export function molduraDaPele(skin: UiSkin): boolean {
  return skin === 'arte';
}
