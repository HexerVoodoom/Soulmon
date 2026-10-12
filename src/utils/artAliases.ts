/**
 * ARTE EMPRESTADA — itens novos que, por ora, usam a arte de um item existente.
 *
 * O conjunto cosmético do trimestre da assinatura (`SUBSCRIPTION_ITEMS`,
 * `utils/shop.ts`) nasce sem arte própria: o dono pediu para reaproveitar o que
 * já existe. O ITEM é outro (id, nome e posse próprios, vendido por outra porta);
 * só a imagem é a mesma. Quando a leva de arte do trimestre chegar, a entrada
 * daqui sai e o PNG novo entra em `backgrounds.ts`/`decorArt.ts` — nada mais muda.
 *
 * Este arquivo é DADO. Quem aplica é o fim de `backgrounds.ts` e de `decorArt.ts`.
 */

/** Cenário novo → cenário cuja pintura ele usa, mais o nome DELE. */
export const BG_ART_ALIASES: Readonly<Record<string, { from: string; namePt: string; nameEn: string }>> = {
  'bg-sub-2026q4-lago': { from: 'bg-lakeside', namePt: 'Lago das Lanternas', nameEn: 'Lantern Lake' },
  'bg-sub-2026q4-loft': { from: 'bg-cozy-loft', namePt: 'Sótão da Lareira', nameEn: 'Hearth Loft' },
};

/** Decoração nova → decoração cuja arte ela usa. */
export const DECOR_ART_ALIASES: Readonly<Record<string, string>> = {
  'furn-sub-2026q4-lanterna': 'furn-lantern',
  'furn-sub-2026q4-guirlanda': 'furn-garland',
  'furn-sub-2026q4-sino': 'furn-wind-chime',
};
