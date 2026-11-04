/**
 * TABELA DE PREÇO DA DECORAÇÃO (04/11/2026, dono: "aumenta o preço igual fizemos nos backgrounds:
 * uns 2×, uns 3×, uns 5×"). `old` é o preço antes da mudança; o preço vivo mora em `utils/shop.ts`
 * e `decorPrices.test.ts` prova que `price === old × tier` para cada linha.
 *
 * Critério objetivo da faixa (riqueza da arte + raridade da peça):
 *  · 2× — textura de chão ou adereço simples, uma cor, sem luz própria (grama, areia, pedra, vaso...).
 *  · 3× — móvel/peça trabalhada ou com luz/movimento próprio (sofá, estante, fogueira, lanterna...).
 *  · 5× — peça arcana/rara de vitrine, com magia ou mecanismo (caldeirão, cristal, ampulheta, poço, fliperama).
 * Posse é permanente: quem já comprou segue dono — só o preço de quem compra daqui em diante muda.
 */
export type DecorTier = 2 | 3 | 5;

export const DECOR_PRICE_TABLE: ReadonlyArray<{ id: string; old: number; tier: DecorTier; reason: string }> = [
  { id: 'furn-cauldron', old: 130, tier: 5, reason: 'arcano, borbulha (magia ativa)' },
  { id: 'furn-crystal', old: 120, tier: 5, reason: 'cristal arcano, peça rara de vitrine' },
  { id: 'furn-hourglass', old: 130, tier: 5, reason: 'mecanismo de tempo, arte rica' },
  { id: 'furn-arcade-cab', old: 140, tier: 5, reason: 'máquina com tela/luz, peça rara' },
  { id: 'furn-well', old: 140, tier: 5, reason: 'construção de pedra grande, centro de cena' },
  { id: 'furn-sofa', old: 100, tier: 3, reason: 'móvel trabalhado' },
  { id: 'furn-chair', old: 120, tier: 3, reason: 'móvel trabalhado' },
  { id: 'furn-books', old: 120, tier: 3, reason: 'móvel com muitos detalhes' },
  { id: 'furn-lamp', old: 100, tier: 3, reason: 'luz própria' },
  { id: 'furn-picture', old: 130, tier: 3, reason: 'retrato do Soulmon, peça de parede' },
  { id: 'furn-tent', old: 140, tier: 3, reason: 'peça grande de exterior' },
  { id: 'furn-campfire', old: 120, tier: 3, reason: 'luz/fogo próprio' },
  { id: 'furn-lantern', old: 110, tier: 3, reason: 'luz própria' },
  { id: 'furn-mushrooms', old: 110, tier: 3, reason: 'bioluminescente' },
  { id: 'furn-window', old: 120, tier: 3, reason: 'peça de parede com paisagem' },
  { id: 'furn-wind-chime', old: 110, tier: 3, reason: 'peça de parede com movimento' },
  { id: 'furn-clock', old: 130, tier: 3, reason: 'mecanismo de parede' },
  { id: 'furn-circuit-mat', old: 140, tier: 3, reason: 'chão com padrão luminoso' },
  { id: 'furn-rug', old: 140, tier: 3, reason: 'chão com estampa desenhada' },
  { id: 'furn-plant', old: 100, tier: 2, reason: 'adereço simples' },
  { id: 'furn-rock', old: 100, tier: 2, reason: 'adereço simples' },
  { id: 'furn-grass', old: 110, tier: 2, reason: 'textura de chão' },
  { id: 'furn-sand', old: 110, tier: 2, reason: 'textura de chão' },
  { id: 'furn-stone-tiles', old: 130, tier: 2, reason: 'textura de chão' },
  { id: 'furn-deck', old: 130, tier: 2, reason: 'textura de chão' },
  { id: 'furn-food-bowl', old: 100, tier: 2, reason: 'adereço simples' },
  { id: 'furn-garland', old: 100, tier: 2, reason: 'adereço simples de parede' },
];
